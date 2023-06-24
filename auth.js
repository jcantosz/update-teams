const { createAppAuth } = require("@octokit/auth-app");

/**
 * Creates an app auth object using the environment variables.
 */
function createAppAuthWithEnv() {
  return {
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.APP_ID,
      privateKey: process.env.PRIVATE_KEY,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      installationId: process.env.INSTALLATION_ID,
    },
  };
}

module.exports = {
  createAppAuthWithEnv,
};
