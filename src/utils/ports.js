export const getInputPortName = (index) =>
  index === 0 ? "dep" : `input_${index - 1}`;

export const getOutputPortName = (index) =>
  index === 0 ? "dep" : `output_${index - 1}`;

export const getTargetHandleId = (portName) => `target:${portName}`;
export const getSourceHandleId = (portName) => `source:${portName}`;

export const stripHandleDirection = (handleId) => {
  if (typeof handleId !== "string") return handleId;
  return handleId.replace(/^(source|target):/, "");
};
