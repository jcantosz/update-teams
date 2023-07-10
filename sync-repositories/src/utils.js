const fs = require("fs");
const path = require("path");

/**
 * Gets a list of all directories in the current directory.
 */
function getDirectories() {
  return fs
    .readdirSync(".", { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
}

/**
 * Gets the path to the repositories file for the specified team.
 */
function getRepositoriesFilePath(teamName) {
  return path.join(teamName, "repositories");
}

function hasRepositoriesFile(teamName) {
  return fs.existsSync(getRepositoriesFilePath(teamName));
}

/**
 * Reads the repositories file for the specified team and returns the list of repositories.
 */
function getRepositoriesFromFile(teamName) {
  const repositoriesFilePath = getRepositoriesFilePath(teamName);
  return fs
    .readFileSync(repositoriesFilePath, "utf-8")
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [permission, full_name] = line.split(" ");
      if (!permission || !full_name) {
        throw new Error(`Invalid repository: ${repository}`);
      }
      return { full_name: full_name, permission: normalizePermissions(permission) };
    });
}
/**
 * Takes the permission level and returns the corresponding permission level for the API.
 * @param {*} permission
 * @returns
 */
function normalizePermissions(permission) {
  permission = permission.toLowerCase();
  if (permission == "read") {
    return "pull";
  }
  if (permission == "write") {
    return "push";
  }
  return permission;
}

/**
 * Reads the team's repositories and returns the list of repositories.
 */
async function getRepositoriesFromTeam(octokit, organizationName, teamName) {
  const repos = await octokit.paginate(
    octokit.teams.listReposInOrg,
    {
      org: organizationName,
      team_slug: teamName,
    },
    (response) => response.data.map((repo) => ({ full_name: repo.full_name, permission: normalizePermissions(repo.role_name) }))
  );
  return repos;
}

function repositoryInList(repository, repositoryList) {
  return repositoryList.some((r) => r.full_name === repository.full_name);
}

function repositoryPermissionsChanged(repository, repositoryList) {
  const matchingRepository = repositoryList.find((r) => r.full_name === repository.full_name);
  return matchingRepository.permission !== repository.permission;
}

function addOrUpdateRepository(repository, teamRepos, teamName) {
  if (repositoryInList(repository, teamRepos)) {
    if (repositoryPermissionsChanged(repository, teamRepos)) {
      console.log(`Updating "${repository.full_name}" with "${repository.permission}" permission in "${teamName}"`);
    } else {
      return false;
    }
  } else {
    console.log(`Adding "${repository.full_name}" with "${repository.permission}" permission to "${teamName}"`);
  }
  return true;
}

/**
 * Adds the specified repositories to the corresponding team with the specified permission level.
 */
async function addRepositoriesToTeam(octokit, organizationName, teamName, teamRepos, repositoryList) {
  for (const repository of repositoryList) {
    if (addOrUpdateRepository(repository, teamRepos, teamName)) {
      // Add the repository to the corresponding team with the specified permission level
      const [owner, repoName] = repository.full_name.split("/");
      if (!process.env.INPUT_DRY_RUN) {
        await octokit.teams.addOrUpdateRepoPermissionsInOrg({
          org: organizationName,
          team_slug: teamName,
          owner,
          repo: repoName,
          permission: repository.permission,
        });
      } else {
        console.log("Dry run: Skipping execution");
      }
    } else {
      console.log(`Skipping "${repository.full_name}" for "${teamName}", no changes detected`);
    }
  }
}

/**
 * Removes any repositories from the team that are not listed in the repositories file.
 */
async function removeRepositoriesFromTeam(octokit, organizationName, teamName, teamRepos, repositoryList) {
  // Loop through each repository that the team has been added to
  for (const repo of teamRepos) {
    // Check if the repository appears in the repositories file
    //const repoSlug = repo.full_name;

    // If the repository does not appear in the repositories file, remove it from the team
    if (!repositoryInList(repo, repositoryList)) {
      console.log(`Removing ${repo.full_name} from ${teamName}`);
      const [owner, repoName] = repo.full_name.split("/");
      if (!process.env.INPUT_DRY_RUN) {
        await octokit.teams.removeRepoInOrg({
          org: organizationName,
          team_slug: teamName,
          owner,
          repo: repoName,
        });
      } else {
        console.log("Dry run: Skipping execution");
      }
    }
  }
}

module.exports = {
  getDirectories,
  hasRepositoriesFile,
  getRepositoriesFromFile,
  getRepositoriesFromTeam,
  addRepositoriesToTeam,
  removeRepositoriesFromTeam,
};
