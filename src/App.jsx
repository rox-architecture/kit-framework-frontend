import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { addEdge, applyEdgeChanges, applyNodeChanges } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import CustomNode from "./components/CustomNode";
import GraphCanvas from "./components/GraphCanvas";
import NodeParameterModal from "./components/NodeParameterModal";
import NODE_TEMPLATES from "./config/nodeTemplates";
import { serializeGraph, normalizeGraphForCanvas } from "./utils/graph";
import { migrateGraph } from "./utils/graphMigration";
import { createWorkflow, requestWorkflowExecution } from "./services/backendApi";

const WORKSPACE_STORAGE_KEY = "kit-workflow-workspace";

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [workflowName, setWorkflowName] = useState("Untitled Graph");
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState("save_to_file");
  const [isRunning, setIsRunning] = useState(false);
  const [runMessage, setRunMessage] = useState("");
  const [isNodeParameterModalOpen, setIsNodeParameterModalOpen] = useState(false);
  const [isWorkspaceRestored, setIsWorkspaceRestored] = useState(false);
  const workspaceSaveTimerRef = useRef(null);

  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);
  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId);

  const createNodePosition = (currentNodes) => ({
    x: 100 + currentNodes.length * 30,
    y: 100 + currentNodes.length * 30,
  });

  const addNodeFromTemplate = (
    templateKey = selectedTemplateKey,
    paramOverrides = {},
    labelOverride = null
  ) => {
    const template = NODE_TEMPLATES[templateKey];
    if (!template) return;

    const id = `${templateKey}-${Date.now()}`;

    setNodes((currentNodes) => [
      ...currentNodes,
      {
        id,
        type: "custom",
        position: createNodePosition(currentNodes),
        data: {
          label: labelOverride || template.label,
          templateKey,
          isTemplateNode: true,
          params: {
            ...template.params,
            ...paramOverrides,
          },
          paramOrder: [...template.paramOrder],
          paramTypes: { ...template.paramTypes },
          paramValidators: { ...(template.paramValidators || {}) },
          paramOptions: { ...(template.paramOptions || {}) },
          nullableParams: [...(template.nullableParams || [])],
          lockedParams: [...(template.lockedParams || [])],
          inputCount: template.inputCount,
          outputCount: template.outputCount,
        },
      },
    ]);
  };

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;

    setNodes((currentNodes) =>
      currentNodes.filter((node) => node.id !== selectedNodeId)
    );

    setEdges((currentEdges) =>
      currentEdges.filter(
        (edge) =>
          edge.source !== selectedNodeId &&
          edge.target !== selectedNodeId &&
          edge.id !== selectedEdgeId
      )
    );

    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, [selectedNodeId, selectedEdgeId]);

  const deleteSelectedEdge = useCallback(() => {
    if (!selectedEdgeId) return;

    setEdges((currentEdges) =>
      currentEdges.filter((edge) => edge.id !== selectedEdgeId)
    );

    setSelectedEdgeId(null);
  }, [selectedEdgeId]);

  const deleteSelected = useCallback(() => {
    if (selectedNodeId) {
      deleteSelectedNode();
      return;
    }

    if (selectedEdgeId) {
      deleteSelectedEdge();
    }
  }, [selectedNodeId, selectedEdgeId, deleteSelectedNode, deleteSelectedEdge]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const tagName = event.target.tagName;
      const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(tagName);

      if (isTyping) return;

      if (event.key === "Delete" || event.key === "Backspace") {
        deleteSelected();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [deleteSelected]);

  const runWorkflow = async () => {
    if (isRunning) return;

    const enteredName = window.prompt(
      "Graph name",
      workflowName
    );

    if (enteredName === null) {
      return;
    }

    const nextWorkflowName = enteredName.trim();

    if (!nextWorkflowName) {
      alert("Graph name cannot be empty.");
      return;
    }

    setWorkflowName(nextWorkflowName);
    setIsRunning(true);
    setRunMessage("Creating workflow...");

    try {
      const graphJson = serializeGraph(
        nodes,
        edges,
        nextWorkflowName
      );

      const createResult = await createWorkflow(
        nextWorkflowName,
        graphJson
      );

      const workflowId = createResult.workflow_id;

      if (!workflowId) {
        throw new Error(
          "The workflow response did not include workflow_id."
        );
      }

      setRunMessage("Requesting execution...");

      const executionResult =
        await requestWorkflowExecution(workflowId);

      console.log("Workflow created:", createResult);
      console.log("Execution requested:", executionResult);

      setRunMessage(
        `Execution requested: ${workflowId}`
      );
    } catch (error) {
      console.error(error);
      setRunMessage(`Error: ${error.message}`);
      alert(error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const saveWorkflow = async (name) => {
    const nextWorkflowName = name.trim();

    if (!nextWorkflowName) {
      throw new Error("Graph name cannot be empty.");
    }

    const graphJson = serializeGraph(
      nodes,
      edges,
      nextWorkflowName
    );

    const result = await createWorkflow(
      nextWorkflowName,
      graphJson
    );

    // Backend save succeeded:
    // update the currently opened graph name.
    setWorkflowName(nextWorkflowName);

    console.log("Workflow saved:", result);

    return result;
  };

  const exportJson = () => {
    const graph = serializeGraph(nodes, edges, workflowName);
    const json = JSON.stringify(graph, null, 2);
    console.log(json);

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "graph.json";
    anchor.click();

    URL.revokeObjectURL(url);
  };

  const applyGraphToCanvas = (graph) => {
    const normalized = normalizeGraphForCanvas(graph);

    setWorkflowName(normalized.workflowName);
    setNodes(normalized.nodes);
    setEdges(normalized.edges);

    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  };

  // Restore the last local workspace after a browser refresh.
  // This is separate from the explicit backend "Save Workflow" feature.
  useEffect(() => {
    try {
      const savedWorkspace = localStorage.getItem(WORKSPACE_STORAGE_KEY);

      if (savedWorkspace) {
        const parsedWorkspace = JSON.parse(savedWorkspace);
        const migratedWorkspace = migrateGraph(parsedWorkspace);
        applyGraphToCanvas(migratedWorkspace);
      }
    } catch (error) {
      console.error("Failed to restore local workspace:", error);
    } finally {
      setIsWorkspaceRestored(true);
    }
  }, []);

  // Automatically persist the current graph locally.
  // A short debounce avoids writing to localStorage for every tiny drag event.
  useEffect(() => {
    if (!isWorkspaceRestored) {
      return;
    }

    if (workspaceSaveTimerRef.current) {
      clearTimeout(workspaceSaveTimerRef.current);
    }

    workspaceSaveTimerRef.current = setTimeout(() => {
      try {
        const graph = serializeGraph(nodes, edges, workflowName);

        localStorage.setItem(
          WORKSPACE_STORAGE_KEY,
          JSON.stringify(graph)
        );
      } catch (error) {
        console.error("Failed to save local workspace:", error);
      }
    }, 250);

    return () => {
      if (workspaceSaveTimerRef.current) {
        clearTimeout(workspaceSaveTimerRef.current);
      }
    };
  }, [nodes, edges, workflowName, isWorkspaceRestored]);

  const loadWorkflowGraph = (databaseGraph) => {
    try {
      applyGraphToCanvas(databaseGraph);
    } catch (error) {
      console.error(error);
      alert(error.message || "Failed to load graph.");
    }
  };

  const importJson = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      try {
        const rawGraph = JSON.parse(
          readerEvent.target.result
        );

        // File import supports legacy schemas.
        // Database workflow load intentionally does NOT
        // pass through this migration.
        const graph = migrateGraph(rawGraph);

        applyGraphToCanvas(graph);
        alert("Import completed.");
      } catch (error) {
        console.error(error);
        alert(error.message || "Invalid JSON file.");
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  };

  const openNodeParameters = useCallback((nodeId) => {
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    setIsNodeParameterModalOpen(true);
  }, []);

  const saveNodeParameters = useCallback(
    (nodeId, nextParams) => {
      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  params: nextParams,
                },
              }
            : node
        )
      );
    },
    []
  );

  const updateMachineTag = useCallback(
    (nodeId, machineTag) => {
      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  machineTag,
                },
              }
            : node
        )
      );
    },
    []
  );

  const deleteNode = useCallback((nodeId) => {
    setNodes((currentNodes) =>
      currentNodes.filter((node) => node.id !== nodeId)
    );

    setEdges((currentEdges) =>
      currentEdges.filter(
        (edge) =>
          edge.source !== nodeId &&
          edge.target !== nodeId
      )
    );

    setSelectedNodeId((currentId) =>
      currentId === nodeId ? null : currentId
    );

    setIsNodeParameterModalOpen(false);
  }, []);

  const onNodesChange = useCallback((changes) => {
    setNodes((currentNodes) => applyNodeChanges(changes, currentNodes));
  }, []);

  const onEdgesChange = useCallback((changes) => {
    setEdges((currentEdges) => applyEdgeChanges(changes, currentEdges));
  }, []);

  const onConnect = useCallback((connection) => {
    if (!connection.sourceHandle || !connection.targetHandle) {
      console.error("Connection is missing a source or target handle.", connection);
      return;
    }

    setEdges((currentEdges) =>
      addEdge(
        {
          ...connection,
          id: `edge-${connection.source}-${connection.sourceHandle}-${connection.target}-${connection.targetHandle}-${Date.now()}`,
          animated: true,
        },
        currentEdges
      )
    );
  }, []);

  const visibleNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onOpenParameters: openNodeParameters,
          onDeleteNode: deleteNode,
          onUpdateMachineTag: updateMachineTag,
        },
      })),
    [
      nodes,
      openNodeParameters,
      deleteNode,
      updateMachineTag,
    ]
  );

  const visibleEdges = useMemo(
    () =>
      edges.map((edge) => ({
        ...edge,
        selected: edge.id === selectedEdgeId,
      })),
    [edges, selectedEdgeId]
  );

  return (
    <div
      style={{
        display: "flex", position: "fixed", inset: 0, width: "100vw",
        height: "100vh", margin: 0, padding: 0, textAlign: "left",
      }}
    >
      <GraphCanvas
        nodes={visibleNodes}
        edges={visibleEdges}
        workflowName={workflowName}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        setSelectedNodeId={setSelectedNodeId}
        setSelectedEdgeId={setSelectedEdgeId}
        selectedTemplateKey={selectedTemplateKey}
        setSelectedTemplateKey={setSelectedTemplateKey}
        addNodeFromTemplate={addNodeFromTemplate}
        importJson={importJson}
        exportJson={exportJson}
        runWorkflow={runWorkflow}
        isRunning={isRunning}
        runMessage={runMessage}
        onLoadWorkflowGraph={loadWorkflowGraph}
        onSaveWorkflow={saveWorkflow}
      />

      <NodeParameterModal
        isOpen={isNodeParameterModalOpen}
        node={selectedNode}
        onClose={() => setIsNodeParameterModalOpen(false)}
        onSave={saveNodeParameters}
      />
    </div>
  );
}
