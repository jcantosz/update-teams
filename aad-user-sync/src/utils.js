// const { ClientSecretCredential } = require("@azure/identity");
// const { GraphRbacManagementClient } = require("@azure/graph");
require("isomorphic-fetch"); // or import the fetch polyfill you installed
const { Client } = require("@microsoft/microsoft-graph-client");
const { TokenCredentialAuthenticationProvider } = require("@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials");
const { DefaultAzureCredential } = require("@azure/identity");
const fs = require("fs");
const path = require("path");

const workdir = process.env.GITHUB_WORKSPACE || process.cwd();

async function getClient() {
  // Create a new instance of the GraphRbacManagementClient using the Azure Identity library.
  // const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
  // const client = new GraphRbacManagementClient(credential, tenantId);
  // return client;

  const credential = new DefaultAzureCredential();
  // Create an instance of the TokenCredentialAuthenticationProvider by passing the tokenCredential instance and options to the constructor
  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ["https://graph.microsoft.com/.default"],
    // scopes: ["Group.Read.All"],
    //scopes: ["User.Read.All", "Groups.Read.All", "GroupsMember.Read.All"],
  });
  return Client.initWithMiddleware({ authProvider: authProvider });
}

// Get the list of groups to sync.
async function getGroups(client) {
  const groupsFile = path.join(workdir, "groups");
  console.log(`Looking for groups file at "${groupsFile}"`);
  if (fs.existsSync(groupsFile)) {
    console.log(`Reading groups from "${groupsFile}"`);
    // If a groups file exists, read the list of groups from it.
    const fileGroups = readGroupsFromFile(groupsFile);
    return addGroupIdsToFileGroup(client, fileGroups);
  } else {
    // Otherwise, get the list of groups from Azure AD.
    console.debug("Reading ALL groups from Azure AD");
    return getGroupsFromAzureAD(client);
  }
}

// Get group ID for each group from file
async function addGroupIdsToFileGroup(client, groups) {
  let returnGroups = [];
  for (let group of groups) {
    const groupObject = await getGroup(client, group.displayName);
    if (groupObject) {
      group["id"] = groupObject["id"];
      returnGroups.push(group);
    } else {
      throw new Error(`Group "${group.displayName}" not found in Azure AD`);
    }
  }
  return returnGroups;
}

function normalizeFolderName(folderName) {
  //replace all non-alphanumeric characters with hyphens, convert to lowercase
  return folderName.replace(/\W+/g, "-").toLowerCase();
}

// Read the list of groups from a file.
function readGroupsFromFile(groupsFile) {
  return fs
    .readFileSync(groupsFile, "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const [displayName, folderName] = line.split(":");
      let normalizedFolderName = folderName ? folderName : displayName;
      normalizedFolderName = normalizeFolderName(normalizedFolderName);
      return { displayName, folderName: normalizedFolderName };
    });
}

// Get the list of groups from Azure AD.
async function getGroupsFromAzureAD(client) {
  const groups = await client.api("/groups/").select("id,displayName").get();
  //add property folderName to each group
  groups.value.map((group) => {
    //replace all non-alphanumeric characters with hyphens, convert to lowercase
    group.folderName = normalizeFolderName(group.displayName);
  });
  return groups.value;
}

// Get the Azure AD group object for the specified group name.
async function getGroup(client, groupName) {
  console.log(`Checking group "${groupName}" against Azure`);
  const group = await client.api(`/groups/`).header("ConsistencyLevel", "eventual").search(`"displayName:${groupName}"`).select("id").get();
  if (group.value.length > 1) {
    throw new Error(`Multiple groups found with name ${groupName}`);
  }
  return group.value[0];
}

// Get the list of users in the specified group.
async function getGroupMembers(client, groupId) {
  // Get the list of users in the group. (do not get microsoft.graph.group objects)
  //const groupMembers = await client.api(`/groups/${groupId}/members/microsoft.graph.user`).select("userPrincipalName").get();
  // Get the list of users in the group and all nested groups. (do not get microsoft.graph.group objects)
  const groupMembers = await client.api(`/groups/${groupId}/transitiveMembers/microsoft.graph.user`).select("userPrincipalName").get();
  // if we got groups as well, we could check with
  // groupMembers.value.map((user) => {
  //  //prettier-ignore (if it keeps converting single quotes to double quotes)
  //    if (user['@odata.type'] === '#microsoft.graph.user'){
  //    ...
  //    }
  // }

  // convert each userPrincipalName to GitHub username
  groupMembers.value.map((user) => {
    //Remove email address domain, replace all non-alphanumeric characters with hyphens, convert to lowercase
    user.userPrincipalName = user.userPrincipalName
      .split("@")[0]
      .replace(/[^a-zA-Z0-9]/g, "-")
      .toLowerCase();
  });

  return groupMembers.value;
}

// Convert the list of users to a newline-separated string.
function getMembersList(members) {
  return members.map((user) => user.userPrincipalName).join("\n");
  //return users.map((user) => user.displayName.replace(/\s+/g, "-").toLowerCase()).join("\n");
}

// Get the directory path for the specified group.
function getGroupDirectory(group) {
  return path.join(workdir, group.folderName);
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
function logDryRun(message) {
  console.log(`DRY RUN: ${message} SKIPPED`);
}

// Log an error message.
function logError(groupName, error) {
  console.error(`Error processing group ${groupName}: ${error.message}`);
}

module.exports = {
  getClient,
  getGroups,
  getGroup,
  getGroupMembers,
  getMembersList,
  getGroupDirectory,
  createDirectory,
  getUserListPath,
  writeUserListToFile,
  logDryRun,
  logError,
};
