import { useEffect, useState } from "react";

export default function SaveWorkflowModal({
  isOpen,
  onClose,
  onSave,
  currentWorkflowName,
}) {
  const [workflowName, setWorkflowName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    setWorkflowName(currentWorkflowName || "Untitled Graph");
    setIsSaving(false);
    setError("");
  }, [isOpen, currentWorkflowName]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const name = workflowName.trim();

    if (!name) {
      setError("Please enter a graph name.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      await onSave(name);

      onClose();
    } catch (saveError) {
      console.error(saveError);
      setError(
        saveError?.message ||
          "Failed to save graph."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0, 0, 0, 0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          onClose();
        }
      }}
    >
      <div
        style={{
          width: 420,
          maxWidth: "calc(100vw - 32px)",
          background: "white",
          borderRadius: 10,
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.28)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid #ddd",
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          Save Graph
        </div>

        <div style={{ padding: 16 }}>
          <label
            htmlFor="workflow-name"
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            Graph Name
          </label>

          <input
            id="workflow-name"
            type="text"
            value={workflowName}
            autoFocus
            disabled={isSaving}
            placeholder="Enter graph name"
            onChange={(event) => {
              setWorkflowName(event.target.value);
              if (error) setError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !isSaving) {
                handleSave();
              }
            }}
            style={{
              width: "100%",
              height: 38,
              boxSizing: "border-box",
              padding: "0 10px",
              border: "1px solid #bbb",
              borderRadius: 6,
              fontSize: 14,
            }}
          />

          {error && (
            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                color: "#b42318",
              }}
            >
              {error}
            </div>
          )}
        </div>

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
            disabled={isSaving}
            style={{
              height: 36,
              padding: "0 14px",
              borderRadius: 6,
              border: "1px solid #ccc",
              background: "white",
              cursor: isSaving ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !workflowName.trim()}
            style={{
              height: 36,
              padding: "0 16px",
              borderRadius: 6,
              border: "none",
              background:
                isSaving || !workflowName.trim()
                  ? "#9db7a4"
                  : "#22a447",
              color: "white",
              fontWeight: 600,
              cursor:
                isSaving || !workflowName.trim()
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
