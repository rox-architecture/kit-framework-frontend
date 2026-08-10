import { ASSET_TYPES } from "../../utils/nodeTypes";

import staticFileIcon from "../../assets/node-icons/static_file.svg";
import containerIcon from "../../assets/node-icons/container.svg";
import fileServiceIcon from "../../assets/node-icons/service_file.svg";
import streamingServiceIcon from "../../assets/node-icons/service_streaming.svg";
import defaultIcon from "../../assets/node-icons/default.svg";

const ASSET_TYPE_UI = {
  [ASSET_TYPES.STATIC_FILE]: {
    icon: staticFileIcon,
    color: "#2563eb",
    badgeColor: "#dbeafe",
  },
  [ASSET_TYPES.CONTAINER]: {
    icon: containerIcon,
    color: "#9333ea",
    badgeColor: "#ede9fe",
  },
  [ASSET_TYPES.FILE_SERVICE]: {
    icon: fileServiceIcon,
    color: "#ea580c",
    badgeColor: "#ffedd5",
  },
  [ASSET_TYPES.STREAMING_SERVICE]: {
    icon: streamingServiceIcon,
    color: "#0891b2",
    badgeColor: "#cffafe",
  },
  [ASSET_TYPES.WORKFLOW]: {
    icon: defaultIcon,
    color: "#059669",
    badgeColor: "#d1fae5",
  },
  [ASSET_TYPES.UNKNOWN]: {
    icon: defaultIcon,
    color: "#6b7280",
    badgeColor: "#e5e7eb",
  },
};

export function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  children,
  nested = false,
}) {
  return (
    <section
      className={`anm-collapsible-section ${nested ? "anm-collapsible-section--nested" : ""}`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={`anm-collapsible-button ${nested ? "anm-collapsible-button--nested" : ""}`}
      >
        <span style={{ overflowWrap: "anywhere" }}>{title}</span>
        <span aria-hidden="true">{isOpen ? "▾" : "▸"}</span>
      </button>

      {isOpen && <div style={{ paddingBottom: 12 }}>{children}</div>}
    </section>
  );
}

export function NodeGrid({ children }) {
  return (
    <div
      className="anm-node-grid"
    >
      {children}
    </div>
  );
}

const dataspaceNodeBlockBaseStyle = {
  minHeight: 104,
  padding: 12,
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "flex-start",
  textAlign: "left",
};

export function NodeBlock({
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
        className={`anm-general-node ${selected ? "anm-general-node--selected" : ""}`}
        style={{
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <strong
          className="anm-node-title"
        >
          {title}
        </strong>
      </button>
    );
  }

  const resolvedAssetType = assetType || ASSET_TYPES.UNKNOWN;
  const ui =
    ASSET_TYPE_UI[resolvedAssetType] || ASSET_TYPE_UI[ASSET_TYPES.UNKNOWN];
  const assetIcon = ui.icon;
  const isUnknown = resolvedAssetType === ASSET_TYPES.UNKNOWN;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...dataspaceNodeBlockBaseStyle,
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
          <span
            aria-hidden="true"
            style={{
              fontSize: 14,
              lineHeight: 1,
            }}
          >
            ✓
          </span>
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
        <img
          src={assetIcon}
          alt=""
          aria-hidden="true"
          style={{
            display: "block",
            width: 17,
            height: 17,
            flex: "0 0 auto",
            objectFit: "contain",
          }}
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
        className="anm-node-title"
      >
        {title}
      </strong>
    </button>
  );
}

