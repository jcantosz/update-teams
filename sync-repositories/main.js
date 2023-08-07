const fs = require("fs");
const path = require("path");
const { Octokit } = require("@octokit/rest");
const { createAppAuthWithEnv } = require("./src/auth");
const {
  getDirectories,
  hasRepositoriesFile,
  getRepositoriesFromFile,
  getRepositoriesFromTeam,
  addRepositoriesToTeam,
  removeRepositoriesFromTeam,
} = require("./src/utils");
const { Console } = require("console");

// GitHub App Permissions
// Repository permissions
// Administration: Read-and-write
// Metadata: Read-only
// Organization permissions
// Members: Read-and-write
const octokit = new Octokit(createAppAuthWithEnv());
const organizationName = process.env.INPUT_ORGANIZATION_NAME;
const continueOnErrors = process.env.INPUT_CONTINUE_ON_ERRORS === "true";

/**
 * Processes the repositories for the specified team.
 */
async function processTeam(teamName) {
  // Get the repositories for the team defined in its repositories file
  const repositoryList = getRepositoriesFromFile(teamName);
  // Get the repositories already in the team on GitHub
  const teamRepositories = await getRepositoriesFromTeam(octokit, organizationName, teamName);
  // Add repos to the team that are defined in the file but not in the team.
  // Update repos where permissions have changed.
  // Skip repos where there are no changes to save on requests.
  await addRepositoriesToTeam(octokit, organizationName, teamName, teamRepositories, repositoryList);

  // Remove repos that are part of the team on GitHub but not defined in the file
  await removeRepositoriesFromTeam(octokit, organizationName, teamName, teamRepositories, repositoryList);
}

// Get a list of all directories in the current directory
async function main() {
  if (!organizationName) {
    throw new Error("ORGANIZATION_NAME environment variable not set");
  }
  // Define the organization name
  const directories = getDirectories();
  // Loop through each directory and process the repositories for the corresponding team
  for (const teamName of directories) {
    if (hasRepositoriesFile(teamName)) {
      try {
        console.log(`Processing team "${teamName}"`);
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
