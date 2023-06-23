const { createAppAuth } = require('@octokit/auth-app');

/**
 * Creates an app auth object using the environment variables.
 */
function createAppAuthWithEnv() {
  return createAppAuth({
    appId: process.env.APP_ID,
    privateKey: process.env.PRIVATE_KEY,
    installationId: process.env.INSTALLATION_ID,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    token: process.env.TOKEN,
  });
}

module.exports = {
  createAppAuthWithEnv,
};