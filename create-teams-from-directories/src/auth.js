const { createAppAuth } = require("@octokit/auth-app");

/**
 * Creates an app auth object using the environment variables.
 */
function createAppAuthWithEnv() {
  return {
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.INPUT_APP_ID,
      privateKey: process.env.INPUT_PRIVATE_KEY,
      clientId: process.env.INPUT_CLIENT_ID,
      clientSecret: process.env.INPUT_CLIENT_SECRET,
      installationId: process.env.INPUT_INSTALLATION_ID,
    },
    base_url: process.env.INPUT_GITHUB_API_URL || "https://api.github.com",
  };
}

module.exports = {
  createAppAuthWithEnv,
};
