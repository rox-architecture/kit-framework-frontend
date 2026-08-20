import {
  useMemo,
  useRef,
  useState,
} from "react";

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const DEFAULT_MACHINE = "host";

function normalizeMachineTag(machineTag) {
  const normalized = String(
    machineTag || ""
  )
    .trim()
    .toLowerCase();

  if (!normalized || normalized === "host") {
    return DEFAULT_MACHINE;
  }

  if (
    normalized === "is any of" ||
    normalized === "is any of"
  ) {
    return "is any of";
  }

  return normalized;
}

function cloneRequirement(requirement, node) {
  return {
    subject: String(
      requirement?.subject || ""
    ).trim(),
    operator: String(
      requirement?.operator || ""
    ).trim(),
    value: String(
      requirement?.value || ""
    ).trim(),
    sourceNodeId: node.id,
    sourceNodeLabel:
      node.data?.label || node.id,
  };
}

function aggregateMachineRequirements(nodes) {
  const groups = new Map();

  for (const node of nodes) {
    const machine =
      normalizeMachineTag(
        node.data?.machineTag
      );

    if (!groups.has(machine)) {
      groups.set(machine, {
        machine,
        hardware: [],
        software: [],
      });
    }

    const group = groups.get(machine);
    const requirements =
      node.data?.requirements || {};

    for (const requirement of
      requirements.hardware || []) {
      group.hardware.push(
        cloneRequirement(
          requirement,
          node
        )
      );
    }

    for (const requirement of
      requirements.software || []) {
      group.software.push(
        cloneRequirement(
          requirement,
          node
        )
      );
    }
  }

  return Array.from(groups.values()).sort(
    (left, right) => {
      if (left.machine === DEFAULT_MACHINE) {
        return -1;
      }

      if (right.machine === DEFAULT_MACHINE) {
        return 1;
      }

      return left.machine.localeCompare(
        right.machine
      );
    }
  );
}

function normalizeOperator(operator) {
  const normalized = String(
    operator || ""
  )
    .trim()
    .toLowerCase();

  if (
    normalized === "requires" ||
    normalized === "required" ||
    normalized === "exists"
  ) {
    return "requires";
  }

  return normalized;
}

function parseNumericValue(value) {
  const match = String(value || "")
    .trim()
    .match(
      /^(-?(?:\d+(?:\.\d+)?|\.\d+))\s*(.*)$/
    );

  if (!match) {
    return null;
  }

  const number = Number(match[1]);

  if (!Number.isFinite(number)) {
    return null;
  }

  return {
    number,
    unit: match[2]
      .trim()
      .toLowerCase(),
  };
}

function parseSetValue(value) {
  let text = String(value || "").trim();

  if (
    text.startsWith("{") &&
    text.endsWith("}")
  ) {
    text = text.slice(1, -1);
  }

  if (!text) {
    return [];
  }

  return text
    .split(",")
    .map((item) =>
      item.trim().toLowerCase()
    )
    .filter(Boolean);
}

function numericComparable(left, right) {
  return (
    left &&
    right &&
    left.unit === right.unit
  );
}

function valuesEqual(left, right) {
  return (
    String(left || "")
      .trim()
      .toLowerCase() ===
    String(right || "")
      .trim()
      .toLowerCase()
  );
}

function requirementsContradict(
  left,
  right
) {
  if (
    !left.subject ||
    !right.subject ||
    left.subject.toLowerCase() !==
      right.subject.toLowerCase()
  ) {
    return false;
  }

  const leftOperator =
    normalizeOperator(left.operator);
  const rightOperator =
    normalizeOperator(right.operator);

  // "requires" only states availability.
  // It does not conflict with value constraints.
  if (
    leftOperator === "requires" ||
    rightOperator === "requires"
  ) {
    return false;
  }

  // Exact values disagree.
  if (
    leftOperator === "=" &&
    rightOperator === "="
  ) {
    return !valuesEqual(
      left.value,
      right.value
    );
  }

  // Exact value vs set membership.
  if (
    leftOperator === "=" &&
    rightOperator === "is any of"
  ) {
    const set = parseSetValue(
      right.value
    );

    return (
      set.length > 0 &&
      !set.includes(
        String(left.value || "")
          .trim()
          .toLowerCase()
      )
    );
  }

  if (
    leftOperator === "is any of" &&
    rightOperator === "="
  ) {
    return requirementsContradict(
      right,
      left
    );
  }

  // Set vs set: contradiction only when
  // both sets are non-empty and disjoint.
  if (
    leftOperator === "is any of" &&
    rightOperator === "is any of"
  ) {
    const leftSet =
      parseSetValue(left.value);
    const rightSet =
      parseSetValue(right.value);

    if (
      leftSet.length === 0 ||
      rightSet.length === 0
    ) {
      return false;
    }

    return !leftSet.some((item) =>
      rightSet.includes(item)
    );
  }

  const leftNumeric =
    parseNumericValue(left.value);
  const rightNumeric =
    parseNumericValue(right.value);

  // Lower bound vs upper bound.
  if (
    leftOperator === ">=" &&
    rightOperator === "<=" &&
    numericComparable(
      leftNumeric,
      rightNumeric
    )
  ) {
    return (
      leftNumeric.number >
      rightNumeric.number
    );
  }

  if (
    leftOperator === "<=" &&
    rightOperator === ">="
  ) {
    return requirementsContradict(
      right,
      left
    );
  }

  // Exact numeric value vs numeric range.
  if (
    leftOperator === "=" &&
    [">=", "<="].includes(
      rightOperator
    )
  ) {
    if (
      !numericComparable(
        leftNumeric,
        rightNumeric
      )
    ) {
      return false;
    }

    return rightOperator === ">="
      ? leftNumeric.number <
          rightNumeric.number
      : leftNumeric.number >
          rightNumeric.number;
  }

  if (
    [">=", "<="].includes(
      leftOperator
    ) &&
    rightOperator === "="
  ) {
    return requirementsContradict(
      right,
      left
    );
  }

  // Custom operators are intentionally not
  // interpreted as contradictions.
  return false;
}

function markContradictions(requirements) {
  const contradictoryIndexes =
    new Set();

  for (
    let leftIndex = 0;
    leftIndex < requirements.length;
    leftIndex += 1
  ) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < requirements.length;
      rightIndex += 1
    ) {
      if (
        requirementsContradict(
          requirements[leftIndex],
          requirements[rightIndex]
        )
      ) {
        contradictoryIndexes.add(
          leftIndex
        );
        contradictoryIndexes.add(
          rightIndex
        );
      }
    }
  }

  return requirements.map(
    (requirement, index) => ({
      ...requirement,
      conflict:
        contradictoryIndexes.has(
          index
        ),
    })
  );
}

function withContradictionFlags(groups) {
  return groups.map((group) => ({
    ...group,
    hardware: markContradictions(
      group.hardware
    ),
    software: markContradictions(
      group.software
    ),
  }));
}

function getDataspaceFromNode(node) {
  const type = String(
    node.data?.params?.type || ""
  )
    .trim()
    .toLowerCase();

  if (type.startsWith("dlr.")) {
    return "dlr";
  }

  if (type.startsWith("tsi.")) {
    return "tsi";
  }

  return "";
}

function buildDataspaceRequirements(nodes) {
  const requirements = [];
  const seen = new Set();

  for (const node of nodes) {
    const params = node.data?.params || {};
    const providerBpn = String(
      params.provider_bpn || ""
    ).trim();

    if (!providerBpn) {
      continue;
    }

    const dataspace =
      getDataspaceFromNode(node);

    if (!dataspace) {
      continue;
    }

    const apiRequirement = {
      subject: `dataspace.${dataspace}.api`,
      operator: "requires",
      value: "",
      sourceNodeId: node.id,
      sourceNodeLabel:
        node.data?.label || node.id,
    };

    const apiKey =
      `${apiRequirement.subject}|` +
      `${apiRequirement.operator}|`;

    if (!seen.has(apiKey)) {
      seen.add(apiKey);
      requirements.push(
        apiRequirement
      );
    }

    const assetId = String(
      params.asset_id || ""
    ).trim();

    if (!assetId) {
      continue;
    }

    const negotiationRequirement = {
      subject:
        `dataspace.${dataspace}.negotiation`,
      operator: "=",
      value: `${providerBpn}.${assetId}`,
      sourceNodeId: node.id,
      sourceNodeLabel:
        node.data?.label || node.id,
    };

    const negotiationKey =
      `${negotiationRequirement.subject}|` +
      `${negotiationRequirement.operator}|` +
      `${negotiationRequirement.value}`;

    if (!seen.has(negotiationKey)) {
      seen.add(negotiationKey);
      requirements.push(
        negotiationRequirement
      );
    }
  }

  return requirements;
}

function RequirementRow({
  requirement,
  category,
}) {
  const isHardware =
    category === "hardware";
  const isSoftware =
    category === "software";

  const subjectStyle = isHardware
    ? {
        background: "#ffedd5",
        border: "1px solid #fdba74",
        color: "#9a3412",
      }
    : isSoftware
      ? {
          background: "#dbeafe",
          border:
            "1px solid #93c5fd",
          color: "#1d4ed8",
        }
      : {
          background: "#ecfdf5",
          border:
            "1px solid #86efac",
          color: "#166534",
        };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "minmax(230px, 1.6fr) 90px minmax(180px, 1.3fr)",
        gap: 8,
        alignItems: "center",
        padding: 9,
        border: requirement.conflict
          ? "2px solid #dc2626"
          : "1px solid #e5e7eb",
        borderRadius: 8,
        background:
          requirement.conflict
            ? "#fef2f2"
            : "white",
        boxShadow:
          requirement.conflict
            ? "0 0 0 2px rgba(220, 38, 38, 0.08)"
            : "none",
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
        {requirement.subject ||
          "(empty subject)"}
      </div>

      <code
        style={{
          textAlign: "center",
          fontSize: 12,
          fontWeight: 700,
          color: requirement.conflict
            ? "#b91c1c"
            : "#333",
        }}
      >
        {requirement.operator ||
          "(empty)"}
      </code>

      <div
        style={{
          minWidth: 0,
          overflowWrap: "anywhere",
          fontSize: 12,
          color: requirement.conflict
            ? "#b91c1c"
            : "#333",
        }}
      >
        {requirement.value ||
          (normalizeOperator(
            requirement.operator
          ) === "requires"
            ? "—"
            : "(empty value)")}
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
          Source node:{" "}
          {requirement.sourceNodeLabel}
        </div>
      )}
    </div>
  );
}

function RequirementGroup({
  title,
  requirements,
  category,
}) {
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
          {requirements.map(
            (requirement, index) => (
              <RequirementRow
                key={`${title}-${index}-${requirement.subject}`}
                requirement={
                  requirement
                }
                category={category}
              />
            )
          )}
        </div>
      )}
    </section>
  );
}


function buildPublishedRequirements(
  machineGroups,
  dataspaceRequirements
) {
  return {
    machines: machineGroups.map((group) => ({
      machine: group.machine,
      hardware: group.hardware.map(
        ({
          subject,
          operator,
          value,
          conflict,
        }) => ({
          subject,
          operator,
          value,
          conflict: Boolean(conflict),
        })
      ),
      software: group.software.map(
        ({
          subject,
          operator,
          value,
          conflict,
        }) => ({
          subject,
          operator,
          value,
          conflict: Boolean(conflict),
        })
      ),
    })),

    dataspace: dataspaceRequirements.map(
      ({
        subject,
        operator,
        value,
      }) => ({
        subject,
        operator,
        value,
      })
    ),
  };
}

function downloadJsonFile(data) {
  const json = JSON.stringify(
    data,
    null,
    2
  );

  const blob = new Blob(
    [json],
    {
      type: "application/json",
    }
  );

  const url =
    URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = url;
  anchor.download =
    "workflow-requirements.json";

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}


async function exportRequirementsPdf(
  element
) {
  if (!element) {
    throw new Error(
      "PDF export view is not available."
    );
  }

  const canvas = await html2canvas(
    element,
    {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      windowWidth:
        element.scrollWidth,
      windowHeight:
        element.scrollHeight,
    }
  );

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth =
    pdf.internal.pageSize.getWidth();

  const pageHeight =
    pdf.internal.pageSize.getHeight();

  const margin = 8;

  const contentWidth =
    pageWidth - margin * 2;

  const contentHeight =
    pageHeight - margin * 2;

  const pagePixelHeight =
    Math.floor(
      canvas.width *
        (contentHeight / contentWidth)
    );

  let sourceY = 0;
  let pageIndex = 0;

  while (sourceY < canvas.height) {
    const sliceHeight = Math.min(
      pagePixelHeight,
      canvas.height - sourceY
    );

    const pageCanvas =
      document.createElement("canvas");

    pageCanvas.width =
      canvas.width;

    pageCanvas.height =
      sliceHeight;

    const context =
      pageCanvas.getContext("2d");

    context.fillStyle = "#ffffff";
    context.fillRect(
      0,
      0,
      pageCanvas.width,
      pageCanvas.height
    );

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

    const imageData =
      pageCanvas.toDataURL(
        "image/png"
      );

    const renderedHeight =
      contentWidth *
      (sliceHeight / canvas.width);

    if (pageIndex > 0) {
      pdf.addPage(
        "a4",
        "landscape"
      );
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

  pdf.save(
    "workflow-requirements.pdf"
  );
}

export default function WorkflowRequirementsModal({
  isOpen,
  onClose,
  nodes,
}) {
  const pdfExportRef = useRef(null);

  const [isExportingPdf, setIsExportingPdf] =
    useState(false);
  const machineGroups = useMemo(
    () =>
      withContradictionFlags(
        aggregateMachineRequirements(
          nodes || []
        )
      ),
    [nodes]
  );

  const dataspaceRequirements =
    useMemo(
      () =>
        buildDataspaceRequirements(
          nodes || []
        ),
      [nodes]
    );

  const contradictionCount =
    useMemo(
      () =>
        machineGroups.reduce(
          (total, group) =>
            total +
            group.hardware.filter(
              (item) =>
                item.conflict
            ).length +
            group.software.filter(
              (item) =>
                item.conflict
            ).length,
          0
        ),
      [machineGroups]
    );

  const publishedRequirements =
    useMemo(
      () =>
        buildPublishedRequirements(
          machineGroups,
          dataspaceRequirements
        ),
      [
        machineGroups,
        dataspaceRequirements,
      ]
    );

  const handleExportPdf = async () => {
    if (isExportingPdf) {
      return;
    }

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

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
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
        background:
          "rgba(0, 0, 0, 0.35)",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="workflow-requirements-title"
        style={{
          width:
            "min(980px, calc(100vw - 40px))",
          maxHeight:
            "min(820px, calc(100vh - 40px))",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: 10,
          background: "white",
          boxShadow:
            "0 12px 32px rgba(0, 0, 0, 0.25)",
        }}
      >
        <header
          style={{
            flex: "0 0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: 12,
            padding: "16px 18px",
            borderBottom:
              "1px solid #ddd",
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
                color: contradictionCount
                  ? "#b91c1c"
                  : "#666",
                fontSize: 12,
                fontWeight:
                  contradictionCount
                    ? 700
                    : 400,
              }}
            >
              {contradictionCount
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
              border:
                "1px solid #ccc",
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
          {machineGroups.length === 0 ? (
            <div
              style={{
                color: "#888",
                fontSize: 13,
              }}
            >
              The graph contains no nodes.
            </div>
          ) : (
            machineGroups.map(
              (group) => (
                <section
                  key={group.machine}
                  style={{
                    marginBottom: 22,
                    padding: 14,
                    border:
                      "1px solid #ddd",
                    borderRadius: 10,
                    background: "#fafafa",
                  }}
                >
                  <h3
                    style={{
                      margin:
                        "0 0 14px",
                      fontSize: 15,
                    }}
                  >
                    Machine:{" "}
                    <code>
                      {group.machine}
                    </code>
                  </h3>

                  <div
                    style={{
                      display: "flex",
                      flexDirection:
                        "column",
                      gap: 18,
                    }}
                  >
                    <RequirementGroup
                      title="Hardware Requirements"
                      requirements={
                        group.hardware
                      }
                      category="hardware"
                    />

                    <RequirementGroup
                      title="Software Requirements"
                      requirements={
                        group.software
                      }
                      category="software"
                    />
                  </div>
                </section>
              )
            )
          )}

          <section
            style={{
              marginTop: 4,
              padding: 14,
              border:
                "1px solid #bbf7d0",
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
              requirements={
                dataspaceRequirements
              }
              category="dataspace"
            />
          </section>
        </div>

        {/* Hidden full-width report used only for PDF capture. */}
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
              fontFamily:
                "Arial, sans-serif",
            }}
          >
            <div
              style={{
                marginBottom: 22,
                paddingBottom: 14,
                borderBottom:
                  "2px solid #222",
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
                  color:
                    contradictionCount
                      ? "#b91c1c"
                      : "#666",
                  fontSize: 13,
                  fontWeight:
                    contradictionCount
                      ? 700
                      : 400,
                }}
              >
                {contradictionCount
                  ? `${contradictionCount} conflicting requirement item(s) detected.`
                  : "No contradictions detected."}
              </div>
            </div>

            {machineGroups.length === 0 ? (
              <div
                style={{
                  color: "#888",
                  fontSize: 13,
                }}
              >
                The graph contains no nodes.
              </div>
            ) : (
              machineGroups.map(
                (group) => (
                  <section
                    key={`pdf-${group.machine}`}
                    style={{
                      marginBottom: 24,
                      padding: 16,
                      border:
                        "1px solid #ddd",
                      borderRadius: 10,
                      background:
                        "#fafafa",
                    }}
                  >
                    <h2
                      style={{
                        margin:
                          "0 0 15px",
                        fontSize: 17,
                      }}
                    >
                      Machine:{" "}
                      <code>
                        {group.machine}
                      </code>
                    </h2>

                    <div
                      style={{
                        display: "flex",
                        flexDirection:
                          "column",
                        gap: 20,
                      }}
                    >
                      <RequirementGroup
                        title="Hardware Requirements"
                        requirements={
                          group.hardware
                        }
                        category="hardware"
                      />

                      <RequirementGroup
                        title="Software Requirements"
                        requirements={
                          group.software
                        }
                        category="software"
                      />
                    </div>
                  </section>
                )
              )
            )}

            <section
              style={{
                marginTop: 6,
                padding: 16,
                border:
                  "1px solid #bbf7d0",
                borderRadius: 10,
                background: "#f0fdf4",
              }}
            >
              <h2
                style={{
                  margin:
                    "0 0 15px",
                  fontSize: 17,
                }}
              >
                Dataspace Requirements
              </h2>

              <RequirementGroup
                title="Generated from dataspace nodes"
                requirements={
                  dataspaceRequirements
                }
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
            borderTop:
              "1px solid #ddd",
            background: "#fafafa",
          }}
        >
          <button
            type="button"
            onClick={() =>
              downloadJsonFile(
                publishedRequirements
              )
            }
            style={{
              height: 34,
              padding: "0 15px",
              border:
                "1px solid #bbb",
              borderRadius: 6,
              background: "white",
              color: "#333",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Export JSON
          </button>

          <button
            type="button"
            onClick={
              handleExportPdf
            }
            disabled={
              isExportingPdf
            }
            style={{
              height: 34,
              padding: "0 13px",
              border: "none",
              borderRadius: 6,
              background:
                isExportingPdf
                  ? "#93c5fd"
                  : "#2563eb",
              color:
                isExportingPdf
                  ? "#eff6ff"
                  : "white",
              cursor:
                isExportingPdf
                  ? "not-allowed"
                  : "pointer",
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
