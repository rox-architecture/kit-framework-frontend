// src/utils/graphMigration.js
// v4: legacy dataspace fields -> namespaced type

const NODE_TYPE_RENAMES = {
  ds_static_file: "static_file",
  ds_container: "container",
};

const DATASPACE_NODE_TYPES = new Set([
  "static_file",
  "container",
  "file_service",
  "streaming_service",
  "workflow",
]);

const normalizeDataspaceName = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  const normalized = String(value)
    .trim()
    .toLowerCase();

  // Legacy values such as "dlr_connector" / "tsi_connector"
  return normalized.endsWith("_connector")
    ? normalized.slice(0, -"_connector".length)
    : normalized;
};

export const getBaseNodeType = (type) => {
  if (!type) return "";

  return String(type)
    .trim()
    .split(".")
    .pop();
};

function migrateParams(params = {}) {
  const migrated = { ...params };

  // Legacy node names:
  // ds_static_file -> static_file
  // ds_container   -> container
  if (
    migrated.type &&
    Object.prototype.hasOwnProperty.call(
      NODE_TYPE_RENAMES,
      migrated.type
    )
  ) {
    migrated.type = NODE_TYPE_RENAMES[migrated.type];
  }

  const currentType = String(
    migrated.type || ""
  ).trim();

  const baseType = getBaseNodeType(currentType);

  // Import migration only:
  //
  // {
  //   type: "static_file",
  //   which_dataspace: "dlr"
  // }
  //
  // or
  //
  // {
  //   type: "static_file",
  //   adapter_type: "dlr"
  // }
  //
  // becomes:
  //
  // {
  //   type: "dlr.static_file"
  // }
  //
  // Already namespaced values such as "dlr.static_file"
  // remain unchanged.
  const alreadyNamespaced = currentType.includes(".");

  const dataspace = normalizeDataspaceName(
    migrated.which_dataspace ||
      migrated.adapter_type
  );

  if (
    !alreadyNamespaced &&
    dataspace &&
    DATASPACE_NODE_TYPES.has(baseType)
  ) {
    migrated.type = `${dataspace}.${baseType}`;
  }

  // These legacy parameters no longer exist in the current schema.
  delete migrated.which_dataspace;
  delete migrated.adapter_type;

  return migrated;
}

function migrateNode(node) {
  const params = migrateParams(
    node.data?.params
  );

  // Template lookup is always based only on the part
  // after the namespace:
  //
  // dlr.static_file -> static_file
  // tsi.container   -> container
  const templateKey = getBaseNodeType(
    params.type ||
      node.data?.templateKey
  );

  return {
    ...node,
    measured: undefined,
    data: {
      ...node.data,
      templateKey,
      params,
    },
  };
}

export function migrateGraph(graph) {
  return {
    ...graph,

    nodes: Array.isArray(graph?.nodes)
      ? graph.nodes.map(migrateNode)
      : [],

    edges: Array.isArray(graph?.edges)
      ? graph.edges
      : [],
  };
}
