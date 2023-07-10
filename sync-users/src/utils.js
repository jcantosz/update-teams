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
 * Gets the path to the users file for the specified team.
 */
function getUsersFilePath(teamName) {
  return path.join(teamName, "users");
}

function hasUsersFile(teamName) {
  return fs.existsSync(getUsersFilePath(teamName));
}

/**
 * Reads the users file for the specified team and returns the list of users.
 */
function getUsersFromFile(teamName) {
  const usersFilePath = getUsersFilePath(teamName);
  return fs.readFileSync(usersFilePath, "utf-8").split("\n").filter(Boolean);
}

/**
 * Reads the team's users and returns the list of users.
 */
async function getUsersFromTeam(octokit, organizationName, teamName) {
  console.log(`Getting users for ${teamName}`);
  const users = await octokit.paginate(
    octokit.rest.teams.listMembersInOrg,
    {
      org: organizationName,
      team_slug: teamName,
    },
    (response) => response.data.map((user) => user.login)
  );
  return users;
  //users.data.map((user) => user.login);
}

function userInList(username, userList) {
  return userList.includes(username);
}

function addUser(username, teamUsers, teamName) {
  if (userInList(username, teamUsers)) {
    return false;
  }
  return true;
}

/**
 * Adds the specified users to the corresponding team with the specified permission level.
 */
async function addUsersToTeam(octokit, organizationName, teamName, teamUsers, userList) {
  for (const username of userList) {
    if (addUser(username, teamUsers, teamName)) {
      if (!process.env.INPUT_DRY_RUN) {
        console.log(`Adding ${username} as a member of ${teamName}`);
        // Add the user to the corresponding team with the specified permission level
        try {
          await octokit.teams.addOrUpdateMembershipForUserInOrg({
            org: organizationName,
            team_slug: teamName,
            username: username,
          });
        } catch (error) {
          console.log(`Skipping adding "${username}" to "${teamName}". Encountered error. Does the user exist?`);
          if (process.env.ACTIONS_STEP_DEBUG == "true") {
            console.log(error);
          }
        }
      } else {
        console.log("Dry run: Skipping execution");
      }
    }
  }
}

/**
 * Removes any users from the team that are not listed in the users file.
 */
async function removeUsersFromTeam(octokit, organizationName, teamName, teamUsers, userList) {
  // Loop through each user that the team has been added to
  for (const username of teamUsers) {
    // Check if the user appears in the users file
    //const repoSlug = repo.full_name;

    // If the user does not appear in the users file, remove it from the team
    if (!userInList(username, userList)) {
      console.log(`Removing ${username} from ${teamName}`);
      if (!process.env.INPUT_DRY_RUN) {
        await octokit.teams.removeMembershipForUserInOrg({
          org: organizationName,
          team_slug: teamName,
          username: username,
        });
      } else {
        console.log("Dry run: Skipping execution");
      }
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
