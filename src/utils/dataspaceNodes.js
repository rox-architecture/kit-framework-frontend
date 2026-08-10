import { ASSET_TYPES } from "./nodeTypes";

export function buildDataspaceNodeConfig(selectedCatalogItem) {
  const dataset = selectedCatalogItem?.dataset || {};
  const dataspacePrefix =
    selectedCatalogItem?.category === "DLR dataspace"
      ? "dlr"
      : selectedCatalogItem?.category === "TSI dataspace"
        ? "tsi"
        : "";

  const commonParams = {
    provider_bpn:
      selectedCatalogItem?.providerId ||
      selectedCatalogItem?.participantId ||
      "",
    provider_url:
      selectedCatalogItem?.originator ||
      selectedCatalogItem?.endpointUrl ||
      "",
    asset_id: dataset.id || dataset["@id"] || "",
  };

  if (selectedCatalogItem?.assetType === ASSET_TYPES.STATIC_FILE) {
    return {
      templateKey: "static_file",
      label:
        dataset.name || dataset.title || dataset.filename || dataset.id || dataset["@id"] || "Static File",
      params: {
        ...commonParams,
        type: `${dataspacePrefix}.static_file`,
      },
    };
  }

  if (selectedCatalogItem?.assetType === ASSET_TYPES.CONTAINER) {
    return {
      templateKey: "container",
      label:
        dataset.name || dataset.title || dataset.filename || dataset.id || dataset["@id"] || "Container",
      params: {
        ...commonParams,
        type: `${dataspacePrefix}.container`,
        representation: dataset.representation || dataset.distribution_type || "dockerfile",
        platforms: Array.isArray(dataset.platforms)
          ? dataset.platforms
          : dataset.platforms
            ? [dataset.platforms]
            : [],
        image_name: dataset.image_name || "",
        image_tag: dataset.image_tag || "",
        registry_addr: dataset.registry_addr ?? dataset.registry ?? null,
      },
    };
  }

  return null;
}
