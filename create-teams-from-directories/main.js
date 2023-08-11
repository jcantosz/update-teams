const { Octokit } = require("@octokit/rest");
const { createAppAuthWithEnv } = require("./src/auth");
const {
  getTeams,
  getTeamDirectories,
  getTeamsNotExist,
  createTeams,
} = require("./src/utils");

const octokit = new Octokit(createAppAuthWithEnv());
const organizationName = process.env.INPUT_ORGANIZATION_NAME;
const continueOnErrors = process.env.INPUT_CONTINUE_ON_ERRORS === "true";
const privateTeams = process.env.INPUT_PRIVATE_TEAMS === "true";

async function main() {
  const teamDirectories = getTeamDirectories();
  // Skip out early if there is nothing to do
  if (teamDirectories.length === 0) {
    console.log("No teams to create, exiting");
    return;
  }
  console.log(`Found team names from directories: "${teamDirectories}"`);

  const githubTeams = await getTeams(octokit, organizationName);
  console.log(`Found team names from GitHub: "${githubTeams}"`);

  // Find teams that exist as directories but not in GitHub
  const teamsNotExist = getTeamsNotExist(githubTeams, teamDirectories);

  // No need to iterate if there are no teams to create
  if (teamsNotExist.length === 0) {
    console.log("No teams to create, exiting");
    return;
  }
  console.log(`Teams to create: "${teamsNotExist}"`);

  createTeams(octokit, organizationName, teamsNotExist, privateTeams);
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error.name}: ${error.message}`);
  console.error(error);
  if (!continueOnErrors) {
    process.exit(1); // exit with error code
  }
}
