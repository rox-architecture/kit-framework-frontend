const GUI_VERSION = "1.2";

import {getSourceHandleId, getTargetHandleId, stripHandleDirection} from "./ports";
import NODE_TEMPLATES from "../config/nodeTemplates";
import { getBaseNodeType } from "./graphMigration";
import { inferParamType } from "./params";


export const normalizeEdgeForCanvas = (edge, index = 0) => {
  const rawSourceHandle =
    edge.sourceHandle ?? "output_1";

  const rawTargetHandle =
    edge.targetHandle ?? "input_1";

  const sourceHandle =
    rawSourceHandle.startsWith("source:")
      ? rawSourceHandle
      : getSourceHandleId(rawSourceHandle);

  const targetHandle =
    rawTargetHandle.startsWith("target:")
      ? rawTargetHandle
      : getTargetHandleId(rawTargetHandle);

  return {
    ...edge,

    id:
      edge.id ||
      `edge-${edge.source}-${rawSourceHandle}-${edge.target}-${rawTargetHandle}-${index}`,

    sourceHandle,
    targetHandle,

    animated: true,
  };
};


export const normalizeNodeForCanvas = (node, index = 0) => {
  const loadedParams = {
    ...(node.data?.params || {}),
  };

  // dlr.static_file -> static_file
  // tsi.container   -> container
  const templateKey = getBaseNodeType(
    loadedParams.type ||
      node.data?.templateKey
  );

  const template =
    NODE_TEMPLATES[templateKey] || null;

  // Template provides defaults.
  // Loaded params override them so namespaced types are preserved.
  const params = template
    ? {
        ...template.params,
        ...loadedParams,
      }
    : loadedParams;

  return {
    ...node,

    // React Flow information.
    // Programmatically created graphs may not contain these.
    type: node.type || "custom",

    position:
      node.position || {
        x: 100 + (index % 4) * 240,
        y: 100 + Math.floor(index / 4) * 180,
      },

    measured: undefined,
    selected: false,
    dragging: false,

    data: {
      // Reconstructed from params.type
      templateKey,

      params,

      label:
        node.data?.label ||
        template?.label ||
        loadedParams.type ||
        node.id,

      paramOrder: template
        ? [...template.paramOrder]
        : node.data?.paramOrder ||
          Object.keys(params),

      inputCount: template
        ? template.inputCount
        : Math.max(
            1,
            Number(node.data?.inputCount) || 1
          ),

      outputCount: template
        ? template.outputCount
        : Math.max(
            1,
            Number(node.data?.outputCount) || 1
          ),

      paramTypes: template
        ? { ...template.paramTypes }
        : Object.fromEntries(
            Object.entries(params).map(
              ([key, value]) => [
                key,
                node.data?.paramTypes?.[key] ||
                  inferParamType(value),
              ]
            )
          ),

      paramValidators: template
        ? { ...(template.paramValidators || {}) }
        : {
            ...(node.data?.paramValidators || {}),
          },

      paramOptions: template
        ? { ...(template.paramOptions || {}) }
        : {
            ...(node.data?.paramOptions || {}),
          },

      nullableParams: template
        ? [...(template.nullableParams || [])]
        : [...(node.data?.nullableParams || [])],

      lockedParams: template
        ? [...(template.lockedParams || [])]
        : [...(node.data?.lockedParams || [])],
    },
  };
};


export const normalizeGraphForCanvas = (graph) => {
  if (
    !Array.isArray(graph?.nodes) ||
    !Array.isArray(graph?.edges)
  ) {
    throw new Error(
      "Invalid graph JSON. Expected { nodes: [], edges: [] }."
    );
  }

  return {
    workflowName:
      graph.workflow_name || "Untitled Graph",

    nodes: graph.nodes.map(
      (node, index) =>
        normalizeNodeForCanvas(node, index)
    ),

    edges: graph.edges.map(
      (edge, index) =>
        normalizeEdgeForCanvas(edge, index)
    ),
  };
};

export const serializeGraph = (
  nodes,
  edges,
  workflowName
) => ({
  gui_version: GUI_VERSION,
  workflow_name: workflowName,

  nodes: nodes.map((node) => {
    const serializedNode = {
      id: node.id,

      data: {
        label: node.data?.label,
        params: node.data?.params || {},
      },
    };

    // Optional GUI information.
    // Keep position when the graph was created/edited in the GUI.
    if (node.position) {
      serializedNode.position = node.position;
    }

    // // machineTag cannot be reconstructed from the template.
    // if (node.data?.machineTag) {
    //   serializedNode.data.machineTag =
    //     node.data.machineTag;
    // }

    return serializedNode;
  }),

  edges: edges.map((edge) => ({
    source: edge.source,
    target: edge.target,

    sourceHandle:
      stripHandleDirection(edge.sourceHandle),

    targetHandle:
      stripHandleDirection(edge.targetHandle),
  })),
});
