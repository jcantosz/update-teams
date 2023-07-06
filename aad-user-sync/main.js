const {
  getCredentials,
  getGroups,
  getGroup,
  getUsers,
  getUsersList,
  getGroupDirectory,
  createDirectory,
  getUserListPath,
  writeUserListToFile,
  logDryRun,
  logError,
} = require("./src/utils");

//const { GraphRbacManagementClient } = require("@azure/graph");
const { GraphClient } = require("@microsoft/microsoft-graph-client");
const { AuthorizerFactory } = require("azure-actions-webclient");
const msal = require("@azure/msal-node");

// Load configuration from environment variables.
// const tenantId = process.env.INPUT_AZURE_TENANT_ID;
// const clientId = process.env.INPUT_AZURE_CLIENT_ID;
// const clientSecret = process.env.INPUT_AZURE_CLIENT_SECRET;

// Load additional configuration from environment variables.
const continueOnErrors = process.env.INPUT_CONTINUE_ON_ERRORS === "true";
const dryRun = process.env.INPUT_DRY_RUN === "true";

// Main function that syncs the list of users in each group to a local file.
async function main() {
  // const client = getCredentials(tenantId, clientId, clientSecret);
  //const client = await AuthorizerFactory.getAuthorizer();
  const authorizerFactory = new AuthorizerFactory();
  //authorizerFactory.getTenantId()?
  //process.env.AZURE_TENANT_ID
  const client = new GraphClient(authorizerFactory, process.env.AZURE_TENANT_ID);
  //const client = new GraphRbacManagementClient(authorizerFactory, process.env.AZURE_TENANT_ID);

  // Get the list of groups to sync.
  const groups = await getGroups(client);

  // Iterate over each group and sync its user list to a local file.
  for (const group of groups) {
    try {
      // Get the Azure AD group object.
      const groupObj = await getGroup(client, group.displayName);

      // Get the list of users in the group.
      const users = await getUsers(client, groupObj.objectId);

      // Convert the list of users to a newline-separated string.
      const userList = getUsersList(users);

      // Create a directory for the group if it doesn't already exist.
      const groupDir = getGroupDirectory(group);
      createDirectory(groupDir);

      // Write the user list to a file in the group directory.
      const userListPath = getUserListPath(groupDir);
      if (dryRun) {
        // If this is a dry run, log the contents of the file instead of writing it.
        logDryRun(userListPath, userList);
      } else {
        // Otherwise, write the file to disk.
        writeUserListToFile(userListPath, userList);
      }
    } catch (error) {
      // If an error occurs, log it and continue to the next group (if configured to do so).
      logError(group.displayName, error);
      if (!continueOnErrors) {
        break;
      }
    }
  }
}

// Call the main function and log any errors.
main().catch(console.error);
