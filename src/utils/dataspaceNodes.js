import { ASSET_TYPES } from "./nodeTypes";

function getLocalKey(key) {
  return String(key || "")
    .split(":")
    .pop();
}

function getNamespacedValue(object, localName) {
  if (!object || typeof object !== "object") {
    return undefined;
  }

  if (Object.prototype.hasOwnProperty.call(object, localName)) {
    return object[localName];
  }

  const entry = Object.entries(object).find(
    ([key]) => getLocalKey(key) === localName
  );

  return entry?.[1];
}

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
        dataset.name ||
        dataset.title ||
        dataset.filename ||
        dataset.id ||
        dataset["@id"] ||
        "Static File",
      params: {
        ...commonParams,
        type: `${dataspacePrefix}.static_file`,
      },
    };
  }

  if (selectedCatalogItem?.assetType === ASSET_TYPES.CONTAINER) {
    const representation = getNamespacedValue(dataset, "representation");
    const platforms = getNamespacedValue(dataset, "platforms");
    const imageName = getNamespacedValue(dataset, "image_name");
    const imageTag = getNamespacedValue(dataset, "image_tag");
    const registryAddr = getNamespacedValue(dataset, "registry_addr");

    return {
      templateKey: "container",
      label:
        dataset.name ||
        dataset.title ||
        dataset.filename ||
        dataset.id ||
        dataset["@id"] ||
        "Container",
      params: {
        ...commonParams,
        type: `${dataspacePrefix}.container`,
        representation: representation || "dockerfile",
        platforms: Array.isArray(platforms)
          ? platforms
          : platforms
            ? [platforms]
            : [],
        image_name: imageName || "",
        image_tag: imageTag || "",
        registry_addr: registryAddr ?? null,
      },
    };
  }

  return null;
}