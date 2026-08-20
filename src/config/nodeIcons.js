import staticFileIcon from "../assets/node-icons/static_file.svg";
import containerIcon from "../assets/node-icons/container.svg";
import zipperIcon from "../assets/node-icons/zipper.svg";
import unzipperIcon from "../assets/node-icons/unzipper.svg";
import saveToFileIcon from "../assets/node-icons/save_to_file.svg";
import containerDeploymentKubernetesIcon from "../assets/node-icons/deploy_kubernetes.svg";
import sendToURLIcon from "../assets/node-icons/send_to_url.svg";
import bashCmdIcon from "../assets/node-icons/bash_cmd.svg";

const NODE_ICONS = {
  static_file: staticFileIcon,
  container: containerIcon,
  zipper: zipperIcon,
  unzipper: unzipperIcon,
  save_to_file: saveToFileIcon,
  container_deployment_kubernetes: containerDeploymentKubernetesIcon,
  send_to_url: sendToURLIcon,
  bash_command: bashCmdIcon,
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
