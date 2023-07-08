const fs = require("fs");
const path = require("path");

const workdir = process.env.GITHUB_WORKSPACE || process.cwd();

function getTeamDirectories() {
  //get all directory names that contain the file repositories or users
  const directories = fs
    .readdirSync(workdir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .filter((dirent) => {
      return (
        fs.existsSync(path.join(workdir, dirent.name, "repositories")) ||
        fs.existsSync(path.join(workdir, dirent.name, "users"))
      );
    })
    .map((dirent) => dirent.name);
  return directories;
}
async function getTeams(octokit, organizationName) {
  const teams = await octokit.paginate(octokit.rest.teams.list, {
    org: organizationName,
  });
  return teams.map((team) => team.name);
}

function getTeamsNotExist(githubTeams, directoryTeams) {
  //get all teams that exist in the directory but not in github
  return directoryTeams.filter((directoryTeam) => {
    return !githubTeams.includes(directoryTeam);
  });
}

function createTeams(octokit, organizationName, teams) {
  teams.forEach((team) => {
    createTeam(octokit, organizationName, team);
  });
}

async function createTeam(octokit, organizationName, teamName) {
  // Create teams if not  a dry run, otherwise log the team name
  if (!process.env.INPUT_DRY_RUN) {
    console.log(`Creating team ${team}`);
    const team = await octokit.rest.teams.create({
      org: organizationName,
      name: teamName,
    });
  } else {
    console.log(`DRY RUN: Team "${teamName}" would be created, SKIPPED`);
  }
}

module.exports = {
  getTeamDirectories,
  getTeams,
  getTeamsNotExist,
  createTeams,
};
