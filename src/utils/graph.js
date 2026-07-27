import {
  getSourceHandleId,
  getTargetHandleId,
  stripHandleDirection,
} from "./ports";

export const normalizeEdgeForCanvas = (edge) => ({
  ...edge,
  sourceHandle:
    edge.sourceHandle == null
      ? edge.sourceHandle
      : edge.sourceHandle.startsWith("source:")
        ? edge.sourceHandle
        : getSourceHandleId(edge.sourceHandle),
  targetHandle:
    edge.targetHandle == null
      ? edge.targetHandle
      : edge.targetHandle.startsWith("target:")
        ? edge.targetHandle
        : getTargetHandleId(edge.targetHandle),
});

export const serializeGraph = (nodes, edges) => ({
  nodes,
  edges: edges.map((edge) => ({
    ...edge,
    sourceHandle: stripHandleDirection(edge.sourceHandle),
    targetHandle: stripHandleDirection(edge.targetHandle),
  })),
});
