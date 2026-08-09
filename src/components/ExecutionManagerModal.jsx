import { useCallback, useEffect, useState } from "react";
import { getExecutions } from "../services/workflowApi";

const formatTimestamp = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
};

const formatExecutedNodes = (nodes) => {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return "—";
  }

  return nodes.join(", ");
};

export default function ExecutionManagerModal({
  isOpen,
  onClose,
}) {
  const [executions, setExecutions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadExecutions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const data = await getExecutions();

      const executionList = data?.executions;

      if (!Array.isArray(executionList)) {
      throw new Error(
          "Invalid execution response. Expected { executions: [] }."
      );
      }

        setExecutions(executionList);
    } catch (loadError) {
      console.error(loadError);
      setError(
        loadError?.message ||
          "Failed to load executions."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    loadExecutions();
  }, [isOpen, loadExecutions]);

  if (!isOpen) return null;

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
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          width: "min(1100px, calc(100vw - 48px))",
          height: "min(680px, calc(100vh - 48px))",
          background: "white",
          borderRadius: 10,
          boxShadow:
            "0 12px 32px rgba(0, 0, 0, 0.28)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            minHeight: 56,
            padding: "0 16px",
            borderBottom: "1px solid #ddd",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            Execution Manager
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={loadExecutions}
              disabled={isLoading}
              title="Refresh executions"
              style={{
                height: 34,
                padding: "0 12px",
                borderRadius: 6,
                border: "1px solid #ccc",
                background: "white",
                cursor: isLoading
                  ? "not-allowed"
                  : "pointer",
                fontWeight: 600,
              }}
            >
              {isLoading ? "Refreshing..." : "↻ Refresh"}
            </button>

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
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            padding: 16,
          }}
        >
          {error && (
            <div
              style={{
                marginBottom: 12,
                padding: "10px 12px",
                borderRadius: 6,
                background: "#fff3f2",
                border: "1px solid #f0b4ae",
                color: "#b42318",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          {isLoading && executions.length === 0 ? (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                color: "#666",
              }}
            >
              Loading executions...
            </div>
          ) : executions.length === 0 ? (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                color: "#666",
              }}
            >
              No executions found.
            </div>
          ) : (
            <div
              style={{
                overflowX: "auto",
                border: "1px solid #ddd",
                borderRadius: 8,
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 12,
                  minWidth: 1000,
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#f5f5f5",
                      textAlign: "left",
                    }}
                  >
                    <th style={headerCellStyle}>
                      Reference ID
                    </th>
                    <th style={headerCellStyle}>
                      Workflow ID
                    </th>
                    <th style={headerCellStyle}>
                      Start
                    </th>
                    <th style={headerCellStyle}>
                      Finish
                    </th>
                    <th style={headerCellStyle}>
                      Executed Nodes
                    </th>
                    <th style={headerCellStyle}>
                      Current State
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {executions.map((execution) => (
                    <tr
                      key={execution.reference_id}
                      style={{
                        borderTop: "1px solid #eee",
                      }}
                    >
                      <td style={bodyCellStyle}>
                        {execution.reference_id}
                      </td>

                      <td style={bodyCellStyle}>
                        {execution.workflow_id}
                      </td>

                      <td style={bodyCellStyle}>
                        {formatTimestamp(
                          execution.start_at
                        )}
                      </td>

                      <td style={bodyCellStyle}>
                        {formatTimestamp(
                          execution.finish_at
                        )}
                      </td>

                      <td
                        style={{
                          ...bodyCellStyle,
                          maxWidth: 260,
                          whiteSpace: "normal",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {formatExecutedNodes(
                          execution.executed_nodes
                        )}
                      </td>

                      <td style={bodyCellStyle}>
                        {execution.current_state ||
                          "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const headerCellStyle = {
  padding: "10px 12px",
  borderRight: "1px solid #ddd",
  whiteSpace: "nowrap",
};

const bodyCellStyle = {
  padding: "10px 12px",
  verticalAlign: "top",
  borderRight: "1px solid #eee",
  whiteSpace: "nowrap",
};
