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
function getUsersFilePath(teamName) {
  return path.join(teamName, "users");
}

function hasUsersFile(teamName) {
  return fs.existsSync(getUsersFilePath(teamName));
}

/**
 * Reads the repositories file for the specified team and returns the list of repositories.
 */
function getUsersFromFile(teamName) {
  const usersFilePath = getUsersFilePath(teamName);
  return fs.readFileSync(usersFilePath, "utf-8").split("\n").filter(Boolean);
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
 * Reads the team's users and returns the list of users.
 */
async function getUsersFromTeam(octokit, organizationName, teamName) {
  const repos = await octokit.teams.listReposInOrg({
    org: organizationName,
    team_slug: teamName,
  });
  return repos.data.map(({ full_name, role_name }) => ({
    full_name,
    permission: normalizePermissions(role_name),
  }));
}

function userInList(user, userList) {
  return userList.contains(user);
}

function addUser(user, teamUsers, teamName) {
  if (userInList(user, teamUsers)) {
    if (userPermissionsChanged(user, teamUsers)) {
      console.log(`Updating ${user.full_name} with ${user.permission} permission in ${teamName}`);
    } else {
      return false;
    }
  } else {
    console.log(`Adding ${user.full_name} with ${user.permission} permission to ${teamName}`);
  }
  return true;
}

/**
 * Adds the specified users to the corresponding team with the specified permission level.
 */
async function addUsersToTeam(octokit, organizationName, teamName, teamUsers, userList) {
  for (const user of userList) {
    if (addUsers(user, teamUsers, teamName)) {
      // Add the user to the corresponding team with the specified permission level
      const [owner, repoName] = user.full_name.split("/");
      await octokit.teams.addOrUpdateRepoPermissionsInOrg({
        org: organizationName,
        team_slug: teamName,
        owner,
        repo: repoName,
        permission: user.permission,
      });
    }
  }
}

/**
 * Removes any users from the team that are not listed in the users file.
 */
async function removeUsersFromTeam(octokit, organizationName, teamName, teamRepos, userList) {
  // Loop through each user that the team has been added to
  for (const user of teamUsers) {
    // Check if the user appears in the repositories file
    //const repoSlug = repo.full_name;

    // If the user does not appear in the repositories file, remove it from the team
    if (!userInList(user, userList)) {
      console.log(`Removing ${user} from ${teamName}`);

      await octokit.teams.removeRepoInOrg({
        org: organizationName,
        team_slug: teamName,
        owner,
        repo: repoName,
      });
    }
  }
}

module.exports = {
  getDirectories,
  hasUsersFile,
  getUsersFromFile,
  getUsersFromTeam,
  addUsersToTeam,
  removeUsersFromTeam,
};
