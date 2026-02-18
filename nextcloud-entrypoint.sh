#!/bin/bash
# Nextcloud custom entrypoint: runs the official entrypoint, then auto-configures OIDC SSO

set -e

# Start Nextcloud in background first (using the official entrypoint)
/entrypoint.sh apache2-foreground &
NC_PID=$!

echo "[SSO-SETUP] Waiting for Nextcloud to finish installation..."

# Poll until Nextcloud is fully installed (occ works without "not installed" warning)
for i in $(seq 1 60); do
    sleep 10
    STATUS=$(php /var/www/html/occ status --no-ansi 2>&1 || true)
    if echo "$STATUS" | grep -q "installed: true"; then
        echo "[SSO-SETUP] Nextcloud is installed. Configuring OIDC SSO..."
        break
    fi
    echo "[SSO-SETUP] Attempt $i/60: Nextcloud not ready yet..."
done

# Install user_oidc app if not already installed
php /var/www/html/occ app:install user_oidc 2>&1 || \
php /var/www/html/occ app:enable user_oidc 2>&1 || true

# Configure OIDC provider pointing to ESS backend
php /var/www/html/occ user_oidc:provider ESS \
    --clientid='nextcloud_client_id' \
    --clientsecret='nextcloud_client_secret' \
    --discoveryuri='http://ess_portal:3434/oidc/.well-known/openid-configuration' \
    --unique-uid=0 \
    --mapping-uid='email' \
    --mapping-displayName='name' 2>&1 || true

# Set 2GB default quota for all new users
php /var/www/html/occ config:app:set files default_quota --value='2 GB' 2>&1 || true

# Allow only OIDC login (disable local Nextcloud login)
php /var/www/html/occ config:app:set user_oidc allow_multiple_user_backends --value=0 2>&1 || true

echo "[SSO-SETUP] Nextcloud OIDC SSO configured successfully!"

# Wait for the background Nextcloud process
wait $NC_PID
