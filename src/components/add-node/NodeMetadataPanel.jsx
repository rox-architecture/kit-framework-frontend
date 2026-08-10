import NODE_METADATA from "../../config/nodeMetadata";
import { ASSET_TYPES, getAssetType, getBaseNodeType } from "../../utils/nodeTypes";

function getNodeMetadata(nodeType) {
  const baseType = getBaseNodeType(nodeType);
  return NODE_METADATA?.[baseType] || {};
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
        className="anm-empty-value"
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
      className="anm-metadata-value"
    >
      {String(value)}
    </div>
  );
}

function MetadataBox({ title, children }) {
  return (
    <section
      className="anm-metadata-box"
    >
      <h5
        className="anm-metadata-box-title"
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
      className="anm-metadata-row"
    >
      <div
        className="anm-metadata-row-label"
      >
        {label}
      </div>

      <div
        className="anm-metadata-row-value"
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
      className="anm-stack"
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
      className="anm-stack"
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

export function FormattedMetadata({ metadata }) {
  if (!metadata) {
    return null;
  }

  const category = metadata.category || metadata.source || "General";
  const isGeneral = category === "General";

  const dataset = metadata.dataset || {};

  const nodeType = isGeneral
    ? metadata.nodeType
    : getAssetType(dataset) === ASSET_TYPES.STATIC_FILE
      ? "static_file"
      : getAssetType(dataset) === ASSET_TYPES.CONTAINER
        ? "container"
        : dataset?.operational_type || "";

  const localMetadata = getNodeMetadata(nodeType);

  // --------------------------------------------------
  // General nodes
  //
  // All human-readable metadata is read from
  // config/nodeMetadata.js.
  // --------------------------------------------------
  if (isGeneral) {
    const descriptionRoot =
      localMetadata.description || {};

    const ioRoot =
      localMetadata.io_specification || {};

    const requirementsRoot =
      localMetadata.requirements || {};

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <MetadataBox title="Description">
          <MetadataRow
            label="Asset Name"
            value={
              descriptionRoot.name ||
              metadata.nodeType
            }
          />

          <MetadataRow
            label="Operational Type"
            value={
              descriptionRoot.operational_type ||
              metadata.nodeType
            }
          />

          <MetadataRow
            label="Contact"
            value={
              descriptionRoot.contact_email
            }
          />

          <MetadataRow
            label="Description"
            value={
              descriptionRoot.description
            }
          />
        </MetadataBox>

        <MetadataBox title="I/O Specification">
          <IOSpecification
            metadataRoot={{
              io_specification: ioRoot,
            }}
          />
        </MetadataBox>

        <MetadataBox title="Requirements">
          <RequirementsSpecification
            metadataRoot={{
              requirements: requirementsRoot,
            }}
          />
        </MetadataBox>
      </div>
    );
  }

  // --------------------------------------------------
  // Dataspace nodes
  //
  // Source / Description / Requirements:
  //   catalog metadata
  //
  // I/O Specification:
  //   config/nodeMetadata.js
  // --------------------------------------------------

  const assetType = getAssetType(dataset);

  const assetName = getFirstDefined(dataset, [
    "name",
    "title",
  ]);

  const description = getFirstDefined(dataset, [
    "description",
    "Description",
    "dct:description",
  ]);

  const sourceDetails = {
    dataspace: category,
    provider:
      metadata.participantId ||
      dataset.participantId ||
      dataset["dspace:participantId"],
    assetId:
      dataset.id ||
      dataset["@id"],
    connectorUrl:
      metadata.originator ||
      dataset.originator,
  };

  const ioRoot =
    localMetadata.io_specification || {};

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <MetadataBox title="Source">
        <MetadataRow
          label="Dataspace"
          value={sourceDetails.dataspace}
        />

        <MetadataRow
          label="Provider"
          value={sourceDetails.provider}
        />

        <MetadataRow
          label="Asset ID"
          value={sourceDetails.assetId}
        />

        <MetadataRow
          label="Connector URL"
          value={sourceDetails.connectorUrl}
        />
      </MetadataBox>

      <MetadataBox title="Description">
        <MetadataRow
          label="Asset Name"
          value={assetName}
        />

        <MetadataRow
          label="Operational Type"
          value={assetType}
          emptyText={ASSET_TYPES.UNKNOWN}
        />

        <MetadataRow
          label="Contact"
          value={
            dataset.contact_email ||
            metadata.contact_email
          }
        />

        <MetadataRow
          label="Description"
          value={description}
        />
      </MetadataBox>

      <MetadataBox title="I/O Specification">
        <IOSpecification
          metadataRoot={{
            io_specification: ioRoot,
          }}
        />
      </MetadataBox>

      <MetadataBox title="Requirements">
        <RequirementsSpecification
          metadataRoot={dataset}
        />
      </MetadataBox>
    </div>
  );
}


export default function NodeMetadataPanel({ metadata, formatted, onToggleFormatted }) {
  return (
    <div className="anm-metadata-scroll">
      <h4 className="anm-metadata-heading">Node Metadata</h4>
      <div className="anm-format-toggle-row">
        <span>Formatted view</span>
        <button type="button" role="switch" aria-checked={formatted} className={`anm-toggle ${formatted ? "anm-toggle--on" : ""}`} onClick={onToggleFormatted}>
          <span />
        </button>
      </div>
      {metadata ? (formatted ? <FormattedMetadata metadata={metadata} /> : <pre className="anm-pre">{JSON.stringify(metadata, null, 2)}</pre>) : <p className="anm-muted">Select a node to view its metadata.</p>}
    </div>
  );
}
