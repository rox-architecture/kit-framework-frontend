# Workflow Frontend

## Update Log

- Version 1.1
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

## Container Build

```
docker build -t kit-framework-frontend:latest .
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

