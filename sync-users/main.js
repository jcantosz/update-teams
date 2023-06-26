const fs = require("fs");
const path = require("path");
const { Octokit } = require("@octokit/rest");
const { createAppAuthWithEnv } = require("./src/auth");
const {
  getDirectories,
  hasUsersFile,
  getUsersFromFile,
  getUsersFromTeam,
  addRepositoriesToTeam,
  removeRepositoriesFromTeam,
} = require("./src/utils");

const octokit = new Octokit(createAppAuthWithEnv());
const organizationName = process.env.INPUTS_ORGANIZATION_NAME;

/**
 * Processes the repositories for the specified team.
 */
async function processTeam(teamName) {
  // Get the repositories for the team defined in its repositories file
  const repositoryList = getUsersFromFile(teamName);

  // Get the repositories already in the team on GitHub
  const teamRepositories = await getUsersFromTeam(octokit, organizationName, teamName);

  // console.debug("teamRepositories", teamRepositories);
  // console.debug("repositoryList", repositoryList);
  //console.log(await octokit.teams.listReposInOrg({org: 'jcantosz-test-org', team_slug: 'test-team',}));

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
    if (hasUsersFile(teamName)) {
      try {
        processTeam(teamName);
      } catch (error) {
        console.error(`Error processing team ${teamName}: ${error.message}`);
      }
    }
  }
}
main();
