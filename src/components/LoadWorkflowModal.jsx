import { useEffect, useMemo, useState } from "react";
import { deleteWorkflow, getAllWorkflows } from "../services/workflowApi";

export default function LoadWorkflowModal({ isOpen, onClose, onLoad }) {
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const selectedWorkflow = useMemo(
    () => workflows.find((workflow) => workflow.workflow_id === selectedWorkflowId) || null,
    [workflows, selectedWorkflowId]
  );

  const loadWorkflows = async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await getAllWorkflows();
      const list = Array.isArray(result) ? result : [];

      list.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
      setWorkflows(list);
      setSelectedWorkflowId(null);
    } catch (loadError) {
      console.error(loadError);
      setError(loadError.message || "Failed to load workflows.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadWorkflows();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLoad = () => {
    if (!selectedWorkflow?.graph_json) return;
    onLoad(selectedWorkflow.graph_json);
    onClose();
  };

  const handleDelete = async () => {
    if (!selectedWorkflow) return;

    const confirmed = window.confirm(
      `Delete workflow \"${selectedWorkflow.workflow_name || selectedWorkflow.workflow_id}\"?`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setError("");

    try {
      await deleteWorkflow(selectedWorkflow.workflow_id);
      setWorkflows((current) =>
        current.filter((workflow) => workflow.workflow_id !== selectedWorkflow.workflow_id)
      );
      setSelectedWorkflowId(null);
    } catch (deleteError) {
      console.error(deleteError);
      setError(deleteError.message || "Failed to delete workflow.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatUpdatedAt = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
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
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "min(900px, 88vw)",
          height: "min(620px, 78vh)",
          background: "white",
          borderRadius: 10,
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.28)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid #ddd",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <strong>Load Workflow</strong>
          <button type="button" onClick={onClose}>✕</button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
          {isLoading ? (
            <div>Loading workflows...</div>
          ) : error ? (
            <div style={{ color: "#b42318" }}>{error}</div>
          ) : workflows.length === 0 ? (
            <div>No saved workflows found.</div>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                tableLayout: "fixed",
                fontSize: 13,
              }}
            >
              <thead>
                <tr style={{ background: "#f5f5f5" }}>
                  <th style={{ width: 42, padding: 10, borderBottom: "1px solid #ddd" }} />
                  <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #ddd" }}>
                    Workflow Name
                  </th>
                  <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #ddd" }}>
                    Workflow ID
                  </th>
                  <th style={{ width: 190, textAlign: "left", padding: 10, borderBottom: "1px solid #ddd" }}>
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody>
                {workflows.map((workflow) => {
                  const selected = workflow.workflow_id === selectedWorkflowId;

                  return (
                    <tr
                      key={workflow.workflow_id}
                      onClick={() => setSelectedWorkflowId(workflow.workflow_id)}
                      style={{
                        cursor: "pointer",
                        background: selected ? "#eaf2ff" : "white",
                      }}
                    >
                      <td style={{ padding: 10, borderBottom: "1px solid #eee", textAlign: "center" }}>
                        <input
                          type="radio"
                          checked={selected}
                          onChange={() => setSelectedWorkflowId(workflow.workflow_id)}
                        />
                      </td>
                      <td style={{ padding: 10, borderBottom: "1px solid #eee", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {workflow.workflow_name || "—"}
                      </td>
                      <td
                        title={workflow.workflow_id}
                        style={{ padding: 10, borderBottom: "1px solid #eee", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}
                      >
                        {workflow.workflow_id}
                      </td>
                      <td style={{ padding: 10, borderBottom: "1px solid #eee" }}>
                        {formatUpdatedAt(workflow.updated_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div
          style={{
            padding: 12,
            borderTop: "1px solid #ddd",
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={handleDelete}
            disabled={!selectedWorkflow || isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
          <button
            type="button"
            onClick={handleLoad}
            disabled={!selectedWorkflow || isDeleting}
          >
            Load
          </button>
        </div>
      </div>
    </div>
  );
}
