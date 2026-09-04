import { useRef, useState } from "react";
import AddNodeModal from "./AddNodeModal";
import LoadWorkflowModal from "./LoadWorkflowModal";
import SaveWorkflowModal from "./SaveWorkflowModal";
import ExecutionManagerModal from "./ExecutionManagerModal";
import WorkflowRequirementsModal from "./WorkflowRequirementsModal";
import MonitoringModal from "./MonitoringModal";

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

const iconButtonStyle = {
  ...buttonStyle,
  width: 38,
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

export default function GraphToolbar({
  selectedTemplateKey,
  setSelectedTemplateKey,
  addNodeFromTemplate,
  importJson,
  exportJson,
  runWorkflow,
  isRunning,
  runMessage,
  onLoadWorkflowGraph,
  onSaveWorkflow,
  nodes,
}) {
  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState(false);
  const [isLoadWorkflowModalOpen, setIsLoadWorkflowModalOpen] = useState(false);
  const [isSaveWorkflowModalOpen, setIsSaveWorkflowModalOpen] = useState(false);
  const [isExecutionManagerModalOpen, setIsExecutionManagerModalOpen] =
    useState(false);
  const [
    isWorkflowRequirementsModalOpen,
    setIsWorkflowRequirementsModalOpen,
  ] = useState(false);
  const [isMonitoringModalOpen, setIsMonitoringModalOpen] = useState(false);

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
            onClick={() => setIsAddNodeModalOpen(true)}
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

          <button
            type="button"
            onClick={exportJson}
            style={buttonStyle}
          >
            Export
          </button>

          <button
            type="button"
            onClick={() => setIsExecutionManagerModalOpen(true)}
            style={buttonStyle}
          >
            Execution Manager
          </button>

          <button
            type="button"
            onClick={() =>
              setIsWorkflowRequirementsModalOpen(true)
            }
            style={buttonStyle}
          >
            Workflow Requirements
          </button>

          <button
            type="button"
            onClick={runWorkflow}
            disabled={isRunning}
            title={isRunning ? "Workflow is running" : "Trigger workflow"}
            aria-label="Trigger workflow"
            style={{
              ...iconButtonStyle,
              border: "none",
              background: isRunning ? "#86c98e" : "#22a447",
              color: "white",
              cursor: isRunning ? "not-allowed" : "pointer",
            }}
          >
            {isRunning ? (
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" opacity="0.35" />
                <path d="M12 3a9 9 0 0 1 9 9" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsMonitoringModalOpen(true)}
            title="Monitoring"
            aria-label="Monitoring"
            style={{
              ...iconButtonStyle,
              border: "none",
              background: "#6b7280",
              color: "white",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect
                x="3"
                y="4"
                width="18"
                height="13"
                rx="2"
              />
              <path d="M8 21h8" />
              <path d="M12 17v4" />
              <path d="M7 12l3-3 2 2 4-4" />
            </svg>
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

      <WorkflowRequirementsModal
        isOpen={isWorkflowRequirementsModalOpen}
        onClose={() =>
          setIsWorkflowRequirementsModalOpen(false)
        }
        nodes={nodes}
      />

      <MonitoringModal
        isOpen={isMonitoringModalOpen}
        onClose={() => setIsMonitoringModalOpen(false)}
      />

      <AddNodeModal
        isOpen={isAddNodeModalOpen}
        onClose={() => setIsAddNodeModalOpen(false)}
        selectedTemplateKey={selectedTemplateKey}
        setSelectedTemplateKey={setSelectedTemplateKey}
        addNodeFromTemplate={addNodeFromTemplate}
      />
    </>
  );
}
