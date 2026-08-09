import { Background, Controls, MiniMap, ReactFlow } from "@xyflow/react";
import GraphToolbar from "./GraphToolbar";

export default function GraphCanvas({
  nodes,
  edges,
  nodeTypes,
  onNodesChange,
  onEdgesChange,
  onConnect,
  setSelectedNodeId,
  setSelectedEdgeId,
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
  return (
    <main style={{ flex: 1, minWidth: 0, position: "relative" }}>
      <GraphToolbar
        selectedTemplateKey={selectedTemplateKey}
        setSelectedTemplateKey={setSelectedTemplateKey}
        addPredefinedNode={addPredefinedNode}
        importJson={importJson}
        exportJson={exportJson}
        runWorkflow={runWorkflow}
        isRunning={isRunning}
        runMessage={runMessage}
        onLoadWorkflowGraph={onLoadWorkflowGraph}
        onSaveWorkflow={onSaveWorkflow}
      />

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
