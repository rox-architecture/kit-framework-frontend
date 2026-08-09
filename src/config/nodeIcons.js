import staticFileIcon from "../assets/node-icons/static_file.svg";
import containerIcon from "../assets/node-icons/container.svg";
import zipperIcon from "../assets/node-icons/zipper.svg";
import unzipperIcon from "../assets/node-icons/unzipper.svg";
import saveToFileIcon from "../assets/node-icons/save_to_file.svg";

const NODE_ICONS = {
  static_file: staticFileIcon,
  container: containerIcon,
  zipper: zipperIcon,
  unzipper: unzipperIcon,
  save_to_file: saveToFileIcon,
};

export function getNodeIcon(nodeType) {
  if (!nodeType) {
    return null;
  }

  const normalizedType = String(nodeType).trim().toLowerCase();
  const baseType = normalizedType.includes(".")
    ? normalizedType.split(".").pop()
    : normalizedType;

  return NODE_ICONS[baseType] || null;
}
