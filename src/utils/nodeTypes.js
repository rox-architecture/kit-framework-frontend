export const ASSET_TYPES = {
  STATIC_FILE: "Static File",
  CONTAINER: "Container",
  FILE_SERVICE: "File Service",
  STREAMING_SERVICE: "Streaming Service",
  WORKFLOW: "Workflow",
  UNKNOWN: "Unknown",
};

const OPERATIONAL_TYPE_MAP = {
  static_file: ASSET_TYPES.STATIC_FILE,
  container: ASSET_TYPES.CONTAINER,
  file_service: ASSET_TYPES.FILE_SERVICE,
  streaming_service: ASSET_TYPES.STREAMING_SERVICE,
  workflow: ASSET_TYPES.WORKFLOW,
};

const OPERATION_NODE_TYPES = new Set([
  "save_to_file",
  "zipper",
  "unzipper",
  "bash_command",
  "container_deployment_kubernetes",
]);

const NODE_DISPLAY_TYPES = {
  static_file: "File",
  container: "Container",
  file_service: "File",
  streaming_service: "Connection",

  workflow: null,
  unknown: null,
};

export function getNodeDisplayType(type) {
  if (!type) {
    return null;
  }

  // dlr.static_file -> static_file
  // tsi.container -> container
  const baseType = String(type)
    .trim()
    .toLowerCase()
    .split(".")
    .pop();

  if (OPERATION_NODE_TYPES.has(baseType)) {
    return "Operation";
  }

  return NODE_DISPLAY_TYPES[baseType] ?? null;
}

export function getAssetType(dataset) {
  const rawOperationalType = dataset?.operational_type;
  if (typeof rawOperationalType !== "string") return ASSET_TYPES.UNKNOWN;
  return OPERATIONAL_TYPE_MAP[rawOperationalType.trim().toLowerCase()] || ASSET_TYPES.UNKNOWN;
}

export function getBaseNodeType(type) {
  if (!type) return "";
  return String(type).trim().split(".").pop();
}
