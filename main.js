const fs = require('fs');
const path = require('path');
const { Octokit } = require('@octokit/rest');
const { createAppAuthWithEnv } = require('./auth');
const { getDirectories, getRepositories, addRepositoriesToTeam, removeRepositoriesFromTeam } = require('./utils');

// Initialize the Octokit client with the app auth
const octokit = new Octokit({
  auth: createAppAuthWithEnv(),
});

// Define the organization name
const organizationName = 'my-org';

/**
 * Processes the repositories for the specified team.
 */
async function processTeam(teamName) {
  const repositoryList = getRepositories(teamName);

  await addRepositoriesToTeam(octokit, organizationName, teamName, repositoryList);
  await removeRepositoriesFromTeam(octokit, organizationName, teamName, repositoryList);
}

// Get a list of all directories in the current directory
const directories = getDirectories();

// Loop through each directory and process the repositories for the corresponding team
for (const teamName of directories) {
  try {
    await processTeam(teamName);
  } catch (error) {
    console.error(`Error processing team ${teamName}: ${error.message}`);
  }
}