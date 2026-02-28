#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
#  deploy/azure/deploy-azure.sh — Deploy ESS-BSL on Azure
#  Requirements: Azure CLI (az), Docker
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

RESOURCE_GROUP="${RESOURCE_GROUP:?Set RESOURCE_GROUP}"
LOCATION="${LOCATION:-eastus}"
ACR_NAME="${ACR_NAME:?Set ACR_NAME (Azure Container Registry name)}"
APP_NAME="ess-bsl"

echo "☁️  ESS-BSL Azure Deploy — $(date)"

# ── 1. Ensure resource group exists ─────────────────────────────────────────
echo "🏗️  Creating resource group $RESOURCE_GROUP…"
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none

# ── 2. Ensure ACR exists ──────────────────────────────────────────────────────
az acr create --resource-group "$RESOURCE_GROUP" \
    --name "$ACR_NAME" --sku Basic --output none 2>/dev/null || true

# ── 3. Build & push images to ACR ────────────────────────────────────────────
echo "🔨 Building and pushing images…"
az acr login --name "$ACR_NAME"

docker build -t "$ACR_NAME.azurecr.io/ess-bsl-backend:latest" ./backend
docker build -t "$ACR_NAME.azurecr.io/ess-bsl-frontend:latest" ./frontend \
    --build-arg VITE_API_URL="$VITE_API_URL"

docker push "$ACR_NAME.azurecr.io/ess-bsl-backend:latest"
docker push "$ACR_NAME.azurecr.io/ess-bsl-frontend:latest"

# ── 4. Deploy to Azure Container Instances ───────────────────────────────────
echo "🚀 Deploying to ACI…"
ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --query "passwords[0].value" -o tsv)

# Backend
az container create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME-backend" \
    --image "$ACR_NAME.azurecr.io/ess-bsl-backend:latest" \
    --registry-login-server "$ACR_NAME.azurecr.io" \
    --registry-username "$ACR_NAME" \
    --registry-password "$ACR_PASSWORD" \
    --cpu 2 --memory 4 \
    --ports 3434 \
    --environment-variables \
        NODE_ENV=production PORT=3434 \
    --secure-environment-variables \
        DATABASE_URL="$DATABASE_URL" \
        JWT_SECRET="$JWT_SECRET" \
        REDIS_URL="$REDIS_URL" \
    --restart-policy Always \
    --output none

# Frontend
az container create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME-frontend" \
    --image "$ACR_NAME.azurecr.io/ess-bsl-frontend:latest" \
    --registry-login-server "$ACR_NAME.azurecr.io" \
    --registry-username "$ACR_NAME" \
    --registry-password "$ACR_PASSWORD" \
    --cpu 1 --memory 1 \
    --ports 80 443 \
    --dns-name-label "$APP_NAME-app" \
    --restart-policy Always \
    --output none

echo "✅ Deployed! Frontend: http://$APP_NAME-app.$LOCATION.azurecontainer.io"
