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

export function getAssetType(dataset) {
  const rawOperationalType = dataset?.operational_type;
  if (typeof rawOperationalType !== "string") return ASSET_TYPES.UNKNOWN;
  return OPERATIONAL_TYPE_MAP[rawOperationalType.trim().toLowerCase()] || ASSET_TYPES.UNKNOWN;
}

export function getBaseNodeType(type) {
  if (!type) return "";
  return String(type).trim().split(".").pop();
}
