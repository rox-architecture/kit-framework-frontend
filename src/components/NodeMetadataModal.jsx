import { useState } from "react";
import NodeMetadataPanel from "./add-node/NodeMetadataPanel";

export default function NodeMetadataModal({
  isOpen,
  metadata,
  onClose,
}) {
  const [formatted, setFormatted] = useState(true);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1500,
        background: "rgba(0, 0, 0, 0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "min(900px, calc(100vw - 40px))",
          maxHeight: "min(760px, calc(100vh - 40px))",
          background: "white",
          borderRadius: 10,
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.3)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            minHeight: 58,
            padding: "0 16px",
            borderBottom: "1px solid #ddd",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <strong>Node Metadata</strong>

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
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
          }}
        >
          <NodeMetadataPanel
            metadata={metadata}
            formatted={formatted}
            onToggleFormatted={() =>
              setFormatted((current) => !current)
            }
          />
        </div>
      </div>
    </div>
  );
}