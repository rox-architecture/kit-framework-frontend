import { Background, Controls, MiniMap, ReactFlow } from "@xyflow/react";

export default function GraphCanvas({
  nodes, edges, nodeTypes, onNodesChange, onEdgesChange, onConnect,
  setSelectedNodeId, setSelectedEdgeId, runWorkflow, isRunning, runMessage,
}) {
  return (
    <main style={{ flex: 1, minWidth: 0, position: "relative" }}>
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
        <button
          onClick={runWorkflow}
          disabled={isRunning}
          title="Create and execute workflow"
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: "none",
            background: isRunning ? "#86c98e" : "#22a447",
            color: "white",
            fontSize: 22,
            cursor: isRunning ? "not-allowed" : "pointer",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25)",
          }}
        >
          {isRunning ? "…" : "▶"}
        </button>

        {runMessage && (
          <div
            style={{
              maxWidth: 320,
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

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => {
          setSelectedNodeId(node.id);
          setSelectedEdgeId(null);
        }}
        onEdgeClick={(_, edge) => {
          setSelectedEdgeId(edge.id);
          setSelectedNodeId(null);
        }}
        onPaneClick={() => {
          setSelectedNodeId(null);
          setSelectedEdgeId(null);
        }}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </main>
  );
}
