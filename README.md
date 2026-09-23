# Workflow Frontend

## Update Log

- Version 1.2.0
  - Node metadata is accessible from the graph by double-clicking the node
  - The requirements on the node is no longer modifiable. This means that the requirement will be shown as the dataspace asset metadata.
  - Top menu buttons for `/artifacts` location nagivation is added. Now, the result of the KIT execution can be inspected directly from the frontend.
  - Version 1.2.1
    - Bash command node parameter now has textarea for command. It was single line text before.
    - Fixed the bug of single requirement entry in the requirement metadata is being rendered incorrectly. Now, a single entry is also rendered correctly.
  - Version 1.2.2
    - `/artifacts/` Navigation modal now contains delete all button to delete all the files saved
    - Triggering an workflow now asks users to give the workflow name. By default, the current workflow name is shown. Triggering with the same name will simply overwrite the existing workflow, meaning that the workflow will be updated. Users can also write a different name, to create another workflow.
    - The current workflow name is displayed on the top left corner.
    - New workflow button is created. Clicking it will empty the screen and start a new workflow.
  - Version 1.2.3
    - When the graph is saved, the current workflow name still showing untitled is fixed.
    - The framework version number is added to the graph JSON data.
    - Typo in the requirement language operator 'requires' is fixed to 'required'.
    - Requirement specification language contradiction detection part is improved.
    - The word "workflow" is no longer used, and replaced by "graph" within GUI.

- Version 1.1.0
  - Node in the canvas now shows the node type on the top
    - FILE / CONTAINER / OPERATION / CONNECTION
  - Node metadata in the "Add Node" window are updated
    - Zipper
    - Unzipper
    - Bash Command
    - Deploy Using Kubernetes
  - Monitoring button added in the top of canvas
    - Shows the docker logs of backend-api, worker-1,2,3,4
  - Trigger button image is changed from text to a logo
  - Bash node parameter is changed
    - Command is not longer a list of strings. It is just a single String now
  - Current canvas is not lost when the browser is refreshed
    - Using the browser localStorage
    - Any change in the canvas results in the save of the graph as `kit-workflow-workspace`
    - Refreshing will always loads the temporarily saved graph
  - RoX TP5 metadata schema is integrated into the frontend to render the nodes and automatically load the node information correctly
    - Requirements descriptions are loaded correctly
    - KIT metadata are loaded correctly 
  - Version 1.1.1
    - Multi architecture container image is provided
      - linux/amd64
      - linux/arm64

## Run

```
docker pull ghcr.io/rox-architecture/kit-frontend:latest
docker run -d --name kit-frontend -p 8088:80 kit-frontend:latest
```

## Pre-built image registry 

https://github.com/orgs/rox-architecture/packages?repo_name=kit-framework-frontend

## For Development

### Local run

Installation requires `npm` version > 10.

```
npm install
```

```
npm run dev
```

## Container Build and Push

Change the version with the next version.
```shell
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/rox-architecture/kit-frontend:1.1.1 \
  -t ghcr.io/rox-architecture/kit-frontend:latest \
  --push \
  .
```

Then, check
```shell
docker buildx imagetools inspect \
  ghcr.io/rox-architecture/kit-frontend:latest
```

Then run,
```
docker run -d --name kit-framework-frontend -p 8088:80 kit-framework-frontend:latest
```

## Funding

This open-source project was developed within the *[ROX](https://www.project-rox.ai/en/)* project. 
This project has received public funding from the **European Union** NextGenerationEU within the Important Project of Common European Interest – Cloud Infrastructures and Services (IPCEI-CIS) under grant agreement 13IPC034.

<p align="center">
  <img alt="Bundesministerium für Wirtschaft und Energie (BMWE)-EU and secunet funding logo" src="bmwe_logo.png" width="400"/>
</p>

