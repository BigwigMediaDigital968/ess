
const { Provider } = require('oidc-provider');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const configuration = {
    // Client definitions
    clients: [
        {
            client_id: 'nextcloud_client_id',
            client_secret: 'nextcloud_client_secret',
            grant_types: ['authorization_code', 'refresh_token'],
            redirect_uris: ['http://localhost:8080/apps/user_oidc/code'],
            response_types: ['code'],
            scope: 'openid profile email groups',
        }
    ],

    // Adapter to persist data (using memory for simplicity in this PoC, but could use Redis/Prisma)
    // For production, a persistent adapter is required.
    // We'll use the default memory adapter for now to get it working quickly.

    // Claims configuration
    claims: {
        openid: ['sub'],
        profile: ['name', 'nickname'],
        email: ['email', 'email_verified'],
        groups: ['groups'],
    },

    // Feature flags
    features: {
        devInteractions: { enabled: false }, // We will implement our own
        introspection: { enabled: true },
        revocation: { enabled: true },
    },

    // Scopes
    scopes: ['openid', 'profile', 'email', 'groups'],

    // Find Account (User)
    async findAccount(ctx, id) {
        const user = await prisma.user.findUnique({
            where: { id },
            include: { role: true }
        });

        if (!user) return undefined;

        return {
            accountId: id,
            async claims(use, scope) {
                return {
                    sub: id,
                    email: user.email,
                    email_verified: true,
                    name: user.name,
                    nickname: user.name,
                    groups: [user.role.name || 'Employee'],
                };
            },
        };
    },
};

module.exports = configuration;
