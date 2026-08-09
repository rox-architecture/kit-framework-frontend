import { useEffect, useMemo, useRef, useState } from "react";
import {
  CircleHelp,
  File,
  FileCog,
  Handshake,
  Package,
  RadioTower,
  Workflow,
} from "lucide-react";
import PREDEFINED_NODE_TEMPLATES from "../templates";

const CATALOG_URL = "http://localhost:8000/catalogs";
const AGREEMENTS_URL = "http://localhost:8000/agreements";
const NEGOTIATIONS_URL = "http://localhost:8000/negotiations";

const ASSET_TYPES = {
  STATIC_FILE: "Static File",
  CONTAINER: "Container",
  FILE_SERVICE: "File Service",
  STREAMING_SERVICE: "Streaming Service",
  WORKFLOW: "Workflow",
  UNKNOWN: "Unknown",
};

const ASSET_TYPE_UI = {
  [ASSET_TYPES.STATIC_FILE]: {
    icon: File,
    color: "#2563eb",
    badgeColor: "#dbeafe",
  },
  [ASSET_TYPES.CONTAINER]: {
    icon: Package,
    color: "#9333ea",
    badgeColor: "#ede9fe",
  },
  [ASSET_TYPES.FILE_SERVICE]: {
    icon: FileCog,
    color: "#ea580c",
    badgeColor: "#ffedd5",
  },
  [ASSET_TYPES.STREAMING_SERVICE]: {
    icon: RadioTower,
    color: "#0891b2",
    badgeColor: "#cffafe",
  },
  [ASSET_TYPES.WORKFLOW]: {
    icon: Workflow,
    color: "#059669",
    badgeColor: "#d1fae5",
  },
  [ASSET_TYPES.UNKNOWN]: {
    icon: CircleHelp,
    color: "#6b7280",
    badgeColor: "#e5e7eb",
  },
};

const OPERATIONAL_TYPE_MAP = {
  static_file: ASSET_TYPES.STATIC_FILE,
  container: ASSET_TYPES.CONTAINER,
  file_service: ASSET_TYPES.FILE_SERVICE,
  streaming_service: ASSET_TYPES.STREAMING_SERVICE,
  workflow: ASSET_TYPES.WORKFLOW,
};

function getAssetType(dataset) {
  // Only the root-level operational_type is considered.
  // Nested operational_type fields are intentionally ignored.
  const rawOperationalType = dataset?.operational_type;

  if (typeof rawOperationalType !== "string") {
    return ASSET_TYPES.UNKNOWN;
  }

  const normalizedOperationalType = rawOperationalType
    .trim()
    .toLowerCase();

  return (
    OPERATIONAL_TYPE_MAP[normalizedOperationalType] ||
    ASSET_TYPES.UNKNOWN
  );
}

function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  children,
  nested = false,
}) {
  return (
    <section
      style={{
        borderTop: "1px solid #d7d7d7",
        marginLeft: nested ? 10 : 0,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: nested ? "9px 8px" : "12px 4px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          textAlign: "left",
          fontWeight: nested ? 600 : 700,
        }}
      >
        <span style={{ overflowWrap: "anywhere" }}>{title}</span>
        <span aria-hidden="true">{isOpen ? "▾" : "▸"}</span>
      </button>

      {isOpen && <div style={{ paddingBottom: 12 }}>{children}</div>}
    </section>
  );
}

function NodeGrid({ children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        alignContent: "start",
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}

function NodeBlock({
  title,
  assetType,
  selected,
  onClick,
  disabled = false,
  general = false,
  hasAgreement = false,
}) {
  if (general) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={{
          minHeight: 92,
          padding: 12,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          textAlign: "left",
          border: selected ? "2px solid #333" : "1px solid #ccc",
          borderRadius: 8,
          background: selected ? "#ececec" : "white",
          color: "#222",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <strong
          style={{
            display: "block",
            fontSize: 14,
            lineHeight: 1.35,
            overflowWrap: "anywhere",
          }}
        >
          {title}
        </strong>
      </button>
    );
  }

  const resolvedAssetType = assetType || ASSET_TYPES.UNKNOWN;
  const ui =
    ASSET_TYPE_UI[resolvedAssetType] || ASSET_TYPE_UI[ASSET_TYPES.UNKNOWN];
  const AssetIcon = ui.icon;
  const isUnknown = resolvedAssetType === ASSET_TYPES.UNKNOWN;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        minHeight: 104,
        padding: 12,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        textAlign: "left",
        border: selected
          ? `2px solid ${ui.color}`
          : isUnknown
            ? "1px solid #c5c5c5"
            : "1px solid #ccc",
        borderRadius: 8,
        background: selected
          ? ui.badgeColor
          : isUnknown
            ? "#e7e7e7"
            : "white",
        color: isUnknown ? "#7a7a7a" : "#222",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: isUnknown ? 0.72 : 1,
      }}
    >
      {hasAgreement && (
        <div
          title="Agreement available"
          aria-label="Agreement available"
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 26,
            height: 26,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            background: "#dcfce7",
            color: "#15803d",
            border: "1px solid #bbf7d0",
          }}
        >
          <Handshake
            size={15}
            width={15}
            height={15}
            strokeWidth={2}
            aria-hidden="true"
          />
        </div>
      )}

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 10,
          padding: "3px 8px",
          borderRadius: 999,
          background: ui.badgeColor,
          color: ui.color,
          flex: "0 0 auto",
          maxWidth: hasAgreement ? "calc(100% - 30px)" : "100%",
        }}
      >
        <AssetIcon
          size={17}
          width={17}
          height={17}
          strokeWidth={2}
          color={ui.color}
          style={{
            display: "block",
            flex: "0 0 auto",
          }}
          aria-hidden="true"
        />

        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          {resolvedAssetType}
        </span>
      </div>

      <strong
        style={{
          display: "block",
          fontSize: 14,
          lineHeight: 1.35,
          overflowWrap: "anywhere",
        }}
      >
        {title}
      </strong>
    </button>
  );
}

function getFirstDefined(object, keys) {
  if (!object || typeof object !== "object") {
    return undefined;
  }

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      const value = object[key];

      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }
  }

  return undefined;
}

function MetadataValue({ value, emptyText = "Not available." }) {
  if (value === undefined || value === null || value === "") {
    return (
      <div
        style={{
          color: "#888",
          fontSize: 13,
          fontStyle: "italic",
        }}
      >
        {emptyText}
      </div>
    );
  }

  if (typeof value === "object") {
    return (
      <pre
        style={{
          margin: 0,
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          fontFamily: "monospace",
          fontSize: 12,
          lineHeight: 1.5,
        }}
      >
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return (
    <div
      style={{
        fontSize: 13,
        lineHeight: 1.5,
        overflowWrap: "anywhere",
      }}
    >
      {String(value)}
    </div>
  );
}

function MetadataBox({ title, children }) {
  return (
    <section
      style={{
        padding: 14,
        border: "1px solid #e1e1e1",
        borderRadius: 8,
        background: "#fafafa",
      }}
    >
      <h5
        style={{
          margin: "0 0 10px",
          color: "#333",
          fontSize: 13,
        }}
      >
        {title}
      </h5>

      {children}
    </section>
  );
}

function MetadataRow({ label, value, emptyText = "Not available." }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "105px minmax(0, 1fr)",
        gap: 10,
        padding: "6px 0",
        borderBottom: "1px solid #ececec",
      }}
    >
      <div
        style={{
          color: "#666",
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 12,
          overflowWrap: "anywhere",
        }}
      >
        {value || emptyText}
      </div>
    </div>
  );
}

function normalizePortList(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((port, index) => {
      if (port && typeof port === "object") {
        return {
          name:
            port.name ||
            port.label ||
            port.port_name ||
            port.portName ||
            `Port ${index + 1}`,
          type:
            port.type ||
            port.data_type ||
            port.dataType ||
            port.schema ||
            "unknown",
          description:
            port.description ||
            port.summary ||
            "",
        };
      }

      return {
        name: `Port ${index + 1}`,
        type: typeof port,
        description: String(port),
      };
    });
  }

  if (typeof value === "object") {
    return Object.entries(value).map(([key, port], index) => {
      if (port && typeof port === "object") {
        return {
          name:
            port.name ||
            port.label ||
            port.port_name ||
            port.portName ||
            key ||
            `Port ${index + 1}`,
          type:
            port.type ||
            port.data_type ||
            port.dataType ||
            port.schema ||
            "unknown",
          description:
            port.description ||
            port.summary ||
            "",
        };
      }

      return {
        name: key || `Port ${index + 1}`,
        type: typeof port,
        description: String(port),
      };
    });
  }

  return [];
}

function getIOSpecification(metadataRoot) {
  const ioRoot =
    getFirstDefined(metadataRoot, [
      "io_specification",
      "ioSpecification",
      "io_spec",
      "I/O Specification",
      "input_output_specification",
    ]) || {};

  const inputPorts = normalizePortList(
    getFirstDefined(ioRoot, [
      "input",
      "inputs",
      "input_ports",
      "inputPorts",
    ]) ||
      getFirstDefined(metadataRoot, [
        "input",
        "inputs",
        "input_ports",
        "inputPorts",
      ])
  );

  const outputPorts = normalizePortList(
    getFirstDefined(ioRoot, [
      "output",
      "outputs",
      "output_ports",
      "outputPorts",
    ]) ||
      getFirstDefined(metadataRoot, [
        "output",
        "outputs",
        "output_ports",
        "outputPorts",
      ])
  );

  return {
    inputPorts,
    outputPorts,
  };
}

function PortList({ title, ports }) {
  return (
    <section>
      <h6
        style={{
          margin: "0 0 8px",
          color: "#555",
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {title}
      </h6>

      {ports.length === 0 ? (
        <div
          style={{
            color: "#888",
            fontSize: 13,
            fontStyle: "italic",
          }}
        >
          No ports defined.
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {ports.map((port, index) => (
            <div
              key={`${title}-${port.name}-${index}`}
              style={{
                display: "grid",
                gridTemplateColumns: "74px minmax(0, 1fr)",
                gap: 10,
                padding: "9px 10px",
                border: "1px solid #e5e5e5",
                borderRadius: 6,
                background: "white",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#555",
                }}
              >
                {port.name || `Port ${index + 1}`}
              </div>

              <div
                style={{
                  minWidth: 0,
                  fontSize: 12,
                  lineHeight: 1.45,
                  overflowWrap: "anywhere",
                }}
              >
                <span
                  style={{
                    marginRight: 6,
                    color: "#2563eb",
                    fontFamily: "monospace",
                    fontWeight: 700,
                  }}
                >
                  ({port.type || "unknown"})
                </span>

                <span>
                  {port.description || "No description."}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function IOSpecification({ metadataRoot }) {
  const { inputPorts, outputPorts } = getIOSpecification(metadataRoot);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <PortList title="Input" ports={inputPorts} />

      <div
        style={{
          height: 1,
          background: "#e5e5e5",
        }}
      />

      <PortList title="Output" ports={outputPorts} />
    </div>
  );
}

const REQUIREMENT_CATEGORIES = {
  HARDWARE: "hardware",
  SOFTWARE: "software",
  DATASPACE: "dataspace",
};

function normalizeRequirementCategory(category) {
  const normalized = String(category || "").trim().toLowerCase();

  if (normalized === "hardware") {
    return REQUIREMENT_CATEGORIES.HARDWARE;
  }

  if (normalized === "software") {
    return REQUIREMENT_CATEGORIES.SOFTWARE;
  }

  // Older metadata may still use "negotiation".
  if (
    normalized === "dataspace" ||
    normalized === "negotiation" ||
    normalized === "contract"
  ) {
    return REQUIREMENT_CATEGORIES.DATASPACE;
  }

  return null;
}

function normalizeRequirementItem(item, fallbackCategory, index) {
  if (typeof item === "string") {
    return {
      category: fallbackCategory,
      key: item,
      operator: "exists",
      value: true,
      description: "",
    };
  }

  if (!item || typeof item !== "object") {
    return {
      category: fallbackCategory,
      key: `requirement_${index + 1}`,
      operator: "equals",
      value: item,
      description: "",
    };
  }

  return {
    category:
      normalizeRequirementCategory(item.category) ||
      fallbackCategory,
    key:
      item.key ||
      item.name ||
      item.requirement ||
      `requirement_${index + 1}`,
    operator:
      item.operator ||
      item.op ||
      item.comparator ||
      "exists",
    value:
      Object.prototype.hasOwnProperty.call(item, "value")
        ? item.value
        : true,
    description:
      item.description ||
      item.summary ||
      "",
    mandatory:
      item.mandatory !== false,
  };
}

function normalizeRequirementGroup(value, category) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item, index) =>
      normalizeRequirementItem(item, category, index)
    );
  }

  if (typeof value === "object") {
    return Object.entries(value).map(([key, rawValue], index) => {
      if (
        rawValue &&
        typeof rawValue === "object" &&
        !Array.isArray(rawValue)
      ) {
        return normalizeRequirementItem(
          {
            key,
            ...rawValue,
          },
          category,
          index
        );
      }

      return normalizeRequirementItem(
        {
          key,
          operator: "equals",
          value: rawValue,
        },
        category,
        index
      );
    });
  }

  return [
    normalizeRequirementItem(value, category, 0),
  ];
}

function getRequirements(metadataRoot) {
  const requirementRoot =
    getFirstDefined(metadataRoot, [
      "requirements",
      "Requirements",
      "requirement",
    ]) || {};

  const result = {
    hardware: [],
    software: [],
    dataspace: [],
  };

  if (Array.isArray(requirementRoot)) {
    requirementRoot.forEach((item, index) => {
      const category =
        normalizeRequirementCategory(item?.category) ||
        REQUIREMENT_CATEGORIES.SOFTWARE;

      result[category].push(
        normalizeRequirementItem(item, category, index)
      );
    });

    return result;
  }

  if (
    requirementRoot &&
    typeof requirementRoot === "object"
  ) {
    result.hardware = normalizeRequirementGroup(
      requirementRoot.hardware,
      REQUIREMENT_CATEGORIES.HARDWARE
    );

    result.software = normalizeRequirementGroup(
      requirementRoot.software,
      REQUIREMENT_CATEGORIES.SOFTWARE
    );

    result.dataspace = normalizeRequirementGroup(
      requirementRoot.dataspace ||
        requirementRoot.negotiation ||
        requirementRoot.contract,
      REQUIREMENT_CATEGORIES.DATASPACE
    );
  }

  return result;
}

function formatRequirementExpression(requirement) {
  const operatorLabels = {
    exists: "exists",
    equals: "=",
    not_equals: "!=",
    in: "in",
    min: ">=",
    max: "<=",
    compatible_with: "compatible with",
  };

  const operator =
    operatorLabels[requirement.operator] ||
    requirement.operator ||
    "=";

  if (
    requirement.operator === "exists" &&
    requirement.value === true
  ) {
    return `${requirement.key} exists`;
  }

  const value =
    typeof requirement.value === "object"
      ? JSON.stringify(requirement.value)
      : String(requirement.value);

  return `${requirement.key} ${operator} ${value}`;
}

function RequirementList({ title, requirements }) {
  return (
    <section>
      <h6
        style={{
          margin: "0 0 8px",
          color: "#555",
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {title}
      </h6>

      {requirements.length === 0 ? (
        <div
          style={{
            color: "#888",
            fontSize: 13,
            fontStyle: "italic",
          }}
        >
          No requirements defined.
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {requirements.map((requirement, index) => (
            <div
              key={`${title}-${requirement.key}-${index}`}
              style={{
                padding: "9px 10px",
                border: "1px solid #e5e5e5",
                borderRadius: 6,
                background: "white",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  fontSize: 12,
                  lineHeight: 1.45,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    marginTop: 1,
                    color: "#2563eb",
                    fontWeight: 700,
                  }}
                >
                  •
                </span>

                <code
                  style={{
                    minWidth: 0,
                    color: "#333",
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                  }}
                >
                  {formatRequirementExpression(requirement)}
                </code>
              </div>

              {requirement.description && (
                <div
                  style={{
                    marginTop: 5,
                    marginLeft: 16,
                    color: "#666",
                    fontSize: 12,
                    lineHeight: 1.45,
                    overflowWrap: "anywhere",
                  }}
                >
                  {requirement.description}
                </div>
              )}

              {requirement.mandatory === false && (
                <div
                  style={{
                    marginTop: 5,
                    marginLeft: 16,
                    color: "#888",
                    fontSize: 11,
                    fontStyle: "italic",
                  }}
                >
                  Optional
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function RequirementsSpecification({ metadataRoot }) {
  const requirements = getRequirements(metadataRoot);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <RequirementList
        title="Hardware"
        requirements={requirements.hardware}
      />

      <div
        style={{
          height: 1,
          background: "#e5e5e5",
        }}
      />

      <RequirementList
        title="Software"
        requirements={requirements.software}
      />

      <div
        style={{
          height: 1,
          background: "#e5e5e5",
        }}
      />

      <RequirementList
        title="Dataspace"
        requirements={requirements.dataspace}
      />
    </div>
  );
}

function FormattedMetadata({ metadata }) {
  if (!metadata) {
    return null;
  }

  const category = metadata.category || metadata.source || "General";
  const isGeneral = category === "General";

  const metadataRoot = isGeneral
    ? metadata.template || {}
    : metadata.dataset || {};

  const assetName = getFirstDefined(metadataRoot, [
    "name",
    "title",
  ]);

  const assetType = isGeneral
    ? ASSET_TYPES.UNKNOWN
    : getAssetType(metadataRoot);

  const description = getFirstDefined(metadataRoot, [
    "description",
    "Description",
    "dct:description",
  ]);

  const sourceDetails = !isGeneral
    ? {
        dataspace: category,
        provider:
          metadata.participantId ||
          metadataRoot.participantId ||
          metadataRoot["dspace:participantId"],
        assetId:
          metadataRoot.id ||
          metadataRoot["@id"],
        connectorUrl:
          metadata.originator ||
          metadataRoot.originator,
        contact:
          metadataRoot.contact ||
          metadata.contact,
      }
    : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {!isGeneral && (
        <MetadataBox title="Source">
          <MetadataRow label="Dataspace" value={sourceDetails.dataspace} />
          <MetadataRow label="Provider" value={sourceDetails.provider} />
          <MetadataRow label="Asset ID" value={sourceDetails.assetId} />
          <MetadataRow
            label="Connector URL"
            value={sourceDetails.connectorUrl}
          />
        </MetadataBox>
      )}

      <MetadataBox title="Content">
        <MetadataRow label="Asset Name" value={assetName} />
        <MetadataRow
          label="Operational Type"
          value={assetType}
          emptyText={ASSET_TYPES.UNKNOWN}
        />
        <MetadataRow
          label="Contact"
          value={
            metadataRoot.contact_email ||
            metadata.contact_email
          }
        />
        <MetadataRow label="Description" value={description} />
      </MetadataBox>

      {isGeneral && (
        <MetadataBox title="I/O Specification">
          <IOSpecification metadataRoot={metadataRoot} />
        </MetadataBox>
      )}

      <MetadataBox title="Requirements">
        <RequirementsSpecification metadataRoot={metadataRoot} />
      </MetadataBox>
    </div>
  );
}

function buildDataspaceNodeConfig(selectedCatalogItem) {
  const dataset = selectedCatalogItem?.dataset || {};

  const dataspacePrefix =
  selectedCatalogItem?.category === "DLR dataspace"
    ? "dlr"
    : selectedCatalogItem?.category === "TSI dataspace"
      ? "tsi"
      : "";

  const commonParams = {
    provider_bpn:
      selectedCatalogItem?.providerId ||
      selectedCatalogItem?.participantId ||
      "",
    provider_url:
      selectedCatalogItem?.originator ||
      selectedCatalogItem?.endpointUrl ||
      "",
    asset_id:
      dataset.id ||
      dataset["@id"] ||
      "",
  };

  if (selectedCatalogItem?.assetType === ASSET_TYPES.STATIC_FILE) {
    return {
      templateKey: "static_file",
      label:
        dataset.name ||
        dataset.title ||
        dataset.filename ||
        dataset.id ||
        dataset["@id"] ||
        "Static File",
      params: {
        ...commonParams,
        type: `${dataspacePrefix}.static_file`,
      },
    };
  }

  if (selectedCatalogItem?.assetType === ASSET_TYPES.CONTAINER) {
    return {
      templateKey: "container",
      label:
        dataset.name ||
        dataset.title ||
        dataset.filename ||
        dataset.id ||
        dataset["@id"] ||
        "Container",
      params: {
        ...commonParams,
        type: `${dataspacePrefix}.container`,
        representation:
          dataset.representation ||
          dataset.distribution_type ||
          "dockerfile",
        platforms: Array.isArray(dataset.platforms)
          ? dataset.platforms
          : dataset.platforms
            ? [dataset.platforms]
            : [],
        image_name: dataset.image_name || "",
        image_tag: dataset.image_tag || "",
        registry_addr:
          dataset.registry_addr ??
          dataset.registry ??
          null,
      },
    };
  }

  return null;
}

export default function PredefinedNodeModal({
  isOpen,
  onClose,
  selectedTemplateKey,
  setSelectedTemplateKey,
  addPredefinedNode,
}) {
  const [searchText, setSearchText] = useState("");
  const [leftPaneRatio, setLeftPaneRatio] = useState(70);

  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [modalSize, setModalSize] = useState(() => ({
    width: Math.min(1100, window.innerWidth * 0.95),
    height: Math.min(760, window.innerHeight * 0.9),
  }));

  const [catalogs, setCatalogs] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [selectedCatalogItem, setSelectedCatalogItem] = useState(null);
  const [isFormattedMetadata, setIsFormattedMetadata] = useState(true);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [negotiationMessage, setNegotiationMessage] = useState("");

  const [openSections, setOpenSections] = useState({
    general: true,
    dlr: true,
    tsi: true,
  });

  const [openParticipants, setOpenParticipants] = useState({});

  const splitContainerRef = useRef(null);
  const isSplitResizingRef = useRef(false);
  const dragStateRef = useRef(null);
  const resizeStateRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchText("");
      setLeftPaneRatio(70);
      setSelectedCatalogItem(null);
      setIsFormattedMetadata(true);
      setAgreements([]);
      setIsNegotiating(false);
      setNegotiationMessage("");
      return;
    }

    const abortController = new AbortController();

    async function loadCatalogs() {
      setIsCatalogLoading(true);
      setCatalogError("");

      try {
        const response = await fetch(CATALOG_URL, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Catalog request failed with status ${response.status}.`
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("The catalog response must be a JSON array.");
        }

        setCatalogs(data);

        try {
          const agreementResponse = await fetch(AGREEMENTS_URL, {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            signal: abortController.signal,
          });

          if (!agreementResponse.ok) {
            throw new Error(
              `Agreement request failed with status ${agreementResponse.status}.`
            );
          }

          const agreementData = await agreementResponse.json();

          if (!Array.isArray(agreementData)) {
            throw new Error("The agreement response must be a JSON array.");
          }

          setAgreements(agreementData);
        } catch (agreementError) {
          if (agreementError.name !== "AbortError") {
            console.warn("Failed to load agreements:", agreementError);
            setAgreements([]);
          }
        }

        const participantState = {};
        data.forEach((catalog) => {
          const participantId =
            catalog?.["dspace:participantId"] || "Unknown participant";
          participantState[participantId] = true;
        });
        setOpenParticipants(participantState);
      } catch (error) {
        if (error.name !== "AbortError") {
          setCatalogError(error.message || "Failed to load catalogs.");
          setCatalogs([]);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsCatalogLoading(false);
        }
      }
    }

    loadCatalogs();

    return () => abortController.abort();
  }, [isOpen]);

  useEffect(() => {
    function handlePointerMove(event) {
      if (isSplitResizingRef.current && splitContainerRef.current) {
        const bounds = splitContainerRef.current.getBoundingClientRect();
        const ratio = ((event.clientX - bounds.left) / bounds.width) * 100;
        setLeftPaneRatio(Math.min(85, Math.max(35, ratio)));
      }

      if (dragStateRef.current) {
        const { startX, startY, initialX, initialY } = dragStateRef.current;

        setModalPosition({
          x: initialX + event.clientX - startX,
          y: initialY + event.clientY - startY,
        });
      }

      if (resizeStateRef.current) {
        const {
          startX,
          startY,
          initialWidth,
          initialHeight,
        } = resizeStateRef.current;

        const maxWidth = Math.max(520, window.innerWidth - 40);
        const maxHeight = Math.max(420, window.innerHeight - 40);

        setModalSize({
          width: Math.min(
            maxWidth,
            Math.max(520, initialWidth + event.clientX - startX)
          ),
          height: Math.min(
            maxHeight,
            Math.max(420, initialHeight + event.clientY - startY)
          ),
        });
      }
    }

    function stopPointerAction() {
      isSplitResizingRef.current = false;
      dragStateRef.current = null;
      resizeStateRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopPointerAction);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopPointerAction);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  const normalizedSearchText = searchText.trim().toLowerCase();

  const filteredTemplateKeys = useMemo(() => {
    return Object.keys(PREDEFINED_NODE_TEMPLATES).filter((templateKey) =>
      templateKey.toLowerCase().includes(normalizedSearchText)
    );
  }, [normalizedSearchText]);

  const agreementKeys = useMemo(() => {
    const keys = new Set();

    agreements.forEach((agreement) => {
      const assetId = agreement?.assetId;
      const providerId = agreement?.providerId;

      if (assetId && providerId) {
        keys.add(`${providerId}::${assetId}`);
      }
    });

    return keys;
  }, [agreements]);

  function datasetHasAgreement(dataset, participantId) {
    const assetId =
      dataset?.id ||
      dataset?.["@id"];

    if (!assetId || !participantId) {
      return false;
    }

    return agreementKeys.has(`${participantId}::${assetId}`);
  }

  const catalogGroups = useMemo(() => {
    return catalogs.map((catalog) => {
      const participantId =
        catalog?.["dspace:participantId"] || "Unknown participant";

      const datasets = Array.isArray(catalog?.["dcat:dataset"])
        ? catalog["dcat:dataset"]
        : [];

      const filteredDatasets = datasets.filter((dataset) => {
        if (!normalizedSearchText) {
          return true;
        }

        const searchableValues = [
          dataset?.name,
          dataset?.title,
          dataset?.filename,
          dataset?.id,
          dataset?.["@id"],
          getAssetType(dataset),
        ];

        return searchableValues.some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(normalizedSearchText)
        );
      });

      return {
        participantId,
        catalog,
        datasets: filteredDatasets,
      };
    });
  }, [catalogs, normalizedSearchText]);

  if (!isOpen) {
    return null;
  }

  function toggleSection(sectionKey) {
    setOpenSections((current) => ({
      ...current,
      [sectionKey]: !current[sectionKey],
    }));
  }

  function toggleParticipant(participantId) {
    setOpenParticipants((current) => ({
      ...current,
      [participantId]: !current[participantId],
    }));
  }

  function startSplitResizing(event) {
    event.preventDefault();
    isSplitResizingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  function startDraggingModal(event) {
    if (event.target.closest("button")) {
      return;
    }

    event.preventDefault();

    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      initialX: modalPosition.x,
      initialY: modalPosition.y,
    };

    document.body.style.cursor = "move";
    document.body.style.userSelect = "none";
  }

  function startResizingModal(event) {
    event.preventDefault();
    event.stopPropagation();

    resizeStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      initialWidth: modalSize.width,
      initialHeight: modalSize.height,
    };

    document.body.style.cursor = "nwse-resize";
    document.body.style.userSelect = "none";
  }

  function selectGeneralNode(templateKey) {
    setSelectedCatalogItem(null);
    setSelectedTemplateKey(templateKey);
  }

  function selectCatalogNode(catalog, dataset) {
    const participantId =
      catalog?.["dspace:participantId"] || "Unknown participant";

    setSelectedCatalogItem({
      category: "DLR dataspace",
      participantId,
      providerId: participantId,
      originator: catalog?.originator,
      endpointUrl: catalog?.["dcat:service"]?.["dcat:endpointURL"],
      assetType: getAssetType(dataset),
      hasAgreement: datasetHasAgreement(dataset, participantId),
      dataset,
    });

    setNegotiationMessage("");
  }

  function handleAdd() {
    if (selectedCatalogItem) {
      if (
        !selectedCatalogItem.hasAgreement ||
        selectedCatalogItem.assetType === ASSET_TYPES.UNKNOWN
      ) {
        return;
      }

      const nodeConfig = buildDataspaceNodeConfig(selectedCatalogItem);

      if (!nodeConfig) {
        return;
      }

      addPredefinedNode(
        nodeConfig.templateKey,
        nodeConfig.params,
        nodeConfig.label
      );
      onClose();
      return;
    }

    if (!selectedTemplateKey) {
      return;
    }

    addPredefinedNode();
    onClose();
  }

  async function handleNegotiate() {
    if (!selectedCatalogItem || selectedCatalogItem.hasAgreement) {
      return;
    }

    const assetId =
      selectedCatalogItem.dataset?.id ||
      selectedCatalogItem.dataset?.["@id"];

    const providerId =
      selectedCatalogItem.providerId ||
      selectedCatalogItem.participantId;

    if (!assetId || !providerId) {
      setNegotiationMessage(
        "Negotiation could not be started because asset or provider information is missing."
      );
      return;
    }

    setIsNegotiating(true);
    setNegotiationMessage("");

    try {
      const response = await fetch(NEGOTIATIONS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          bpn: providerId,
          assetId,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Negotiation request failed with status ${response.status}.`
        );
      }

      setNegotiationMessage(
        `${assetId} with provider ${providerId} is being negotiated. ` +
          "This may take several seconds. Reopen the node library to see the changes."
      );
    } catch (error) {
      setNegotiationMessage(
        error?.message || "Failed to start negotiation."
      );
    } finally {
      setIsNegotiating(false);
    }
  }

  const selectedMetadata = selectedCatalogItem
    ? selectedCatalogItem
    : selectedTemplateKey
      ? {
          category: "General",
          nodeType: selectedTemplateKey,
          template: PREDEFINED_NODE_TEMPLATES[selectedTemplateKey],
        }
      : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="predefined-node-dialog-title"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(0, 0, 0, 0.35)",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: modalSize.width,
          height: modalSize.height,
          position: "relative",
          transform: `translate(${modalPosition.x}px, ${modalPosition.y}px)`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: 10,
          background: "white",
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.2)",
        }}
      >
        <header
          onPointerDown={startDraggingModal}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flex: "0 0 auto",
            padding: "16px 20px",
            borderBottom: "1px solid #ddd",
            cursor: "move",
            userSelect: "none",
          }}
        >
          <h3 id="predefined-node-dialog-title" style={{ margin: 0 }}>
            Add Predefined Node
          </h3>

          <button type="button" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </header>

        <div
          ref={splitContainerRef}
          style={{
            display: "flex",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <section
            style={{
              width: `${leftPaneRatio}%`,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box",
              padding: 16,
              background: "#f7f7f7",
            }}
          >
            <input
              type="search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search nodes..."
              aria-label="Search nodes"
              style={{
                width: "100%",
                boxSizing: "border-box",
                flex: "0 0 auto",
                marginBottom: 14,
                padding: "10px 12px",
                border: "1px solid #ccc",
                borderRadius: 6,
                background: "white",
              }}
            />

            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                paddingRight: 4,
              }}
            >
              <CollapsibleSection
                title="General"
                isOpen={openSections.general}
                onToggle={() => toggleSection("general")}
              >
                {filteredTemplateKeys.length === 0 ? (
                  <p style={{ color: "#666" }}>No matching general nodes.</p>
                ) : (
                  <NodeGrid>
                    {filteredTemplateKeys.map((templateKey) => (
                      <NodeBlock
                        key={templateKey}
                        title={templateKey}
                        general
                        selected={
                          !selectedCatalogItem &&
                          selectedTemplateKey === templateKey
                        }
                        onClick={() => selectGeneralNode(templateKey)}
                      />
                    ))}
                  </NodeGrid>
                )}
              </CollapsibleSection>

              <CollapsibleSection
                title="DLR dataspace"
                isOpen={openSections.dlr}
                onToggle={() => toggleSection("dlr")}
              >
                {isCatalogLoading && (
                  <p style={{ color: "#666" }}>Loading catalogs...</p>
                )}

                {catalogError && (
                  <p style={{ color: "#b00020" }}>
                    Failed to load catalogs: {catalogError}
                  </p>
                )}

                {!isCatalogLoading &&
                  !catalogError &&
                  catalogGroups.length === 0 && (
                    <p style={{ color: "#666" }}>No catalogs available.</p>
                  )}

                {!isCatalogLoading &&
                  !catalogError &&
                  catalogGroups.map(({ participantId, catalog, datasets }) => (
                    <CollapsibleSection
                      key={catalog?.["@id"] || participantId}
                      title={participantId}
                      nested
                      isOpen={Boolean(openParticipants[participantId])}
                      onToggle={() => toggleParticipant(participantId)}
                    >
                      {datasets.length === 0 ? (
                        <p
                          style={{
                            marginLeft: 8,
                            color: "#666",
                            fontSize: 13,
                          }}
                        >
                          No matching assets.
                        </p>
                      ) : (
                        <NodeGrid>
                          {datasets.map((dataset) => {
                            const datasetId =
                              dataset?.id ||
                              dataset?.["@id"] ||
                              dataset?.name;

                            const assetType = getAssetType(dataset);
                            const hasAgreement = datasetHasAgreement(
                              dataset,
                              participantId
                            );

                            const selected =
                              selectedCatalogItem?.participantId ===
                                participantId &&
                              (selectedCatalogItem?.dataset?.id ||
                                selectedCatalogItem?.dataset?.["@id"]) ===
                                (dataset?.id || dataset?.["@id"]);

                            return (
                              <NodeBlock
                                key={`${participantId}-${datasetId}`}
                                title={
                                  dataset?.name ||
                                  dataset?.title ||
                                  dataset?.filename ||
                                  datasetId
                                }

                                assetType={assetType}
                                hasAgreement={hasAgreement}
                                selected={selected}
                                onClick={() =>
                                  selectCatalogNode(catalog, dataset)
                                }
                              />
                            );
                          })}
                        </NodeGrid>
                      )}
                    </CollapsibleSection>
                  ))}
              </CollapsibleSection>

              <CollapsibleSection
                title="TSI dataspace"
                isOpen={openSections.tsi}
                onToggle={() => toggleSection("tsi")}
              >
                <p style={{ color: "#666" }}>
                  No TSI dataspace source is configured yet.
                </p>
              </CollapsibleSection>
            </div>
          </section>

          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize modal panels"
            onPointerDown={startSplitResizing}
            style={{
              width: 8,
              flex: "0 0 8px",
              position: "relative",
              cursor: "col-resize",
              background: "#e5e5e5",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 2,
                height: 44,
                borderRadius: 999,
                background: "#999",
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>

          <section
            style={{
              width: `${100 - leftPaneRatio}%`,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              background: "white",
            }}
          >
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                boxSizing: "border-box",
                padding: 20,
              }}
            >
              <h4 style={{ marginTop: 0, marginBottom: 10 }}>
                Node Metadata
              </h4>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 16,
                  paddingBottom: 12,
                  borderBottom: "1px solid #e5e5e5",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#555",
                  }}
                >
                  Formatted view
                </span>

                <button
                  type="button"
                  role="switch"
                  aria-checked={isFormattedMetadata}
                  onClick={() =>
                    setIsFormattedMetadata((current) => !current)
                  }
                  style={{
                    width: 46,
                    height: 24,
                    position: "relative",
                    flex: "0 0 auto",
                    padding: 0,
                    border: "none",
                    borderRadius: 999,
                    background: isFormattedMetadata ? "#2563eb" : "#b8b8b8",
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: 3,
                      left: isFormattedMetadata ? 25 : 3,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "white",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
                      transition: "left 120ms ease",
                    }}
                  />
                </button>
              </div>

              {selectedMetadata ? (
                isFormattedMetadata ? (
                  <FormattedMetadata metadata={selectedMetadata} />
                ) : (
                  <pre
                    style={{
                      margin: 0,
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                      fontFamily: "monospace",
                      fontSize: 12,
                      lineHeight: 1.5,
                    }}
                  >
                    {JSON.stringify(selectedMetadata, null, 2)}
                  </pre>
                )
              ) : (
                <p style={{ color: "#666" }}>
                  Select a node to view its metadata.
                </p>
              )}
            </div>

            <footer
              style={{
                flex: "0 0 auto",
                padding: 16,
                borderTop: "1px solid #ddd",
                background: "#fafafa",
              }}
            >
              {negotiationMessage && (
                <div
                  role="status"
                  style={{
                    marginBottom: 10,
                    padding: "9px 10px",
                    border: "1px solid #dbeafe",
                    borderRadius: 6,
                    background: "#eff6ff",
                    color: "#1e3a8a",
                    fontSize: 12,
                    lineHeight: 1.4,
                  }}
                >
                  {negotiationMessage}
                </div>
              )}

              <button
                type="button"
                onClick={
                  selectedCatalogItem &&
                  !selectedCatalogItem.hasAgreement
                    ? handleNegotiate
                    : handleAdd
                }
                disabled={
                  isNegotiating ||
                  (!selectedCatalogItem && !selectedTemplateKey) ||
                  (
                    selectedCatalogItem &&
                    selectedCatalogItem.hasAgreement &&
                    selectedCatalogItem.assetType === ASSET_TYPES.UNKNOWN
                  )
                }
                title={
                  selectedCatalogItem &&
                  selectedCatalogItem.hasAgreement &&
                  selectedCatalogItem.assetType === ASSET_TYPES.UNKNOWN
                    ? "This asset cannot be added because its asset type is unknown."
                    : undefined
                }
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontWeight: 600,
                }}
              >
                {selectedCatalogItem &&
                !selectedCatalogItem.hasAgreement
                  ? isNegotiating
                    ? "Negotiating..."
                    : "Negotiate"
                  : "Add Node"}
              </button>
            </footer>
          </section>
        </div>

        <div
          role="separator"
          aria-label="Resize modal"
          onPointerDown={startResizingModal}
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: 18,
            height: 18,
            cursor: "nwse-resize",
            background:
              "linear-gradient(135deg, transparent 45%, #999 46%, #999 55%, transparent 56%)",
          }}
        />
      </div>
    </div>
  );
}
