import { useCallback, useMemo, useState, useEffect } from "react";
import { addEdge, applyEdgeChanges, applyNodeChanges } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import CustomNode from "./components/CustomNode";
import GraphCanvas from "./components/GraphCanvas";
import Sidebar from "./components/Sidebar";
import PREDEFINED_NODE_TEMPLATES from "./templates";
import { normalizeEdgeForCanvas, serializeGraph } from "./utils/graph";
import { formatParamValue, getParamOrder, inferParamType, parseParamValue } from "./utils/params";
import { createWorkflow, requestWorkflowExecution } from "./services/workflowApi";

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [newParamName, setNewParamName] = useState("");
  const [newParamType, setNewParamType] = useState("string");
  const [newParamValue, setNewParamValue] = useState("");
  const [editingParamKey, setEditingParamKey] = useState(null);
  const [editingParamType, setEditingParamType] = useState("string");
  const [editingParamValue, setEditingParamValue] = useState("");
  const [selectedTemplateKey, setSelectedTemplateKey] = useState("save_to_file");
  const [isRunning, setIsRunning] = useState(false);
  const [runMessage, setRunMessage] = useState("");

  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);
  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId);

  const createNodePosition = (currentNodes) => ({
    x: 100 + currentNodes.length * 30,
    y: 100 + currentNodes.length * 30,
  });

  const addPredefinedNode = () => {
    const template = PREDEFINED_NODE_TEMPLATES[selectedTemplateKey];
    if (!template) return;

    const id = `${selectedTemplateKey}-${Date.now()}`;

    setNodes((currentNodes) => [
      ...currentNodes,
      {
        id,
        type: "custom",
        position: createNodePosition(currentNodes),
        data: {
          label: template.label,
          templateKey: selectedTemplateKey,
          isPredefined: true,
          params: { ...template.params },
          paramOrder: [...template.paramOrder],
          paramTypes: { ...template.paramTypes },
          paramValidators: { ...template.paramValidators },
          lockedParams: [...(template.lockedParams || [])],
          inputCount: template.inputCount,
          outputCount: template.outputCount,
        },
      },
    ]);
  };

  const updateNodeLabel = (label) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === selectedNodeId
          ? { ...node, data: { ...node.data, label } }
          : node
      )
    );
  };

  const updatePortCount = (key, value) => {
    const nextValue = Math.max(1, Number(value) || 1);

    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === selectedNodeId
          ? { ...node, data: { ...node.data, [key]: nextValue } }
          : node
      )
    );
  };

  const addParameter = () => {
    const key = newParamName.trim();
    if (!selectedNodeId || !key) {
      alert("Enter a parameter name.");
      return;
    }

    try {
      const parsedValue = parseParamValue(newParamValue, newParamType);

      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          if (node.id !== selectedNodeId) return node;

          const currentOrder = getParamOrder(node);
          const alreadyExists = Object.prototype.hasOwnProperty.call(
            node.data.params || {},
            key
          );

          return {
            ...node,
            data: {
              ...node.data,
              params: {
                ...node.data.params,
                [key]: parsedValue,
              },
              paramTypes: {
                ...node.data.paramTypes,
                [key]: newParamType,
              },
              paramOrder: alreadyExists ? currentOrder : [...currentOrder, key],
            },
          };
        })
      );

      setNewParamName("");
      setNewParamType("string");
      setNewParamValue("");
    } catch (error) {
      alert(error.message);
    }
  };

  const startEditingParameter = (key) => {
    if ((selectedNode.data.lockedParams || []).includes(key)) return;

    const value = selectedNode.data.params?.[key];
    const type = selectedNode.data.paramTypes?.[key] || inferParamType(value);

    setEditingParamKey(key);
    setEditingParamType(type);
    setEditingParamValue(formatParamValue(value, type));
  };

  const saveEditedParameter = () => {
    if ((selectedNode?.data.lockedParams || []).includes(editingParamKey)) {
      alert("This parameter is fixed by the predefined template.");
      return;
    }

    try {
      const parsedValue = parseParamValue(editingParamValue, editingParamType);
      const validator = selectedNode?.data.paramValidators?.[editingParamKey];

      if (validator === "url") {
        try {
          new URL(String(parsedValue));
        } catch {
          throw new Error("provider_url must be a valid URL, including http:// or https://.");
        }
      }

      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id === selectedNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  params: {
                    ...node.data.params,
                    [editingParamKey]: parsedValue,
                  },
                  paramTypes: {
                    ...node.data.paramTypes,
                    [editingParamKey]: editingParamType,
                  },
                },
              }
            : node
        )
      );

      setEditingParamKey(null);
    } catch (error) {
      alert(error.message);
    }
  };

  const removeParameter = (keyToRemove) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.id !== selectedNodeId) return node;

        const nextParams = { ...node.data.params };
        const nextParamTypes = { ...node.data.paramTypes };
        delete nextParams[keyToRemove];
        delete nextParamTypes[keyToRemove];

        return {
          ...node,
          data: {
            ...node.data,
            params: nextParams,
            paramTypes: nextParamTypes,
            paramOrder: getParamOrder(node).filter((key) => key !== keyToRemove),
          },
        };
      })
    );
  };

  const moveParameter = (key, direction) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.id !== selectedNodeId) return node;

        const order = getParamOrder(node);
        const index = order.indexOf(key);
        const newIndex = direction === "up" ? index - 1 : index + 1;

        if (index === -1 || newIndex < 0 || newIndex >= order.length) {
          return node;
        }

        const nextOrder = [...order];
        [nextOrder[index], nextOrder[newIndex]] = [
          nextOrder[newIndex],
          nextOrder[index],
        ];

        return {
          ...node,
          data: {
            ...node.data,
            paramOrder: nextOrder,
          },
        };
      })
    );
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
    setEditingParamKey(null);
    setNewParamName("");
    setNewParamType("string");
    setNewParamValue("");
  }, [selectedNodeId]);

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

    setIsRunning(true);
    setRunMessage("Creating workflow...");

    try {
      const graphJson = serializeGraph(nodes, edges);
      const workflowName = `my-workflow${Math.floor(Math.random() * 1000) + 1}`;
      const createResult = await createWorkflow(workflowName, graphJson);
      const workflowId = createResult.workflow_id;

      if (!workflowId) {
        throw new Error("The workflow response did not include workflow_id.");
      }

      setRunMessage("Requesting execution...");
      const executionResult = await requestWorkflowExecution(workflowId);

      console.log("Workflow created:", createResult);
      console.log("Execution requested:", executionResult);
      setRunMessage(`Execution requested: ${workflowId}`);
    } catch (error) {
      console.error(error);
      setRunMessage(`Error: ${error.message}`);
      alert(error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const exportJson = () => {
    const graph = serializeGraph(nodes, edges);
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

  const importJson = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      try {
        const graph = JSON.parse(readerEvent.target.result);

        if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
          alert("Invalid graph JSON. Expected { nodes: [], edges: [] }.");
          return;
        }

        const normalizedNodes = graph.nodes.map((node) => {
          const template = node.data?.templateKey
            ? PREDEFINED_NODE_TEMPLATES[node.data.templateKey]
            : null;
          const params = template
            ? { ...template.params, ...(node.data?.params || {}) }
            : { ...(node.data?.params || {}) };

          if (template?.lockedParams?.includes("type")) {
            params.type = template.params.type;
          }

          return {
            ...node,
            data: {
              ...node.data,
              params,
              paramOrder: template
                ? [...template.paramOrder]
                : node.data?.paramOrder || Object.keys(params),
              inputCount: template
                ? template.inputCount
                : Math.max(1, Number(node.data?.inputCount) || 1),
              outputCount: template
                ? template.outputCount
                : Math.max(1, Number(node.data?.outputCount) || 1),
              paramTypes: template
                ? { ...template.paramTypes }
                : Object.fromEntries(
                    Object.entries(params).map(([key, value]) => [
                      key,
                      node.data?.paramTypes?.[key] || inferParamType(value),
                    ])
                  ),
              paramValidators: template
                ? { ...template.paramValidators }
                : { ...(node.data?.paramValidators || {}) },
              lockedParams: template
                ? [...(template.lockedParams || [])]
                : [...(node.data?.lockedParams || [])],
            },
          };
        });

        setNodes(normalizedNodes);
        setEdges(graph.edges.map(normalizeEdgeForCanvas));
        setSelectedNodeId(null);
        setSelectedEdgeId(null);

        alert("Import completed.");
      } catch (error) {
        console.error(error);
        alert("Invalid JSON file.");
      }
    };

    reader.readAsText(file);

    event.target.value = "";
  };

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

  const selectedParamOrder = selectedNode
    ? selectedNode.data.paramOrder || Object.keys(selectedNode.data.params || {})
    : [];

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
      <Sidebar
        selectedTemplateKey={selectedTemplateKey}
        setSelectedTemplateKey={setSelectedTemplateKey}
        addPredefinedNode={addPredefinedNode}
        exportJson={exportJson}
        importJson={importJson}
        selectedEdge={selectedEdge}
        selectedNode={selectedNode}
        deleteSelectedEdge={deleteSelectedEdge}
        deleteSelectedNode={deleteSelectedNode}
        updateNodeLabel={updateNodeLabel}
        newParamName={newParamName}
        setNewParamName={setNewParamName}
        newParamType={newParamType}
        setNewParamType={setNewParamType}
        newParamValue={newParamValue}
        setNewParamValue={setNewParamValue}
        addParameter={addParameter}
        selectedParamOrder={selectedParamOrder}
        inferParamType={inferParamType}
        editingParamKey={editingParamKey}
        editingParamType={editingParamType}
        setEditingParamType={setEditingParamType}
        editingParamValue={editingParamValue}
        setEditingParamValue={setEditingParamValue}
        saveEditedParameter={saveEditedParameter}
        setEditingParamKey={setEditingParamKey}
        moveParameter={moveParameter}
        startEditingParameter={startEditingParameter}
        removeParameter={removeParameter}
        updatePortCount={updatePortCount}
      />
      <GraphCanvas
        nodes={nodes}
        edges={visibleEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        setSelectedNodeId={setSelectedNodeId}
        setSelectedEdgeId={setSelectedEdgeId}
        runWorkflow={runWorkflow}
        isRunning={isRunning}
        runMessage={runMessage}
      />
    </div>
  );
}
