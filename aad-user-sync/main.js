const {
  getClient,
  getGroups,
  getGroupMembers,
  getMembersList,
  getGroupDirectory,
  createDirectory,
  getUserListPath,
  writeUserListToFile,
  logDryRun,
  logError,
} = require("./src/utils");

// Load additional configuration from environment variables.
const continueOnErrors = process.env.INPUT_CONTINUE_ON_ERRORS === "true";
const dryRun = process.env.INPUT_DRY_RUN === "true";

// Main function that syncs the list of users in each group to a local file.
async function main() {
  if (dryRun) {
    console.log("Dry run enabled. No changes will be made.");
  }
  const client = await getClient();

  // Get the list of groups to sync.
  const groups = await getGroups(client);

  // Iterate over each group and sync its user list to a local file.
  for (const group of groups) {
    try {
      console.log(`---\nProcessing group "${group.displayName} (id: "${group.id}")"...`);

      // Get the list of users in the group.
      console.log(`\tGetting members for group "${group.displayName}"...`);
      const users = await getGroupMembers(client, group.id);
      // Convert the list of users to a newline-separated string.
      console.log(`\tConverting members array to string for group "${group.displayName}"...`);
      const userList = getMembersList(users);

      // Create a directory for the group if it doesn't already exist.
      const groupDir = getGroupDirectory(group);
      if (dryRun) {
        // If this is a dry run, log the directory path instead of creating it.
        logDryRun(`Creating directory "${groupDir}"...`);
      } else {
        createDirectory(groupDir);
      }

      if (dryRun) {
        // If this is a dry run, log the contents of the file instead of writing it.
        logDryRun(`Writing file "${groupDir}/users"\ncontents: \n${userList}\n`);
      } else {
        // Write the user list to a file in the group directory.
        const userListPath = getUserListPath(groupDir);
        // Otherwise, write the file to disk.
        console.log(`\tWriting file ${userListPath}...`);
        writeUserListToFile(userListPath, userList);
      }
    } catch (error) {
      // If an error occurs, log it and continue to the next group (if configured to do so).
      logError(group.displayName, error);
      if (!continueOnErrors) {
        process.exit(1); // exit with error code
      }
    }
  }
}

// Call the main function and log any errors.
main();
