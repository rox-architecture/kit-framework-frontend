# Workflow Frontend

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

