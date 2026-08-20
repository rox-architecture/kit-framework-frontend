export const NODE_LIBRARY = {
  general: {
    key: "general",
    title: "General",

    sections: [
      {
        key: "basic",
        title: "Basic",
        nodes: [
          "save_to_file",
          "zipper",
          "unzipper",
          "bash_command",
        ],
      },
      {
        key: "deployment",
        title: "Deployment",
        nodes: [
          "container_deployment_kubernetes",
        ],
      },
    ],
  },
};

export const GENERAL_SECTIONS =
  NODE_LIBRARY.general.sections;

export function createGeneralSectionOpenState(
  defaultOpen = true
) {
  return Object.fromEntries(
    GENERAL_SECTIONS.map((section) => [
      section.key,
      defaultOpen,
    ])
  );
}
