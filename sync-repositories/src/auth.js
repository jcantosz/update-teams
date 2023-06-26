const { createAppAuth } = require("@octokit/auth-app");

/**
 * Creates an app auth object using the environment variables.
 */
function createAppAuthWithEnv() {
  return {
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.INPUTS_APP_ID,
      privateKey: process.env.INPUTS_PRIVATE_KEY,
      clientId: process.env.INPUTS_CLIENT_ID,
      clientSecret: process.env.INPUTS_CLIENT_SECRET,
      installationId: process.env.INPUTS_INSTALLATION_ID,
    },
    base_url: process.env.INPUTS_GITHUB_API_URL || "https://api.github.com",
  };
}

module.exports = {
  createAppAuthWithEnv,
};
