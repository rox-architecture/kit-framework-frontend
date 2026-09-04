const NODE_METADATA = {
  zipper: {
    description: {
      name: "Zipper",
      operational_type: "Basic",
      description:
        "This node compresses all the files in a specified directory into a single ZIP file. \
        There is no data port for input and output, as the directory is specified in the parameter",
    },

    io_specification: {
      input: [],
      output: [],
    },

    requirements: {
      hardware: [],
      software: [],
      dataspace: [],
    },
  },

  save_to_file: {
    description: {
      name: "Save as a File",
      operational_type: "Basic",
      description:
        "This node receives data through a single input port and saves it as a local file. \
        The destination directory and file name can be configured through the node parameters.",
    },

    io_specification: {
      input: [
        {
          name: "Input_0",
          type: "Binary",
          description: "Data to save",
        },
      ],

      output: [],
    },

    requirements: {
      hardware: [],
      software: [],
      dataspace: [],
    },
  },

  unzipper: {
    description: {
      name: "Unzipper",
      operational_type: "Basic",
      contact_email: "",
      description:
        "This node extracts the contents of a compressed archive into a specified directory. \
         The archive file and destination directory can be configured through the node parameters.",
    },

    io_specification: {
      input: [],
      output: [],
    },

    requirements: {
      hardware: [],
      software: [],
      dataspace: [],
    },
  },

  bash_command: {
    description: {
      name: "Bash Command",
      operational_type: "Basic",
      contact_email: "",
      description:
        "This node executes a user-defined Bash command in the local environment. \
         The command to be executed can be configured through the node parameters.",
    },

    io_specification: {
      input: [],
      output: [],
    },

    requirements: {
      hardware: [],
      software: [],
      dataspace: [],
    },
  },

  container_deployment_kubernetes: {
    description: {
      name: "Deploy Using Kubernetes",
      operational_type: "Basic",
      contact_email: "",
      description:
        "This node deploys a containerized application to a Kubernetes cluster. \
         The deployment configuration, container image, namespace, and replica settings can be configured through the node parameters.",
    },

    io_specification: {
      input: [],
      output: [],
    },

    requirements: {
      hardware: [],
      software: [],
      dataspace: [],
    },
  },

};

export default NODE_METADATA;