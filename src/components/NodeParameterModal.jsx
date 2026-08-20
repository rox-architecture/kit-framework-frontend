import { useEffect, useMemo, useState } from "react";
import NODE_TEMPLATES from "../config/nodeTemplates";

const cloneValue = (value) => {
  if (Array.isArray(value)) return [...value];
  if (value && typeof value === "object") return { ...value };
  return value;
};

const toEditableValue = (value, type) => {
  if (type === "object" || (type === "array" && !Array.isArray(value))) {
    return JSON.stringify(value ?? (type === "array" ? [] : {}), null, 2);
  }

  if (type === "array") {
    return Array.isArray(value) ? [...value] : [];
  }

  if (value === null || value === undefined) {
    return "";
  }

  if (type === "bool") {
    return value ? "true" : "false";
  }

  return String(value);
};

const parseValue = (rawValue, type, nullable = false) => {
  if (nullable && rawValue === "") {
    return null;
  }

  if (type === "string") {
    return String(rawValue ?? "");
  }

  if (type === "int") {
    const value = String(rawValue ?? "").trim();

    if (!/^-?\d+$/.test(value)) {
      throw new Error("must be an integer.");
    }

    return Number.parseInt(value, 10);
  }

  if (type === "number") {
    const value = Number(rawValue);

    if (!Number.isFinite(value)) {
      throw new Error("must be a valid number.");
    }

    return value;
  }

  if (type === "bool") {
    if (rawValue === "true") return true;
    if (rawValue === "false") return false;

    throw new Error("must be true or false.");
  }

  if (type === "object") {
    const parsed = JSON.parse(rawValue);

    if (
      parsed === null ||
      Array.isArray(parsed) ||
      typeof parsed !== "object"
    ) {
      throw new Error("must be a JSON object.");
    }

    return parsed;
  }

  if (type === "array") {
    if (Array.isArray(rawValue)) {
      return rawValue;
    }

    const parsed = JSON.parse(rawValue);

    if (!Array.isArray(parsed)) {
      throw new Error("must be a JSON array.");
    }

    return parsed;
  }

  return rawValue;
};



const getBaseNodeType = (type) => {
  if (!type) return "";

  return String(type)
    .trim()
    .split(".")
    .pop();
};

const getNodeTemplate = (node) => {
  const templateKey = node?.data?.templateKey;

  if (templateKey && NODE_TEMPLATES[templateKey]) {
    return NODE_TEMPLATES[templateKey];
  }

  const baseType = getBaseNodeType(
    node?.data?.params?.type
  );

  return NODE_TEMPLATES[baseType] || null;
};

function ParamHelpIcon({ text }) {
  if (!text) return null;

  return (
    <span
      title={text}
      aria-label={text}
      style={{
        width: 16,
        height: 16,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "0 0 auto",
        border: "1px solid #aaa",
        borderRadius: "50%",
        color: "#666",
        background: "#fff",
        fontSize: 10,
        fontWeight: 700,
        lineHeight: 1,
        cursor: "help",
        userSelect: "none",
      }}
    >
      ?
    </span>
  );
}

const REQUIREMENT_OPERATOR_SUGGESTIONS = [
  {
    value: "required",
    label: "required",
  },
  {
    value: "=",
    label: "=",
  },
  {
    value: "<=",
    label: "<=",
  },
  {
    value: ">=",
    label: ">=",
  },
  {
    value: "is any of",
    label: "is any of",
  },
];

const REQUIREMENT_OPERATOR_MAP = {
  exists: "required",
  requires: "required",
  required: "required",
  equals: "=",
  "=": "=",
  min: ">=",
  ">=": ">=",
  max: "<=",
  "<=": "<=",
  in: "is any of",
  "is any of": "is any of",
};

const stringifyRequirementValue = (value) => {
  if (value === null || value === undefined) {
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
};

const normalizeRequirementItem = (
  item,
  fallbackSubject = ""
) => {
  if (typeof item === "string") {
    return {
      subject: fallbackSubject || item,
      operator: "required",
      value: "",
    };
  }

  if (!item || typeof item !== "object") {
    return {
      subject: fallbackSubject,
      operator: "",
      value: stringifyRequirementValue(item),
    };
  }

  const subject =
    item.subject ??
    item.key ??
    item.namespace ??
    item.name ??
    fallbackSubject ??
    "";

  const rawOperator =
    item.operator ??
    item.op ??
    (item.value === true
      ? "required"
      : "=");

  const operator =
    REQUIREMENT_OPERATOR_MAP[
      rawOperator
    ] || String(rawOperator || "");

  const value =
    operator === "required" &&
    item.value === true
      ? ""
      : stringifyRequirementValue(
          item.value
        );

  return {
    subject: String(subject || ""),
    operator,
    value,
  };
};

const normalizeRequirementGroup = (group) => {
  if (!group) {
    return [];
  }

  if (Array.isArray(group)) {
    return group.map((item) =>
      normalizeRequirementItem(item)
    );
  }

  if (typeof group === "object") {
    return Object.entries(group).map(
      ([subject, item]) =>
        normalizeRequirementItem(
          item,
          subject
        )
    );
  }

  return [
    normalizeRequirementItem(group),
  ];
};

function RequirementEditor({
  title,
  category,
  requirements,
  onChange,
}) {
  const isHardware =
    category === "hardware";

  const tagBackground = isHardware
    ? "#ffedd5"
    : "#dbeafe";

  const tagBorder = isHardware
    ? "#fdba74"
    : "#93c5fd";

  const tagText = isHardware
    ? "#9a3412"
    : "#1d4ed8";

  const updateItem = (
    index,
    field,
    value
  ) => {
    onChange(
      requirements.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const addItem = () => {
    onChange([
      ...requirements,
      {
        subject: "",
        operator: "required",
        value: "",
      },
    ]);
  };

  const removeItem = (index) => {
    onChange(
      requirements.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  };

  return (
    <section
      style={{
        marginTop: 18,
        paddingTop: 16,
        borderTop: "1px solid #ddd",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          gap: 12,
          marginBottom: 10,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {title}
          </div>

          <div
            style={{
              marginTop: 2,
              color: "#777",
              fontSize: 11,
            }}
          >
            subject · operator · value
          </div>
        </div>

        <button
          type="button"
          onClick={addItem}
          style={{
            height: 30,
            padding: "0 10px",
            border: "1px solid #bbb",
            borderRadius: 6,
            background: "white",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          + Add
        </button>
      </div>

      {requirements.length === 0 ? (
        <div
          style={{
            color: "#888",
            fontSize: 12,
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
          {requirements.map(
            (requirement, index) => (
              <div
                key={`${category}-${index}`}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(170px, 1.8fr) minmax(100px, 0.8fr) minmax(140px, 1.4fr) 32px",
                  gap: 7,
                  alignItems: "center",
                }}
              >
                {/* Namespaced subject: editable tag */}
                <input
                  type="text"
                  value={
                    requirement.subject || ""
                  }
                  placeholder={
                    isHardware
                      ? "hardware.compute.memory"
                      : "software.runtime.python"
                  }
                  title="Namespaced subject"
                  onChange={(event) =>
                    updateItem(
                      index,
                      "subject",
                      event.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    height: 32,
                    boxSizing:
                      "border-box",
                    padding: "0 10px",
                    border: `1px solid ${tagBorder}`,
                    borderRadius: 999,
                    background:
                      tagBackground,
                    color: tagText,
                    fontSize: 11,
                    fontWeight: 600,
                    outline: "none",
                  }}
                />

                {/* Suggested operators + arbitrary custom text */}
                <input
                  type="text"
                  list="requirement-operator-options"
                  value={
                    requirement.operator || ""
                  }
                  placeholder="operator"
                  title="Operator"
                  onChange={(event) => {
                    const nextOperator =
                      event.target.value;

                    const nextRequirement = {
                      ...requirement,
                      operator: nextOperator,
                    };

                    if (
                      nextOperator === "required"
                    ) {
                      nextRequirement.value = "";
                    } else if (
                      nextOperator === "is any of" &&
                      !String(
                        requirement.value || ""
                      ).trim()
                    ) {
                      nextRequirement.value = "{}";
                    }

                    onChange(
                      requirements.map(
                        (item, itemIndex) =>
                          itemIndex === index
                            ? nextRequirement
                            : item
                      )
                    );
                  }}
                  style={{
                    ...requirementInputStyle,
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                  }}
                />

                <input
                  type="text"
                  value={
                    requirement.operator ===
                    "required"
                      ? ""
                      : requirement.value || ""
                  }
                  disabled={
                    requirement.operator ===
                    "required"
                  }
                  placeholder={
                    requirement.operator ===
                    "required"
                      ? "not applicable"
                      : requirement.operator ===
                          "is any of"
                        ? "{a, b, ...}"
                        : "value"
                  }
                  title={
                    requirement.operator ===
                    "required"
                      ? "Value is not used for required requirements."
                      : "Value"
                  }
                  onChange={(event) =>
                    updateItem(
                      index,
                      "value",
                      event.target.value
                    )
                  }
                  style={{
                    ...requirementInputStyle,
                    ...(requirement.operator ===
                    "required"
                      ? {
                          background: "#f3f4f6",
                          color: "#9ca3af",
                          cursor: "not-allowed",
                        }
                      : {}),
                  }}
                />

                <button
                  type="button"
                  title="Remove requirement"
                  onClick={() =>
                    removeItem(index)
                  }
                  style={{
                    width: 32,
                    height: 32,
                    padding: 0,
                    border:
                      "1px solid #ccc",
                    borderRadius: 6,
                    background: "white",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  ×
                </button>
              </div>
            )
          )}
        </div>
      )}

      <datalist id="requirement-operator-options">
        {REQUIREMENT_OPERATOR_SUGGESTIONS.map(
          (operator) => (
            <option
              key={operator.value}
              value={operator.value}
              label={operator.label}
            >
              {operator.label}
            </option>
          )
        )}
      </datalist>
    </section>
  );
}

export default function NodeParameterModal({
  isOpen,
  node,
  onClose,
  onSave,
}) {
  const [draftValues, setDraftValues] = useState({});
  const [draftRequirements, setDraftRequirements] = useState({
    hardware: [],
    software: [],
  });
  const [error, setError] = useState("");

  const paramOrder = useMemo(() => {
    if (!node) return [];

    return (
      node.data?.paramOrder ||
      Object.keys(node.data?.params || {})
    );
  }, [node]);

  useEffect(() => {
    if (!isOpen || !node) return;

    const nextDraft = {};

    for (const key of paramOrder) {
      const type =
        node.data?.paramTypes?.[key] ||
        (Array.isArray(node.data?.params?.[key])
          ? "array"
          : typeof node.data?.params?.[key] === "number"
            ? "number"
            : "string");

      nextDraft[key] = toEditableValue(
        cloneValue(node.data?.params?.[key]),
        type
      );
    }

    setDraftValues(nextDraft);

    setDraftRequirements({
      hardware: normalizeRequirementGroup(
        node.data?.requirements?.hardware
      ),
      software: normalizeRequirementGroup(
        node.data?.requirements?.software
      ),
    });

    setError("");
  }, [isOpen, node, paramOrder]);

  if (!isOpen || !node) return null;

  const lockedParams = node.data?.lockedParams || [];
  const paramTypes = node.data?.paramTypes || {};
  const paramOptions = node.data?.paramOptions || {};
  const nullableParams = node.data?.nullableParams || [];

  const nodeTemplate = getNodeTemplate(node);
  const paramHelp =
    nodeTemplate?.paramHelp ||
    node.data?.paramHelp ||
    {};

  const setDraftValue = (key, value) => {
    setDraftValues((current) => ({
      ...current,
      [key]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleArrayOptionToggle = (
    key,
    option,
    checked
  ) => {
    const current = Array.isArray(draftValues[key])
      ? draftValues[key]
      : [];

    const next = checked
      ? [...new Set([...current, option])]
      : current.filter((item) => item !== option);

    setDraftValue(key, next);
  };

  const handleSave = () => {
    try {
      const nextParams = {
        ...(node.data?.params || {}),
      };

      for (const key of paramOrder) {
        if (lockedParams.includes(key)) {
          continue;
        }

        const type =
          paramTypes[key] ||
          (Array.isArray(node.data?.params?.[key])
            ? "array"
            : "string");

        const nullable = nullableParams.includes(key);

        try {
          nextParams[key] = parseValue(
            draftValues[key],
            type,
            nullable
          );
        } catch (parseError) {
          throw new Error(
            `${key}: ${parseError.message}`
          );
        }

        const validator =
          node.data?.paramValidators?.[key];

        if (
          validator === "url" &&
          nextParams[key] !== null &&
          nextParams[key] !== ""
        ) {
          try {
            new URL(String(nextParams[key]));
          } catch {
            throw new Error(
              `${key}: must be a valid URL including http:// or https://.`
            );
          }
        }
      }

      const nextRequirements = {
        hardware: draftRequirements.hardware
          .map((item) => ({
            subject: String(
              item.subject || ""
            ).trim(),
            operator: String(
              item.operator || ""
            ).trim(),
            value:
              String(
                item.operator || ""
              ).trim() === "required"
                ? ""
                : String(
                    item.value || ""
                  ).trim(),
          }))
          .filter(
            (item) =>
              item.subject ||
              item.operator ||
              item.value
          ),

        software: draftRequirements.software
          .map((item) => ({
            subject: String(
              item.subject || ""
            ).trim(),
            operator: String(
              item.operator || ""
            ).trim(),
            value:
              String(
                item.operator || ""
              ).trim() === "required"
                ? ""
                : String(
                    item.value || ""
                  ).trim(),
          }))
          .filter(
            (item) =>
              item.subject ||
              item.operator ||
              item.value
          ),
      };

      onSave(
        node.id,
        nextParams,
        nextRequirements
      );

      onClose();
    } catch (saveError) {
      console.error(saveError);
      setError(
        saveError?.message ||
          "Failed to update parameters."
      );
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        background: "rgba(0, 0, 0, 0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          width: "min(860px, calc(100vw - 40px))",
          maxHeight: "min(760px, calc(100vh - 40px))",
          background: "white",
          borderRadius: 10,
          boxShadow:
            "0 12px 32px rgba(0, 0, 0, 0.28)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            minHeight: 58,
            padding: "0 16px",
            borderBottom: "1px solid #ddd",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              Node Parameters
            </div>

            <div
              style={{
                marginTop: 2,
                fontSize: 12,
                color: "#666",
              }}
            >
              {node.data?.label || node.id}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Close"
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
        </div>

        {/* Parameter list */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: 16,
          }}
        >
          {paramOrder.length === 0 ? (
            <div
              style={{
                color: "#666",
                fontSize: 13,
              }}
            >
              This node has no parameters.
            </div>
          ) : (
            paramOrder.map((key) => {
              const type =
                paramTypes[key] || "string";
              const value = draftValues[key];
              const options =
                paramOptions[key] || null;
              const locked =
                lockedParams.includes(key);
              const nullable =
                nullableParams.includes(key);

              return (
                <div
                  key={key}
                  style={{
                    marginBottom: 12,
                    padding: 12,
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    background: locked
                      ? "#f7f7f7"
                      : "white",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 7,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        minWidth: 0,
                      }}
                    >
                      <strong
                        style={{
                          fontSize: 13,
                          overflowWrap: "anywhere",
                        }}
                      >
                        {key}
                      </strong>

                      <ParamHelpIcon
                        text={paramHelp[key]}
                      />
                    </div>

                    <span
                      style={{
                        fontSize: 11,
                        color: "#777",
                      }}
                    >
                      {type}
                      {nullable
                        ? " · nullable"
                        : ""}
                      {locked
                        ? " · locked"
                        : ""}
                    </span>
                  </div>

                  {type === "array" &&
                  Array.isArray(options) ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {options.map((option) => (
                        <label
                          key={option}
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            fontSize: 13,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={
                              Array.isArray(value) &&
                              value.includes(option)
                            }
                            disabled={locked}
                            onChange={(event) =>
                              handleArrayOptionToggle(
                                key,
                                option,
                                event.target.checked
                              )
                            }
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  ) : Array.isArray(options) ? (
                    <select
                      value={value ?? ""}
                      disabled={locked}
                      onChange={(event) =>
                        setDraftValue(
                          key,
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    >
                      {nullable && (
                        <option value="">
                          null
                        </option>
                      )}

                      {options.map((option) => (
                        <option
                          key={option}
                          value={option}
                        >
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : type === "bool" ? (
                    <select
                      value={value ?? "false"}
                      disabled={locked}
                      onChange={(event) =>
                        setDraftValue(
                          key,
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    >
                      <option value="true">
                        true
                      </option>
                      <option value="false">
                        false
                      </option>
                    </select>
                  ) : type === "object" ||
                    type === "array" ? (
                    <textarea
                      value={
                        Array.isArray(value)
                          ? JSON.stringify(
                              value,
                              null,
                              2
                            )
                          : value ?? ""
                      }
                      disabled={locked}
                      rows={5}
                      onChange={(event) =>
                        setDraftValue(
                          key,
                          event.target.value
                        )
                      }
                      style={{
                        ...inputStyle,
                        height: "auto",
                        minHeight: 100,
                        resize: "vertical",
                        fontFamily:
                          "ui-monospace, SFMono-Regular, Menlo, monospace",
                      }}
                    />
                  ) : (
                    <input
                      type={
                        type === "int" ||
                        type === "number"
                          ? "number"
                          : "text"
                      }
                      step={
                        type === "int"
                          ? "1"
                          : type === "number"
                            ? "any"
                            : undefined
                      }
                      value={value ?? ""}
                      disabled={locked}
                      onChange={(event) =>
                        setDraftValue(
                          key,
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    />
                  )}
                </div>
              );
            })
          )}

          <RequirementEditor
            title="Hardware Requirements"
            category="hardware"
            requirements={
              draftRequirements.hardware
            }
            onChange={(requirements) =>
              setDraftRequirements(
                (current) => ({
                  ...current,
                  hardware: requirements,
                })
              )
            }
          />

          <RequirementEditor
            title="Software Requirements"
            category="software"
            requirements={
              draftRequirements.software
            }
            onChange={(requirements) =>
              setDraftRequirements(
                (current) => ({
                  ...current,
                  software: requirements,
                })
              )
            }
          />

          {error && (
            <div
              style={{
                marginTop: 4,
                padding: "10px 12px",
                background: "#fff3f2",
                border: "1px solid #f0b4ae",
                borderRadius: 6,
                color: "#b42318",
                fontSize: 12,
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid #ddd",
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              height: 36,
              padding: "0 14px",
              borderRadius: 6,
              border: "1px solid #ccc",
              background: "white",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            style={{
              height: 36,
              padding: "0 16px",
              borderRadius: 6,
              border: "none",
              background: "#22a447",
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  height: 36,
  boxSizing: "border-box",
  padding: "0 9px",
  border: "1px solid #bbb",
  borderRadius: 6,
  background: "white",
  fontSize: 13,
};


const requirementInputStyle = {
  width: "100%",
  height: 32,
  boxSizing: "border-box",
  padding: "0 8px",
  border: "1px solid #bbb",
  borderRadius: 6,
  background: "white",
  color: "#333",
  fontSize: 11,
  outline: "none",
};
