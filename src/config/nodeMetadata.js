const NODE_METADATA = {
  zipper: {
    description: {
      name: "Zipper",
      description:
        "Compresses a target directory into a ZIP archive.",
    },

    io_specification: {
      input: [
        {
          name: "Input 1",
          type: "dependency",
          description: "Execution dependency.",
        },
      ],
      output: [
        {
          name: "Output 1",
          type: "file",
          description: "Generated ZIP archive.",
        },
      ],
    },

    requirements: {
      hardware: [],
      software: [
        {
          key: "zip",
          operator: "exists",
          value: true,
        },
      ],
      dataspace: [],
    },
  },

  save_to_file: {
    description: {
      name: "Save as a File",
      operational_type: "Utility",
      contact_email: "",
      description:
        "Writes incoming data to a local file.",
    },

    io_specification: {
      input: [
        {
          name: "Input 1",
          type: "binary",
          description: "Data to write.",
        },
      ],

      output: [
        {
          name: "Output 1",
          type: "file",
          description: "Saved file.",
        },
      ],
    },

    requirements: {
      hardware: [],
      software: [],
      dataspace: [],
    },
  },

  static_file: {
  io_specification: {
      input: [
        {
          name: "Input 1",
          type: "dependency",
          description: "Execution dependency.",
        },
      ],

      output: [
        {
          name: "Output 1",
          type: "binary",
          description: "Transferred file data.",
        },
        {
          name: "Output 2",
          type: "metadata",
          description: "Asset transfer metadata.",
        },
      ],
    },
  },



};

export default NODE_METADATA;