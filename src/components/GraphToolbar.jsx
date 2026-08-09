import { useRef, useState } from "react";
import PredefinedNodeModal from "./PredefinedNodeModal";
import LoadWorkflowModal from "./LoadWorkflowModal";
import SaveWorkflowModal from "./SaveWorkflowModal";
import ExecutionManagerModal from "./ExecutionManagerModal";

const buttonStyle = {
  height: 38,
  padding: "0 12px",
  borderRadius: 6,
  border: "1px solid #ccc",
  background: "white",
  color: "#222",
  cursor: "pointer",
  fontWeight: 600,
  whiteSpace: "nowrap",
  boxShadow: "0 1px 4px rgba(0, 0, 0, 0.12)",
};

const disabledButtonStyle = {
  ...buttonStyle,
  color: "#999",
  background: "#f3f3f3",
  cursor: "not-allowed",
};

export default function GraphToolbar({
  selectedTemplateKey,
  setSelectedTemplateKey,
  addPredefinedNode,
  importJson,
  exportJson,
  runWorkflow,
  isRunning,
  runMessage,
  onLoadWorkflowGraph,
  onSaveWorkflow,
}) {
  const [isPredefinedNodeModalOpen, setIsPredefinedNodeModalOpen] = useState(false);
  const [isLoadWorkflowModalOpen, setIsLoadWorkflowModalOpen] = useState(false);
  const [isSaveWorkflowModalOpen, setIsSaveWorkflowModalOpen] = useState(false);
  const [isExecutionManagerModalOpen, setIsExecutionManagerModalOpen] = useState(false);
  const importInputRef = useRef(null);

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 6,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={() => setIsPredefinedNodeModalOpen(true)}
            style={buttonStyle}
          >
            Add Node
          </button>

          <button
            type="button"
            onClick={() => setIsLoadWorkflowModalOpen(true)}
            style={buttonStyle}
          >
            Load Workflow
          </button>

          <button
            type="button"
            onClick={() => setIsSaveWorkflowModalOpen(true)}
            style={buttonStyle}
          >
            Save Workflow
          </button>

          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            style={buttonStyle}
          >
            Import
          </button>

          <button type="button" onClick={exportJson} style={buttonStyle}>
            Export
          </button>

          <button
            type="button"
            onClick={() => setIsExecutionManagerModalOpen(true)}
            style={buttonStyle}
          >
            Execution Manager
          </button>

          <button type="button" disabled style={disabledButtonStyle}>
            Workflow Requirements
          </button>

          <button
            type="button"
            onClick={runWorkflow}
            disabled={isRunning}
            title="Create and execute workflow"
            style={{
              ...buttonStyle,
              border: "none",
              background: isRunning ? "#86c98e" : "#22a447",
              color: "white",
              cursor: isRunning ? "not-allowed" : "pointer",
            }}
          >
            {isRunning ? "Running..." : "Trigger"}
          </button>
        </div>

        {runMessage && (
          <div
            style={{
              maxWidth: 420,
              padding: "6px 9px",
              borderRadius: 4,
              background: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #ddd",
              fontSize: 12,
              overflowWrap: "anywhere",
            }}
          >
            {runMessage}
          </div>
        )}
      </div>

      <input
        ref={importInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: "none" }}
        onChange={importJson}
      />

      <LoadWorkflowModal
        isOpen={isLoadWorkflowModalOpen}
        onClose={() => setIsLoadWorkflowModalOpen(false)}
        onLoad={onLoadWorkflowGraph}
      />

      <SaveWorkflowModal
        isOpen={isSaveWorkflowModalOpen}
        onClose={() => setIsSaveWorkflowModalOpen(false)}
        onSave={onSaveWorkflow}
      />

      <ExecutionManagerModal
        isOpen={isExecutionManagerModalOpen}
        onClose={() => setIsExecutionManagerModalOpen(false)}
      />

      <PredefinedNodeModal
        isOpen={isPredefinedNodeModalOpen}
        onClose={() => setIsPredefinedNodeModalOpen(false)}
        selectedTemplateKey={selectedTemplateKey}
        setSelectedTemplateKey={setSelectedTemplateKey}
        addPredefinedNode={addPredefinedNode}
      />
    </>
  );
}
