const NODE_TEMPLATES = {

  save_to_file: {
    label: "Save as a File",
    inputCount: 2,
    outputCount: 1,
    params: {
      type: "save_to_file",
      file_path: "",
    },
    paramOrder: [
      "type",
      "file_path",
    ],
    paramTypes: {
      type: "string",
      file_path: "string",
    },
    paramValidators: {
      file_path: "path",
    },
    lockedParams: ["type"],
  },

  container_deployment_kubernetes: {
    label: "container_deployment_kubernetes",
    inputCount: 1,
    outputCount: 1,
    params: {
      type: "container_deployment_kubernetes",
      deployment_name: "",
      replicas: 1,
      namespace: "",
      image_name: "",
      image_tag: "",
      registry: null,
      image_pull_policy: "IfNotPresent",
    },
    paramOrder: [
      "type",
      "deployment_name",
      "replicas",
      "namespace",
      "image_name",
      "image_tag",
      "registry",
      "image_pull_policy",
    ],
    paramTypes: {
      type: "string",
      deployment_name: "string",
      replicas: "int",
      namespace: "string",
      image_name: "string",
      image_tag: "string",
      registry: "string",
      image_pull_policy: "string",
    },
    paramOptions: {
      image_pull_policy: ["Always", "IfNotPresent", "Never"],
    },
    nullableParams: ["registry"],
    lockedParams: ["type"],
  },

  zipper: {
    label: "zipper",
    inputCount: 1,
    outputCount: 1,
    params: {
      type: "zipper",
      target_directory: "",
      output_path: "",
    },
    paramOrder: [
      "type",
      "target_directory",
      "output_path",
    ],
    paramTypes: {
      type: "string",
      target_directory: "string",
      output_path: "string",
    },
    paramValidators: {
      target_directory: "path",
      output_path: "path",
    },
    lockedParams: ["type"],
  },

  static_file: {
    label: "Static File",
    inputCount: 1,
    outputCount: 2,
    params: {
      type: "static_file",
      provider_bpn: "",
      provider_url: "",
      asset_id: "",
    },
    paramOrder: [
      "type",
      "provider_bpn",
      "provider_url",
      "asset_id",
    ],
    paramTypes: {
      type: "string",
      provider_bpn: "string",
      provider_url: "string",
      asset_id: "string",
    },
    paramValidators: {
      provider_url: "url",
    },
    lockedParams: ["type"],
  },

  container: {
    label: "container_image",
    inputCount: 1,
    outputCount: 1,
    params: {
      type: "container",
      provider_bpn: "",
      provider_url: "",
      asset_id: "",

      representation: "dockerfile",
      platforms: [],

      image_name: "",
      image_tag: "",
      registry_addr: null,
    },
    paramOrder: [
      "type",
      "provider_bpn",
      "provider_url",
      "asset_id",
      "representation",
      "platforms",
      "image_name",
      "image_tag",
      "registry_addr",
    ],
    paramTypes: {
      type: "string",
      provider_bpn: "string",
      provider_url: "string",
      asset_id: "string",

      representation: "string",
      platforms: "array",

      image_name: "string",
      image_tag: "string",
      registry_addr: "string",
    },
    paramOptions: {
      representation: [
        "dockerfile",
        "archive",
      ],
      platforms: [
        "linux/amd64",
        "linux/arm64",
        "windows/amd64",
        "windows/arm64",
      ],
    },
    paramValidators: {
      provider_url: "url",
    },
    nullableParams: ["registry_addr"],
    lockedParams: ["type"],
  },

  unzipper: {
    label: "unzipper",
    inputCount: 1,
    outputCount: 1,
    params: {
      type: "unzipper",
      target_zip: "",
      extract_directory: "",
    },
    paramOrder: [
      "type",
      "target_zip",
      "extract_directory",
    ],
    paramTypes: {
      type: "string",
      target_zip: "string",
      extract_directory: "string",
    },
    paramValidators: {
      target_zip: "path",
      extract_directory: "path",
    },
    lockedParams: ["type"],
  },

  send_to_url: {
    label: "send_to_url",
    inputCount: 2,
    outputCount: 2,
    params: {
      type: "send_to_url",
      url: "",
      method: "POST",
      timeout: 30.0,
    },
    paramOrder: [
      "type",
      "url",
      "method",
      "timeout",
    ],
    paramTypes: {
      type: "string",
      url: "string",
      method: "string",
      timeout: "number",
    },
    paramOptions: {
      method: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
      ],
    },
    paramValidators: {
      url: "url",
    },
    lockedParams: ["type"],
  },

  bash_command: {
    label: "Bash Command",
    inputCount: 1,
    outputCount: 1,
    params: {
      type: "bash_command",
      command: [],
      working_directory: null,
      timeout: 30.0,
    },
    paramOrder: [
      "type",
      "command",
      "working_directory",
      "timeout",
    ],
    paramTypes: {
      type: "string",
      command: "array",
      working_directory: "string",
      timeout: "number",
    },
    paramHelp: {
      command:
        "List of arguments. E.g., [ 'python', 'main.py' ] .",

      working_directory:
        "Directory in which the command will be executed.",
    },
    
    paramValidators: {
      working_directory: "path",
    },
    nullableParams: [
      "working_directory",
    ],
    lockedParams: ["type"],
  },
};

export default NODE_TEMPLATES;
