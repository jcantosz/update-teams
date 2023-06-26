const {
  getDirectories,
  hasRepositoriesFile,
  getRepositoriesFromFile,
  getRepositoriesFromTeam,
  addRepositoriesToTeam,
  removeRepositoriesFromTeam,
} = require("../src/utils");

//const { describe, test } = require("jest");

describe("getDirectories", () => {
  test("returns a list of directories in the current directory", () => {
    const directories = getDirectories();
    expect(directories).toContain("src");
    expect(directories).toContain("test-data");
  });
});

describe("hasRepositoriesFile", () => {
  test("returns true if the specified team has a repositories file", () => {
    const hasFile = hasRepositoriesFile("test-data");
    expect(hasFile).toBe(true);
  });

  test("returns false if the specified team does not have a repositories file", () => {
    const hasFile = hasRepositoriesFile("other-team");
    expect(hasFile).toBe(false);
  });
});

describe("getRepositoriesFromFile", () => {
  test("returns a list of repositories for the specified team", () => {
    const repositories = getRepositoriesFromFile("test-data");
    expect(repositories).toContainEqual({ full_name: "sample-org/repository-1", permission: "pull" });
    expect(repositories).toContainEqual({ full_name: "sample-org/repository-2", permission: "admin" });
  });
});

describe("getRepositoriesFromTeam", () => {
  test("returns a list of repositories for the specified team", async () => {
    const octokit = {
      teams: {
        listReposInOrg: jest.fn().mockResolvedValue({
          data: [
            {
              full_name: "sample-org/.github-private",
              role_name: "pull",
            },
            {
              full_name: "sample-org/package-registry",
              role_name: "admin",
            },
          ],
        }),
      },
    };
    const repositories = await getRepositoriesFromTeam(octokit, "sample-org", "test-data");
    expect(repositories).toContainEqual({
      full_name: "sample-org/.github-private",
      permission: "pull",
    });
    expect(repositories).toContainEqual({
      full_name: "sample-org/package-registry",
      permission: "admin",
    });
  });
});

describe("addRepositoriesToTeam", () => {
  test("adds the specified repositories to the corresponding team with the specified permission level", async () => {
    const octokit = {
      teams: {
        addOrUpdateRepoPermissionsInOrg: jest.fn().mockResolvedValue({}),
      },
    };
    const repositoryList = [
      { full_name: "sample-org/repository-1", permission: "pull" },
      { full_name: "sample-org/repository-2", permission: "admin" },
    ];
    //octokit, organizationName, teamName, teamRepos, repositoryList)
    await addRepositoriesToTeam(octokit, "sample-org", "test-data", [], repositoryList);
    expect(octokit.teams.addOrUpdateRepoPermissionsInOrg).toHaveBeenCalledWith({
      org: "sample-org",
      team_slug: "test-data",
      owner: "sample-org",
      repo: "repository-1",
      permission: "pull",
    });
    expect(octokit.teams.addOrUpdateRepoPermissionsInOrg).toHaveBeenCalledWith({
      org: "sample-org",
      team_slug: "test-data",
      owner: "sample-org",
      repo: "repository-2",
      permission: "admin",
    });
  });
});

describe("removeRepositoriesFromTeam", () => {
  test("removes any repositories from the team that are not listed in the repositories file", async () => {
    const octokit = {
      teams: {
        removeRepoInOrg: jest.fn().mockResolvedValue({}),
      },
    };
    const teamRepos = [
      {
        full_name: "sample-org/repository-1",
        permissions: {
          pull: true,
          push: false,
          admin: false,
        },
      },
      {
        full_name: "sample-org/repository-2",
        permissions: {
          pull: false,
          push: true,
          admin: true,
        },
      },
      {
        full_name: "sample-org/other-repo",
        permissions: {
          pull: true,
          push: true,
          admin: true,
        },
      },
    ];
    const repositoryList = ["sample-org/.github-private", "sample-org/package-registry"];
    await removeRepositoriesFromTeam(octokit, "sample-org", "test-data", teamRepos, repositoryList);
    expect(octokit.teams.removeRepoInOrg).toHaveBeenCalledWith({
      org: "sample-org",
      team_slug: "test-data",
      owner: "sample-org",
      repo: "other-repo",
    });
  });
});
