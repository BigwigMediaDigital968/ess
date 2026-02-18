
const express = require('express');
const router = express.Router();
const { Provider } = require('oidc-provider');

module.exports = (provider) => {

    // Interaction route (when OIDC needs user login/consent)
    router.get('/interaction/:uid', async (req, res, next) => {
        try {
            const details = await provider.interactionDetails(req, res);
            const { uid, prompt, params } = details;

            const client = await provider.Client.find(params.client_id);

            if (prompt.name === 'login') {
                // If user is already authenticated in our app (via JWT/Session), we can skip login
                // But since this is a separate route, we might not have the app's context easily if using headers.
                // For this PoC, we will redirect to a special internal login page that posts back here,
                // OR we can implement a simple login form here.

                // Simpler approach: If we detect our app's auth token in cookies, use it.
                // Otherwise, show a login form.
                // Since we use localStorage for the React app, cookies might not be present.
                // We will serve a simple HTML login form for OIDC interactions.

                return res.send(`
          <html>
            <body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #000; color: #fff;">
              <div style="background: #111; padding: 40px; border-radius: 10px; border: 1px solid #333; text-align: center;">
                <h2 style="margin-bottom: 20px;">Sign in to BigwigESS</h2>
                <form autocomplete="off" action="/api/oidc/interaction/${uid}/login" method="post">
                  <input required type="email" name="email" placeholder="Email" style="display: block; width: 100%; margin: 10px 0; padding: 10px; background: #222; border: 1px solid #444; color: #fff; border-radius: 5px;">
                  <input required type="password" name="password" placeholder="Password" style="display: block; width: 100%; margin: 10px 0; padding: 10px; background: #222; border: 1px solid #444; color: #fff; border-radius: 5px;">
                  <button type="submit" style="width: 100%; padding: 10px; background: linear-gradient(to right, #6366f1, #a855f7); color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;">Sign In</button>
                </form>
              </div>
            </body>
          </html>
        `);
            }

            if (prompt.name === 'consent') {
                // Auto-consent for trusted internal apps
                const result = {
                    consent: {
                        // rejectedScopes: [], // invalid_scope
                        // rejectedClaims: [], // invalid_target
                    },
                };
                return await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
            }

            return next();
        } catch (err) {
            return next(err);
        }
    });

    // Handle Login Post
    router.post('/interaction/:uid/login', async (req, res, next) => {
        try {
            const { uid } = req.params;
            const { email, password } = req.body;

            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();

            const user = await prisma.user.findUnique({ where: { email } });

            // Simple password check (plaintext for PoC as per seeding, in real app use bcrypt)
            // Adjust based on your AuthContext/authRoutes implementation
            if (user && user.password === password) {
                const result = {
                    login: { accountId: user.id },
                };
                await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
            } else {
                res.status(401).send("Invalid credentials");
            }
        } catch (err) {
            next(err);
        }
    });

    return router;
};
