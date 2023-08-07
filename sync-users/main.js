const fs = require("fs");
const path = require("path");
const { Octokit } = require("@octokit/rest");
const { createAppAuthWithEnv } = require("./src/auth");
const { getDirectories, hasUsersFile, getUsersFromFile, getUsersFromTeam, addUsersToTeam, removeUsersFromTeam } = require("./src/utils");

const octokit = new Octokit(createAppAuthWithEnv());
const organizationName = process.env.INPUT_ORGANIZATION_NAME;

/**
 * Processes the users for the specified team.
 */
async function processTeam(teamName) {
  // Get the users for the team defined in its users file
  const usersList = getUsersFromFile(teamName);

  // Get the users already in the team on GitHub
  const teamUsers = await getUsersFromTeam(octokit, organizationName, teamName);
  console.log(teamUsers);

  // Add users to the team that are defined in the file but not in the team.
  // Update users where permissions have changed.
  // Skip users where there are no changes to save on requests.
  await addUsersToTeam(octokit, organizationName, teamName, teamUsers, usersList);

  // Remove users that are part of the team on GitHub but not defined in the file
  await removeUsersFromTeam(octokit, organizationName, teamName, teamUsers, usersList);
}

// Get a list of all directories in the current directory
async function main() {
  if (!organizationName) {
    throw new Error("ORGANIZATION_NAME environment variable not set");
  }
  if (process.env.INPUT_DRY_RUN) {
    console.log("Dry run enabled");
  }
  // Define the organization name
  const directories = getDirectories();
  // Loop through each directory and process the users for the corresponding team
  for (const teamName of directories) {
    if (hasUsersFile(teamName)) {
      try {
        processTeam(teamName);
      } catch (error) {
        console.error(`Error processing team ${teamName}: ${error.message}`);
        if (!continueOnErrors) {
          process.exit(1); // exit with error code
        }
      }
    }
  }
}

main();
