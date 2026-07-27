export const getParamOrder = (node) =>
  node.data.paramOrder || Object.keys(node.data.params || {});

export const inferParamType = (value) => {
  if (typeof value === "boolean") return "bool";
  if (typeof value === "number" && Number.isInteger(value)) return "int";
  if (value !== null && typeof value === "object") return "object";
  return "string";
};

export const formatParamValue = (value, type = inferParamType(value)) => {
  if (type === "object") return JSON.stringify(value, null, 2);
  return String(value);
};

export const parseParamValue = (rawValue, type) => {
  if (type === "string") return rawValue;

  if (type === "int") {
    if (!/^-?\d+$/.test(rawValue.trim())) {
      throw new Error("Integer values must contain only whole numbers.");
    }
    return Number.parseInt(rawValue, 10);
  }

  if (type === "number") {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) throw new Error("Enter a valid number.");
    return parsed;
  }

  if (type === "bool") {
    if (rawValue === "true") return true;
    if (rawValue === "false") return false;
    throw new Error("Boolean values must be true or false.");
  }

  if (type === "object") {
    const parsed = JSON.parse(rawValue);
    if (parsed === null || Array.isArray(parsed) || typeof parsed !== "object") {
      throw new Error('Object values must use JSON object syntax, for example {"key": 1}.');
    }
    return parsed;
  }

  return rawValue;
};
