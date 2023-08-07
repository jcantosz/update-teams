const fs = require("fs");
const path = require("path");
const {
  getGroups,
  getGroupById,
  getGroupMembers,
  getMembersList,
  getGroupDirectory,
  createDirectory,
  getUserListPath,
  writeUserListToFile,
  logDryRun,
  logError,
} = require("../src/utils");

describe("getGroups", () => {
  test("returns an array of groups", async () => {
    const client = {
      api: jest.fn().mockReturnValue({
        header: jest.fn().mockReturnThis(),
        search: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ value: [{ id: "test-group-id", displayName: "my group" }] }),
      }),
    };

    const groups = await getGroups(client);
    expect(groups).toBeDefined();
    expect(Array.isArray(groups)).toBe(true);
    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0].id).toBe("test-group-id");
    expect(groups[0].displayName).toBe("my group");
    expect(groups[0].folderName).toBe("my-group");
  });
});

describe("getGroupById", () => {
  test("returns a group object", async () => {
    const client = {
      api: jest.fn().mockReturnValue({
        header: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ value: [{ id: "test-group-id", displayName: "my group" }] }),
      }),
    };

    const group = await getGroupById(client, "test-group-id");
    expect(group).toBeDefined();
    expect(group.constructor.name).toBe("Object");
    expect(group.displayName).toBe("my group");
  });
});

describe("getGroupMembers", () => {
  test("returns an array of group members", async () => {
    const client = {
      api: jest.fn().mockReturnValue({
        header: jest.fn().mockReturnThis(),
        search: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          value: [
            { userPrincipalName: "user1@example.com" },
            { userPrincipalName: "user2@example.com" },
            { userPrincipalName: "user_3@example.com" },
          ],
        }),
      }),
    };

    const members = await getGroupMembers(client, "test-group-id");
    expect(members).toBeDefined();
    expect(Array.isArray(members)).toBe(true);
    expect(members.length).toBeGreaterThan(0);
    expect(members[0].userPrincipalName).toBe("user1");
    expect(members[1].userPrincipalName).toBe("user2");
    expect(members[2].userPrincipalName).toBe("user-3");
  });
});

describe("getMembersList", () => {
  test("returns a newline-separated string of userPrincipalNames", () => {
    const members = [{ userPrincipalName: "user1@example.com" }, { userPrincipalName: "user2@example.com" }];
    const membersList = getMembersList(members);
    expect(membersList).toBeDefined();
    expect(typeof membersList).toBe("string");
    expect(membersList).toContain("user1@example.com");
    expect(membersList).toContain("user2@example.com");
  });
});

describe("getGroupDirectory", () => {
  test("returns the directory path for a group", () => {
    const group = { folderName: "test-group" };
    const groupDirectory = getGroupDirectory(group);
    expect(groupDirectory).toBeDefined();
    expect(typeof groupDirectory).toBe("string");
    expect(groupDirectory).toContain("test-group");
  });
});

describe("createDirectory", () => {
  test("creates a directory if it doesn't exist", () => {
    const directoryPath = path.join(process.cwd(), "test-directory");
    createDirectory(directoryPath);
    expect(fs.existsSync(directoryPath)).toBe(true);
    fs.rmdirSync(directoryPath);
  });
});

describe("getUserListPath", () => {
  test("returns the file path for a user list in a group directory", () => {
    const groupDir = path.join(process.cwd(), "test-group");
    const userListPath = getUserListPath(groupDir);
    expect(userListPath).toBeDefined();
    expect(typeof userListPath).toBe("string");
    expect(userListPath).toContain("test-group");
    expect(userListPath).toContain("users");
  });
});

describe("writeUserListToFile", () => {
  test("writes a user list to a file", () => {
    const filePath = path.join(process.cwd(), "test-file");
    const userList = "user1\nuser2\nuser3";
    writeUserListToFile(filePath, userList);
    expect(fs.existsSync(filePath)).toBe(true);
    const fileContents = fs.readFileSync(filePath, "utf8");
    expect(fileContents).toBe(userList);
    fs.unlinkSync(filePath);
  });
});

describe("logDryRun", () => {
  test("logs a dry run message to the console", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();
    logDryRun("test message");
    expect(consoleSpy).toHaveBeenCalledWith("DRY RUN: test message SKIPPED");
    consoleSpy.mockRestore();
  });
});

describe("logError", () => {
  test("logs an error message to the console", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    logError("Test Group", new Error("Test error"));
    expect(consoleSpy).toHaveBeenCalledWith("Error processing group Test Group: Test error");
    consoleSpy.mockRestore();
  });
});
