import { Background, Controls, MiniMap, ReactFlow } from "@xyflow/react";
import { useState } from "react";
import GraphToolbar from "./GraphToolbar";
import NodeMetadataModal from "./NodeMetadataModal";
import { getCatalogs } from "../services/backendApi";

export default function GraphCanvas({
  nodes,
  edges,
  workflowName,
  nodeTypes,
  onNodesChange,
  onEdgesChange,
  onConnect,
  setSelectedNodeId,
  setSelectedEdgeId,
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
  onOpenMonitoring,
}) {
  const [metadataNode, setMetadataNode] = useState(null);

  return (
    <main
      style={{
        flex: 1,
        minWidth: 0,
        position: "relative",
      }}
    >
      <GraphToolbar
        nodes={nodes}
        workflowName={workflowName}
        selectedTemplateKey={selectedTemplateKey}
        setSelectedTemplateKey={setSelectedTemplateKey}
        addNodeFromTemplate={addNodeFromTemplate}
        importJson={importJson}
        exportJson={exportJson}
        runWorkflow={runWorkflow}
        isRunning={isRunning}
        runMessage={runMessage}
        onLoadWorkflowGraph={onLoadWorkflowGraph}
        onSaveWorkflow={onSaveWorkflow}
        onOpenMonitoring={onOpenMonitoring}
      />

      <div
        style={{
          position: "absolute",
          top: 15,
          left: 16,
          zIndex: 10,
          padding: "7px 11px",
          background: "rgba(255, 255, 255, 0.92)",
          border: "1px solid #ddd",
          borderRadius: 6,
          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
          fontSize: 15,
          fontWeight: 600,
          pointerEvents: "none",
          maxWidth: 640,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={workflowName || "Untitled Workflow"}
      >
        <span style={{ fontWeight: 600, color: "#777", }}>
          Workflow Name:
        </span>{" "}
        {workflowName || "Untitled Workflow"}
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
        onNodeDoubleClick={async (event, node) => {
          event.stopPropagation();

          const providerId = node.data?.params?.provider_bpn;
          const assetId = node.data?.params?.asset_id;

          if (!providerId || !assetId) {
            setMetadataNode({
              metadata: {
                category: "General",
                nodeType: node.data?.templateKey,
              },
              error: null,
            });
            return;
          }

          try {
            const catalogs = await getCatalogs();
            const metadata = findCatalogAsset(
              catalogs,
              providerId,
              assetId
            );

            if (!metadata) {
              setMetadataNode({
                metadata: null,
                error: "Asset is not visible to you.",
              });
              return;
            }

            setMetadataNode({
              metadata,
              error: null,
            });
          } catch (error) {
            setMetadataNode({
              metadata: null,
              error:
                error?.message ||
                "Failed to load asset metadata.",
            });
          }
        }}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>

      <NodeMetadataModal
        isOpen={Boolean(metadataNode)}
        metadata={metadataNode?.metadata}
        error={metadataNode?.error}
        onClose={() => setMetadataNode(null)}
      />
    </main>
  );
}

function findCatalogAsset(catalogs, providerId, assetId) {
  const catalog = catalogs.find(
    (catalog) =>
      catalog?.["dspace:participantId"] === providerId
  );

  if (!catalog) return null;

  const dataset = (
    catalog?.["dcat:dataset"] || []
  ).find(
    (dataset) =>
      dataset?.id === assetId ||
      dataset?.["@id"] === assetId
  );

  if (!dataset) return null;

  return {
    category: "DLR dataspace",
    participantId: catalog["dspace:participantId"],
    providerId: catalog["dspace:participantId"],
    originator: catalog.originator,
    endpointUrl:
      catalog?.["dcat:service"]?.["dcat:endpointURL"],
    dataset,
  };
}