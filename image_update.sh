#!/bin/bash
set -e

# Did you also update the version at config/version.js?
VERSION=1.2.2

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/rox-architecture/kit-frontend:latest \
  -t ghcr.io/rox-architecture/kit-frontend:$VERSION \
  --push \
  .

docker buildx imagetools inspect ghcr.io/rox-architecture/kit-frontend:latest