import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

import NODE_METADATA from "../config/nodeMetadata";
import { getCatalogs } from "../services/backendApi";
import { getBaseNodeType } from "../utils/nodeTypes";

const DEFAULT_MACHINE = "host";

function normalizeMachineTag(machineTag) {
  const normalized = String(machineTag || "").trim().toLowerCase();
  if (!normalized || normalized === "host") return DEFAULT_MACHINE;
  return normalized;
}

function getLocalKey(key) {
  return String(key || "").split(":").pop();
}

function getFirstDefined(object, keys) {
  if (!object || typeof object !== "object") return undefined;

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      const value = object[key];
      if (value !== undefined && value !== null && value !== "") return value;
    }
  }

  for (const wantedKey of keys) {
    const entry = Object.entries(object).find(([actualKey, value]) => getLocalKey(actualKey) === wantedKey && value !== undefined && value !== null && value !== "");
    if (entry) return entry[1];
  }

  return undefined;
}

function stringifyRequirementValue(value) {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}


function normalizeRequirementItem(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  return {
    subject: item.subject ?? "",
    operator: item.operator ?? "",
    value: stringifyRequirementValue(item.value),
  };
}

function normalizeRequirementGroup(group) {
  if (!Array.isArray(group)) {
    return [];
  }

  return group
    .map((item) => normalizeRequirementItem(item))
    .filter(Boolean);
}

function extractRequirements(metadataRoot) {
  if (!metadataRoot || typeof metadataRoot !== "object") {
    return {
      hardware: [],
      software: [],
    };
  }

  const hardware = normalizeRequirementGroup(
    getFirstDefined(metadataRoot, [
      "hardwareRequirements",
    ])
  );

  const software = normalizeRequirementGroup(
    getFirstDefined(metadataRoot, [
      "softwareRequirements",
    ])
  );

  return {
    hardware,
    software,
  };
}

function cloneRequirement(requirement, node) {
  return {
    subject: String(requirement?.subject || "").trim(),
    operator: String(requirement?.operator || "").trim(),
    value: String(requirement?.value || "").trim(),
    sourceNodeId: node.id,
    sourceNodeLabel: node.data?.label || node.id,
  };
}

function getDataspaceFromNode(node) {
  const type = String(node.data?.params?.type || "").trim().toLowerCase();

  if (type.startsWith("dlr.")) return "dlr";
  if (type.startsWith("tsi.")) return "tsi";

  return "";
}

function findCatalogAsset(catalogs, providerId, assetId) {
  const catalog = catalogs.find((catalog) => catalog?.["dspace:participantId"] === providerId);
  if (!catalog) return null;

  const dataset = (catalog?.["dcat:dataset"] || []).find((dataset) => dataset?.id === assetId || dataset?.["@id"] === assetId);
  if (!dataset) return null;

  return {
    catalog,
    dataset,
  };
}

function resolveMachineRequirements(nodes, catalogs, catalogAvailable = true) {
  const groups = new Map();
  const invisibleAssets = [];

  for (const node of nodes) {
    const machine = normalizeMachineTag(node.data?.machineTag);

    if (!groups.has(machine)) {
      groups.set(machine, {
        machine,
        hardware: [],
        software: [],
      });
    }

    const group = groups.get(machine);
    const params = node.data?.params || {};
    const dataspace = getDataspaceFromNode(node);

    let requirements = {
      hardware: [],
      software: [],
    };

    if (dataspace) {
      const providerId = String(params.provider_bpn || "").trim();
      const assetId = String(params.asset_id || "").trim();

      if (!providerId || !assetId) {
        continue;
      }

      if (!catalogAvailable) {
        continue;
      }

      const resolved = findCatalogAsset(catalogs, providerId, assetId);

      if (!resolved) {
        invisibleAssets.push({
          nodeId: node.id,
          nodeLabel: node.data?.label || node.id,
          providerId,
          assetId,
        });
        continue;
      }

      requirements = extractRequirements(resolved.dataset);
    } else {
      const nodeType = getBaseNodeType(
        node.data?.templateKey ||
        node.data?.params?.type
      );

      const localMetadata = NODE_METADATA?.[nodeType] || {};
      requirements = extractRequirements(localMetadata);
    }

    for (const requirement of requirements.hardware) {
      group.hardware.push(cloneRequirement(requirement, node));
    }

    for (const requirement of requirements.software) {
      group.software.push(cloneRequirement(requirement, node));
    }
  }

  const machineGroups = Array.from(groups.values()).sort((left, right) => {
    if (left.machine === DEFAULT_MACHINE) return -1;
    if (right.machine === DEFAULT_MACHINE) return 1;
    return left.machine.localeCompare(right.machine);
  });

  return {
    machineGroups,
    invisibleAssets,
  };
}

function parseNumericValue(value) {
  const match = String(value || "").trim().match(/^(-?(?:\d+(?:\.\d+)?|\.\d+))\s*(.*)$/);
  if (!match) return null;

  const number = Number(match[1]);
  if (!Number.isFinite(number)) return null;

  return {
    number,
    unit: match[2].trim().toLowerCase(),
  };
}

function parseSetValue(value) {
  let text = String(value || "").trim();

  if (text.startsWith("{") && text.endsWith("}")) {
    text = text.slice(1, -1);
  }

  if (!text) return [];

  return text
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function numericComparable(left, right) {
  return left && right && left.unit === right.unit;
}

function valuesEqual(left, right) {
  return String(left || "").trim().toLowerCase() === String(right || "").trim().toLowerCase();
}

function requirementsContradict(left, right) {
  if (
    !left.subject ||
    !right.subject ||
    left.subject.toLowerCase() !== right.subject.toLowerCase()
  ) {
    return false;
  }
  const leftOperator = String(left.operator || "").trim();
  const rightOperator = String(right.operator || "").trim();
  if (
    leftOperator === "required" ||
    rightOperator === "required"
  ) {
    return false;
  }

  if (leftOperator === "=" && rightOperator === "=") {
    return !valuesEqual(left.value, right.value);
  }

  if (leftOperator === "=" && rightOperator === "in") {
    const set = parseSetValue(right.value);

    return (
      set.length > 0 &&
      !set.includes(String(left.value || "").trim().toLowerCase())
    );
  }

  if (leftOperator === "in" && rightOperator === "=") {
    return requirementsContradict(right, left);
  }

  if (leftOperator === "in" && rightOperator === "in") {
    const leftSet = parseSetValue(left.value);
    const rightSet = parseSetValue(right.value);

    if (leftSet.length === 0 || rightSet.length === 0) {
      return false;
    }

    return !leftSet.some((item) => rightSet.includes(item));
  }

  const leftNumeric = parseNumericValue(left.value);
  const rightNumeric = parseNumericValue(right.value);

  if (
    leftOperator === ">=" &&
    rightOperator === "<=" &&
    numericComparable(leftNumeric, rightNumeric)
  ) {
    return leftNumeric.number > rightNumeric.number;
  }

  if (leftOperator === "<=" && rightOperator === ">=") {
    return requirementsContradict(right, left);
  }

  if (
    leftOperator === "=" &&
    [">=", "<="].includes(rightOperator)
  ) {
    if (!numericComparable(leftNumeric, rightNumeric)) {
      return false;
    }

    return rightOperator === ">="
      ? leftNumeric.number < rightNumeric.number
      : leftNumeric.number > rightNumeric.number;
  }

  if (
    [">=", "<="].includes(leftOperator) &&
    rightOperator === "="
  ) {
    return requirementsContradict(right, left);
  }

  return false;
}

function markContradictions(requirements) {
  const contradictoryIndexes = new Set();

  for (let leftIndex = 0; leftIndex < requirements.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < requirements.length; rightIndex += 1) {
      if (requirementsContradict(requirements[leftIndex], requirements[rightIndex])) {
        contradictoryIndexes.add(leftIndex);
        contradictoryIndexes.add(rightIndex);
      }
    }
  }

  return requirements.map((requirement, index) => ({
    ...requirement,
    conflict: contradictoryIndexes.has(index),
  }));
}

function withContradictionFlags(groups) {
  return groups.map((group) => ({
    ...group,
    hardware: markContradictions(group.hardware),
    software: markContradictions(group.software),
  }));
}

function buildDataspaceRequirements(nodes) {
  const requirements = [];
  const seen = new Set();

  for (const node of nodes) {
    const params = node.data?.params || {};
    const providerBpn = String(params.provider_bpn || "").trim();

    if (!providerBpn) continue;

    const dataspace = getDataspaceFromNode(node);
    if (!dataspace) continue;

    const apiRequirement = {
      subject: `dataspace.${dataspace}.api`,
      operator: "required",
      value: "",
      sourceNodeId: node.id,
      sourceNodeLabel: node.data?.label || node.id,
    };

    const apiKey = `${apiRequirement.subject}|${apiRequirement.operator}|`;

    if (!seen.has(apiKey)) {
      seen.add(apiKey);
      requirements.push(apiRequirement);
    }

    const assetId = String(params.asset_id || "").trim();
    if (!assetId) continue;

    const negotiationRequirement = {
      subject: `dataspace.${dataspace}.negotiation`,
      operator: "=",
      value: `${providerBpn}.${assetId}`,
      sourceNodeId: node.id,
      sourceNodeLabel: node.data?.label || node.id,
    };

    const negotiationKey = `${negotiationRequirement.subject}|${negotiationRequirement.operator}|${negotiationRequirement.value}`;

    if (!seen.has(negotiationKey)) {
      seen.add(negotiationKey);
      requirements.push(negotiationRequirement);
    }
  }

  return requirements;
}

function RequirementRow({ requirement, category }) {
  const isHardware = category === "hardware";
  const isSoftware = category === "software";

  const subjectStyle = isHardware
    ? {
        background: "#ffedd5",
        border: "1px solid #fdba74",
        color: "#9a3412",
      }
    : isSoftware
      ? {
          background: "#dbeafe",
          border: "1px solid #93c5fd",
          color: "#1d4ed8",
        }
      : {
          background: "#ecfdf5",
          border: "1px solid #86efac",
          color: "#166534",
        };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(230px, 1.6fr) 90px minmax(180px, 1.3fr)",
        gap: 8,
        alignItems: "center",
        padding: 9,
        border: requirement.conflict ? "2px solid #dc2626" : "1px solid #e5e7eb",
        borderRadius: 8,
        background: requirement.conflict ? "#fef2f2" : "white",
      }}
    >
      <div
        title={requirement.subject}
        style={{
          ...subjectStyle,
          minWidth: 0,
          padding: "5px 9px",
          borderRadius: 999,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {requirement.subject || "(empty subject)"}
      </div>

      <code
        style={{
          textAlign: "center",
          fontSize: 12,
          fontWeight: 700,
          color: requirement.conflict ? "#b91c1c" : "#333",
        }}
      >
        {requirement.operator || "(empty)"}
      </code>

      <div
        style={{
          minWidth: 0,
          overflowWrap: "anywhere",
          fontSize: 12,
          color: requirement.conflict ? "#b91c1c" : "#333",
        }}
      >
        {requirement.value || "—"}
      </div>

      {requirement.conflict && (
        <div
          style={{
            gridColumn: "1 / -1",
            marginTop: 2,
            padding: "5px 8px",
            borderRadius: 5,
            background: "#fee2e2",
            color: "#991b1b",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          ⚠ Contradictory requirement
        </div>
      )}

      {requirement.sourceNodeLabel && (
        <div
          style={{
            gridColumn: "1 / -1",
            color: "#888",
            fontSize: 10,
          }}
        >
          Source node: {requirement.sourceNodeLabel}
        </div>
      )}
    </div>
  );
}

function RequirementGroup({ title, requirements, category }) {
  return (
    <section>
      <h4
        style={{
          margin: "0 0 8px",
          fontSize: 13,
          color: "#444",
        }}
      >
        {title}
      </h4>

      {requirements.length === 0 ? (
        <div
          style={{
            color: "#888",
            fontSize: 12,
            fontStyle: "italic",
          }}
        >
          No requirements.
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 7,
          }}
        >
          {requirements.map((requirement, index) => (
            <RequirementRow
              key={`${title}-${index}-${requirement.subject}`}
              requirement={requirement}
              category={category}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function buildPublishedRequirements(machineGroups, dataspaceRequirements, invisibleAssets) {
  return {
    machines: machineGroups.map((group) => ({
      machine: group.machine,
      hardware: group.hardware.map(({ subject, operator, value, conflict }) => ({
        subject,
        operator,
        value,
        conflict: Boolean(conflict),
      })),
      software: group.software.map(({ subject, operator, value, conflict }) => ({
        subject,
        operator,
        value,
        conflict: Boolean(conflict),
      })),
    })),
    dataspace: dataspaceRequirements.map(({ subject, operator, value }) => ({
      subject,
      operator,
      value,
    })),
    unresolvedAssets: invisibleAssets.map(({ nodeId, nodeLabel, providerId, assetId }) => ({
      nodeId,
      nodeLabel,
      providerId,
      assetId,
      reason: "Asset is not visible to you.",
    })),
  };
}

function downloadJsonFile(data) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "workflow-requirements.json";

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

async function exportRequirementsPdf(element) {
  if (!element) {
    throw new Error("PDF export view is not available.");
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;
  const pagePixelHeight = Math.floor(canvas.width * (contentHeight / contentWidth));

  let sourceY = 0;
  let pageIndex = 0;

  while (sourceY < canvas.height) {
    const sliceHeight = Math.min(pagePixelHeight, canvas.height - sourceY);
    const pageCanvas = document.createElement("canvas");

    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeight;

    const context = pageCanvas.getContext("2d");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

    context.drawImage(
      canvas,
      0,
      sourceY,
      canvas.width,
      sliceHeight,
      0,
      0,
      canvas.width,
      sliceHeight
    );

    const imageData = pageCanvas.toDataURL("image/png");
    const renderedHeight = contentWidth * (sliceHeight / canvas.width);

    if (pageIndex > 0) {
      pdf.addPage("a4", "landscape");
    }

    pdf.addImage(
      imageData,
      "PNG",
      margin,
      margin,
      contentWidth,
      renderedHeight,
      undefined,
      "FAST"
    );

    sourceY += sliceHeight;
    pageIndex += 1;
  }

  pdf.save("workflow-requirements.pdf");
}

function VisibilityWarnings({ invisibleAssets }) {
  if (invisibleAssets.length === 0) return null;

  return (
    <section
      style={{
        marginBottom: 18,
        padding: 12,
        border: "1px solid #facc15",
        borderRadius: 8,
        background: "#fefce8",
      }}
    >
      <div
        style={{
          marginBottom: 7,
          color: "#854d0e",
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        Some asset metadata could not be resolved.
      </div>

      {invisibleAssets.map((asset) => (
        <div
          key={`${asset.nodeId}-${asset.providerId}-${asset.assetId}`}
          style={{
            marginTop: 4,
            color: "#713f12",
            fontSize: 12,
            overflowWrap: "anywhere",
          }}
        >
          <strong>{asset.nodeLabel}</strong>: Asset is not visible to you.
          {" "}
          ({asset.providerId} / {asset.assetId})
        </div>
      ))}
    </section>
  );
}

export default function WorkflowRequirementsModal({
  isOpen,
  onClose,
  nodes,
}) {
  const pdfExportRef = useRef(null);

  const [machineGroups, setMachineGroups] = useState([]);
  const [invisibleAssets, setInvisibleAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();

    setIsLoading(true);
    setLoadError("");
    setInvisibleAssets([]);

    getCatalogs(controller.signal)
      .then((catalogs) => {
        const resolved = resolveMachineRequirements(
          nodes || [],
          Array.isArray(catalogs) ? catalogs : [],
          true
        );

        setMachineGroups(
          withContradictionFlags(
            resolved.machineGroups
          )
        );

        setInvisibleAssets(
          resolved.invisibleAssets
        );
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;

        console.error(error);

        const localOnly = resolveMachineRequirements(
          nodes || [],
          [],
          false
        );

        setMachineGroups(
          withContradictionFlags(
            localOnly.machineGroups
          )
        );

        setInvisibleAssets([]);

        setLoadError(
          error?.message ||
          "Failed to load the federated catalog."
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [isOpen, nodes]);

  const dataspaceRequirements = useMemo(
    () => buildDataspaceRequirements(nodes || []),
    [nodes]
  );

  const contradictionCount = useMemo(
    () =>
      machineGroups.reduce(
        (total, group) =>
          total +
          group.hardware.filter((item) => item.conflict).length +
          group.software.filter((item) => item.conflict).length,
        0
      ),
    [machineGroups]
  );

  const publishedRequirements = useMemo(
    () =>
      buildPublishedRequirements(
        machineGroups,
        dataspaceRequirements,
        invisibleAssets
      ),
    [
      machineGroups,
      dataspaceRequirements,
      invisibleAssets,
    ]
  );

  const handleExportPdf = async () => {
    if (isExportingPdf || isLoading) return;

    setIsExportingPdf(true);

    try {
      await exportRequirementsPdf(
        pdfExportRef.current
      );
    } catch (error) {
      console.error(error);

      alert(
        error?.message ||
        "Failed to export workflow requirements PDF."
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(0, 0, 0, 0.35)",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="workflow-requirements-title"
        style={{
          width: "min(980px, calc(100vw - 40px))",
          maxHeight: "min(820px, calc(100vh - 40px))",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: 10,
          background: "white",
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.25)",
        }}
      >
        <header
          style={{
            flex: "0 0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "16px 18px",
            borderBottom: "1px solid #ddd",
          }}
        >
          <div>
            <h2
              id="workflow-requirements-title"
              style={{
                margin: 0,
                fontSize: 18,
              }}
            >
              Requirements Summary
            </h2>

            <div
              style={{
                marginTop: 4,
                color: contradictionCount ? "#b91c1c" : "#666",
                fontSize: 12,
                fontWeight: contradictionCount ? 700 : 400,
              }}
            >
              {isLoading
                ? "Resolving requirements from the current federated catalog..."
                : contradictionCount
                  ? `${contradictionCount} conflicting requirement item(s) detected.`
                  : "No contradictions detected."}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 6,
              border: "1px solid #ccc",
              background: "white",
              cursor: "pointer",
              fontSize: 18,
            }}
          >
            ×
          </button>
        </header>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: 18,
          }}
        >
          {loadError && (
            <div
              style={{
                marginBottom: 16,
                padding: "10px 12px",
                border: "1px solid #fca5a5",
                borderRadius: 7,
                background: "#fef2f2",
                color: "#991b1b",
                fontSize: 12,
              }}
            >
              Federated catalog could not be loaded: {loadError}
              <div
                style={{
                  marginTop: 4,
                  color: "#b91c1c",
                }}
              >
                Dataspace asset requirements are unavailable. Local General-node requirements are still shown.
              </div>
            </div>
          )}

          <VisibilityWarnings
            invisibleAssets={invisibleAssets}
          />

          {machineGroups.length === 0 ? (
            <div
              style={{
                color: "#888",
                fontSize: 13,
              }}
            >
              {isLoading
                ? "Loading requirements..."
                : "The graph contains no nodes."}
            </div>
          ) : (
            machineGroups.map((group) => (
              <section
                key={group.machine}
                style={{
                  marginBottom: 22,
                  padding: 14,
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  background: "#fafafa",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 14px",
                    fontSize: 15,
                  }}
                >
                  Machine: <code>{group.machine}</code>
                </h3>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 18,
                  }}
                >
                  <RequirementGroup
                    title="Hardware Requirements"
                    requirements={group.hardware}
                    category="hardware"
                  />

                  <RequirementGroup
                    title="Software Requirements"
                    requirements={group.software}
                    category="software"
                  />
                </div>
              </section>
            ))
          )}

          <section
            style={{
              marginTop: 4,
              padding: 14,
              border: "1px solid #bbf7d0",
              borderRadius: 10,
              background: "#f0fdf4",
            }}
          >
            <h3
              style={{
                margin: "0 0 14px",
                fontSize: 15,
              }}
            >
              Dataspace Requirements
            </h3>

            <RequirementGroup
              title="Generated from dataspace nodes"
              requirements={dataspaceRequirements}
              category="dataspace"
            />
          </section>
        </div>

        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            left: "-20000px",
            top: 0,
            width: 1120,
            pointerEvents: "none",
          }}
        >
          <div
            ref={pdfExportRef}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: 28,
              background: "white",
              color: "#222",
              fontFamily: "Arial, sans-serif",
            }}
          >
            <div
              style={{
                marginBottom: 22,
                paddingBottom: 14,
                borderBottom: "2px solid #222",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: 26,
                }}
              >
                Workflow Requirements
              </h1>

              <div
                style={{
                  marginTop: 7,
                  color: contradictionCount ? "#b91c1c" : "#666",
                  fontSize: 13,
                  fontWeight: contradictionCount ? 700 : 400,
                }}
              >
                {contradictionCount
                  ? `${contradictionCount} conflicting requirement item(s) detected.`
                  : "No contradictions detected."}
              </div>
            </div>

            {loadError && (
              <div
                style={{
                  marginBottom: 18,
                  padding: 12,
                  border: "1px solid #fca5a5",
                  borderRadius: 8,
                  background: "#fef2f2",
                  color: "#991b1b",
                  fontSize: 12,
                }}
              >
                Federated catalog could not be loaded. Dataspace asset requirements may be incomplete.
              </div>
            )}

            <VisibilityWarnings
              invisibleAssets={invisibleAssets}
            />

            {machineGroups.map((group) => (
              <section
                key={`pdf-${group.machine}`}
                style={{
                  marginBottom: 24,
                  padding: 16,
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  background: "#fafafa",
                }}
              >
                <h2
                  style={{
                    margin: "0 0 15px",
                    fontSize: 17,
                  }}
                >
                  Machine: <code>{group.machine}</code>
                </h2>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 20,
                  }}
                >
                  <RequirementGroup
                    title="Hardware Requirements"
                    requirements={group.hardware}
                    category="hardware"
                  />

                  <RequirementGroup
                    title="Software Requirements"
                    requirements={group.software}
                    category="software"
                  />
                </div>
              </section>
            ))}

            <section
              style={{
                marginTop: 6,
                padding: 16,
                border: "1px solid #bbf7d0",
                borderRadius: 10,
                background: "#f0fdf4",
              }}
            >
              <h2
                style={{
                  margin: "0 0 15px",
                  fontSize: 17,
                }}
              >
                Dataspace Requirements
              </h2>

              <RequirementGroup
                title="Generated from dataspace nodes"
                requirements={dataspaceRequirements}
                category="dataspace"
              />
            </section>
          </div>
        </div>

        <footer
          style={{
            flex: "0 0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 8,
            padding: "12px 18px",
            borderTop: "1px solid #ddd",
            background: "#fafafa",
          }}
        >
          <button
            type="button"
            disabled={isLoading}
            onClick={() =>
              downloadJsonFile(
                publishedRequirements
              )
            }
            style={{
              height: 34,
              padding: "0 15px",
              border: "1px solid #bbb",
              borderRadius: 6,
              background: "white",
              color: "#333",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontWeight: 700,
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            Export JSON
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf || isLoading}
            style={{
              height: 34,
              padding: "0 13px",
              border: "none",
              borderRadius: 6,
              background: isExportingPdf || isLoading ? "#93c5fd" : "#2563eb",
              color: isExportingPdf || isLoading ? "#eff6ff" : "white",
              cursor: isExportingPdf || isLoading ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {isExportingPdf
              ? "Publishing PDF..."
              : "Publish"}
          </button>
        </footer>
      </div>
    </div>
  );
}