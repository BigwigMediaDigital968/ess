#!/bin/bash
# Run this script ONCE after Nextcloud has completed its initial setup
# (i.e., after you've visited http://localhost:8080 and finished the setup wizard)

echo "Configuring Nextcloud OIDC SSO..."

# Install user_oidc app
docker exec ess_nextcloud php occ app:install user_oidc

# Configure OIDC provider pointing to our backend
docker exec ess_nextcloud php occ user_oidc:provider ESS \
  --clientid='nextcloud_client_id' \
  --clientsecret='nextcloud_client_secret' \
  --discoveryuri='http://ess_portal:3434/oidc/.well-known/openid-configuration' \
  --unique-uid=0 \
  --mapping-uid='email' \
  --mapping-displayName='name'

# Disable Nextcloud's own login form (SSO only)
docker exec ess_nextcloud php occ config:app:set user_oidc allow_multiple_user_backends --value=0

# Set default 2GB quota for all new users
docker exec ess_nextcloud php occ config:app:set files default_quota --value='2 GB'

echo "Done! Nextcloud SSO is now configured."
echo "Users can log in at http://localhost:8080 using their ESS Portal credentials."
