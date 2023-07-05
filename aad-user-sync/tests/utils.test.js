const {
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
} = require("../src/utils");

const fs = require("fs");
const path = require("path");

jest.mock("@azure/identity");
jest.mock("@azure/graph");
jest.mock("fs");

function pathJoinDir(dir) {
  return path.join(__dirname, dir).replace("/tests/", "/src/");
}

describe("getGroups", () => {
  it("should return the list of groups from a file if it exists", async () => {
    // Mock the fs.existsSync and fs.readFileSync functions.
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue("Group1\nGroup2\n");

    // Call the getGroups function with a mock client.
    const mockClient = {};
    const groups = await getGroups(mockClient);

    // Verify that the list of groups was read from the file.
    expect(groups).toEqual([{ displayName: "Group1" }, { displayName: "Group2" }]);

    // Verify that the fs.existsSync and fs.readFileSync functions were called with the expected arguments.
    expect(fs.existsSync).toHaveBeenCalledWith(pathJoinDir("groups"));
    expect(fs.readFileSync).toHaveBeenCalledWith(pathJoinDir("groups"), "utf8");
  });

  it("should return the list of groups from Azure AD if the file does not exist", async () => {
    // Mock the fs.existsSync function.
    fs.existsSync.mockReturnValue(false);

    // Mock the GraphRbacManagementClient class and its methods.
    const mockClient = {
      groups: {
        list: jest.fn().mockReturnValue([{ displayName: "Group1" }, { displayName: "Group2" }]),
      },
    };

    // Call the getGroups function with the mock client.
    const groups = await getGroups(mockClient);

    // Verify that the list of groups was returned from Azure AD.
    expect(mockClient.groups.list).toHaveBeenCalled();
    expect(groups).toEqual([{ displayName: "Group1" }, { displayName: "Group2" }]);
  });
});

describe("getGroup", () => {
  it("should return the Azure AD group object for the specified group name", async () => {
    // Mock the GraphRbacManagementClient class and its methods.
    const mockClient = {
      groups: {
        get: jest.fn().mockReturnValue({ displayName: "Group1" }),
      },
    };
    const mockGraphRbacManagementClient = jest.fn().mockReturnValue(mockClient);

    // Call the getGroup function with the mock client and group name.
    const group = await getGroup(mockClient, "Group1");

    // Verify that the Azure AD group object was returned.
    expect(mockClient.groups.get).toHaveBeenCalledWith("Group1");
    expect(group).toEqual({ displayName: "Group1" });
  });
});

describe("getUsers", () => {
  it("should return the list of users in the specified group", async () => {
    // Mock the GraphRbacManagementClient class and its methods.
    const mockClient = {
      users: {
        list: jest.fn().mockReturnValue([{ displayName: "User 1" }, { displayName: "User 2" }]),
      },
    };

    // Call the getUsers function with the mock client and group ID.
    const users = await getUsers(mockClient, "group-id");

    // Verify that the list of users was returned.
    expect(users).toEqual([{ displayName: "User 1" }, { displayName: "User 2" }]);

    // Verify that that called with the expected arguments.
    expect(mockClient.users.list).toHaveBeenCalledWith("group-id");
  });
});

describe("getUsersList", () => {
  it("should convert the list of users to a newline-separated string", () => {
    // Call the getUsersList function with a list of users.
    const users = [{ displayName: "User 1" }, { displayName: "User 2" }];
    const userList = getUsersList(users);

    // Verify that the list of users was converted to a newline-separated string.
    expect(userList).toBe("user-1\nuser-2");
  });
});

describe("getGroupDirectory", () => {
  it("should return the directory path for the specified group", () => {
    // Call the getGroupDirectory function with a group object.
    const group = { displayName: "Group 1", folderName: "group-1" };
    const groupDir = getGroupDirectory(group);

    // Verify that the directory path was returned.
    expect(groupDir).toBe(pathJoinDir("group-1"));
  });

  it("should return the directory path for the specified group with default folder name", () => {
    // Call the getGroupDirectory function with a group object that doesn't have a folder name.
    const group = { displayName: "Group1" };
    const groupDir = getGroupDirectory(group);

    // Verify that the directory path was returned with the default folder name.
    expect(groupDir).toBe(pathJoinDir("Group1"));
  });
});

describe("createDirectory", () => {
  it("should create a directory if it doesn't already exist", () => {
    // Mock the fs.existsSync and fs.mkdirSync functions.
    fs.existsSync.mockReturnValue(false);

    // Call the createDirectory function with a directory path.
    const directoryPath = "path/to/directory";
    createDirectory(directoryPath);

    // Verify that the directory was created.
    expect(fs.existsSync).toHaveBeenCalledWith(directoryPath);
    expect(fs.mkdirSync).toHaveBeenCalledWith(directoryPath);

    // Clean up the mocks.
    fs.existsSync.mockRestore();
    fs.mkdirSync.mockRestore();
  });

  it("should not create a directory if it already exists", () => {
    // Mock the fs.existsSync and fs.mkdirSync functions.
    fs.existsSync.mockReturnValue(true);

    // Call the createDirectory function with a directory path.
    const directoryPath = "path/to/directory";
    createDirectory(directoryPath);

    // Verify that the directory was not created.
    expect(fs.existsSync).toHaveBeenCalledWith(directoryPath);
    expect(fs.mkdirSync).not.toHaveBeenCalled();

    // Clean up the mocks.
    fs.existsSync.mockRestore();
    fs.mkdirSync.mockRestore();
  });
});

describe("getUserListPath", () => {
  it("should return the file path for the user list in the specified group directory", () => {
    // Call the getUserListPath function with a group directory.
    const groupDir = "path/to/group";
    const userListPath = getUserListPath(groupDir);

    // Verify that the file path was returned.
    expect(userListPath).toBe(path.join(groupDir, "users"));
  });
});

describe("writeUserListToFile", () => {
  it("should write the user list to a file", () => {
    // Mock the fs.writeFileSync function.
    fs.writeFileSync.mockReturnValue(undefined);

    // Call the writeUserListToFile function with a file path and user list.
    const filePath = "path/to/file";
    const userList = "user-1\nuser-2";
    writeUserListToFile(filePath, userList);

    // Verify that the user list was written to the file.
    expect(fs.writeFileSync).toHaveBeenCalledWith(filePath, userList);
  });
});

describe("logDryRun", () => {
  it("should log the contents of the user list file", () => {
    // Mock the console.log function.
    console.log = jest.fn();

    // Call the logDryRun function with a file path and user list.
    const filePath = "path/to/file";
    const userList = "user-1\nuser-2";
    logDryRun(filePath, userList);

    // Verify that the contents of the user list file were logged.
    expect(console.log).toHaveBeenCalledWith(`Writing file ${filePath} with contents:\n${userList}`);
  });
});

describe("logError", () => {
  it("should log an error message", () => {
    // Mock the console.error function.
    console.error = jest.fn();

    // Call the logError function with a group name and error.
    const groupName = "Group 1";
    const error = new Error("An error occurred.");
    logError(groupName, error);

    // Verify that the error message was logged.
    expect(console.error).toHaveBeenCalledWith(`Error processing group ${groupName}: ${error.message}`);
  });
});
