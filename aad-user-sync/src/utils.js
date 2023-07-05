const { ClientSecretCredential } = require("@azure/identity");
const { GraphRbacManagementClient } = require("@azure/graph");
const fs = require("fs");
const path = require("path");

async function getCredentials(tenantId, clientId, clientSecret) {
  // Create a new instance of the GraphRbacManagementClient using the Azure Identity library.
  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
  const client = new GraphRbacManagementClient(credential, tenantId);
  return client;
}

// Get the list of groups to sync.
async function getGroups(client) {
  const groupsFile = path.join(__dirname, "groups");
  if (fs.existsSync(groupsFile)) {
    // If a groups file exists, read the list of groups from it.
    return readGroupsFromFile(groupsFile);
  } else {
    // Otherwise, get the list of groups from Azure AD.
    return getGroupsFromAzureAD(client);
  }
}

// Read the list of groups from a file.
function readGroupsFromFile(groupsFile) {
  return fs
    .readFileSync(groupsFile, "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const [displayName, folderName] = line.split(" ");
      return { displayName, folderName };
    });
}

// Get the list of groups from Azure AD.
async function getGroupsFromAzureAD(client) {
  const groups = await client.groups.list();
  return groups.map((group) => ({ displayName: group.displayName }));
}

// Get the Azure AD group object for the specified group name.
async function getGroup(client, groupName) {
  return client.groups.get(groupName);
}

// Get the list of users in the specified group.
async function getUsers(client, groupId) {
  return client.users.list(groupId);
}

// Convert the list of users to a newline-separated string.
function getUsersList(users) {
  return users.map((user) => user.displayName.replace(/\s+/g, "-").toLowerCase()).join("\n");
}

// Get the directory path for the specified group.
function getGroupDirectory(group) {
  return path.join(__dirname, group.folderName || group.displayName);
}

// Create a directory if it doesn't already exist.
function createDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath);
  }
}

// Get the file path for the user list in the specified group directory.
function getUserListPath(groupDir) {
  return path.join(groupDir, "users");
}

// Write the user list to a file.
function writeUserListToFile(filePath, userList) {
  fs.writeFileSync(filePath, userList);
}

// Log the contents of the user list file (for dry runs).
function logDryRun(filePath, userList) {
  console.log(`Writing file ${filePath} with contents:\n${userList}`);
}

// Log an error message.
function logError(groupName, error) {
  console.error(`Error processing group ${groupName}: ${error.message}`);
}

module.exports = {
  getCredentials,
  getGroups,
  getGroup,
  getUsers,
  getUsersList,
  getGroupDirectory,
  createDirectory,
  getUserListPath,
  writeUserListToFile,
  logDryRun,
  logError,
};
