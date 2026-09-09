#!/bin/bash
set -e

VERSION=1.2.1

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/rox-architecture/kit-frontend:latest \
  -t ghcr.io/rox-architecture/kit-frontend:$VERSION \
  --push \
  .

docker buildx imagetools inspect ghcr.io/rox-architecture/kit-frontend:latest