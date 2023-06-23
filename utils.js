const fs = require('fs');
const path = require('path');

/**
 * Gets a list of all directories in the current directory.
 */
function getDirectories() {
  return fs.readdirSync('.', { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
}

/**
 * Gets the path to the repositories file for the specified team.
 */
function getRepositoriesFilePath(teamName) {
  return path.join(teamName, 'repositories');
}

/**
 * Reads the repositories file for the specified team and returns the list of repositories.
 */
function getRepositories(teamName) {
  const repositoriesFilePath = getRepositoriesFilePath(teamName);

  if (fs.existsSync(repositoriesFilePath)) {
    return fs.readFileSync(repositoriesFilePath, 'utf-8').split('\n');
  } else {
    return [];
  }
}

/**
 * Adds the specified repositories to the corresponding team with the specified permission level.
 */
async function addRepositoriesToTeam(octokit, organizationName, teamName, repositoryList) {
  for (const repository of repositoryList) {
    // Skip empty lines
    if (!repository) {
      continue;
    }

    // Extract the permission level and repository slug
    const [permission, slug] = repository.split(' ');

    // Add the repository to the corresponding team with the specified permission level
    await octokit.teams.addOrUpdateRepoInOrg({
      org: organizationName,
      team_slug: teamName,
      owner: slug.split('/')[0],
      repo: slug.split('/')[1],
      permission,
    });
  }
}

/**
 * Removes any repositories from the team that are not listed in the repositories file.
 */
async function removeRepositoriesFromTeam(octokit, organizationName, teamName, repositoryList) {
  // Get the list of repositories that the team has been added to
  const teamRepos = await octokit.teams.listReposInOrg({
    org: organizationName,
    team_slug: teamName,
  });

  // Loop through each repository that the team has been added to
  for (const repo of teamRepos.data) {
    // Check if the repository appears in the repositories file
    const repoSlug = `${repo.owner.login}/${repo.name}`;
    const repoExists = repositoryList.some((r) => r.endsWith(repoSlug));

    // If the repository does not appear in the repositories file, remove it from the team
    if (!repoExists) {
      await octokit.teams.removeRepoInOrg({
        org: organizationName,
        team_slug: teamName,
        owner: repo.owner.login,
        repo: repo.name,
      });
    }
  }
}

module.exports = {
  getDirectories,
  getRepositories,
  addRepositoriesToTeam,
  removeRepositoriesFromTeam,
};