# Workflow Frontend

## Install 

Installation requires `npm` version > 10.

```
npm install
```

## Run (only for dev)

```
npm run dev
```

## Container Build

```
docker build -t kit-framework-frontend:local .
```

Then run,
```
docker run -d --name kit-framework-frontend -p 8088:80 kit-framework-frontend:local
```

## Funding

This open-source project was developed within the *[ROX](https://www.project-rox.ai/en/)* project. 
This project has received public funding from the **European Union** NextGenerationEU within the Important Project of Common European Interest – Cloud Infrastructures and Services (IPCEI-CIS) under grant agreement 13IPC034.

<p align="center">
  <img alt="Bundesministerium für Wirtschaft und Energie (BMWE)-EU and secunet funding logo" src="bmwe_logo.png" width="400"/>
</p>

