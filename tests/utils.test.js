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
    expect(directories).toContain("test");
  });
});

describe("hasRepositoriesFile", () => {
  test("returns true if the specified team has a repositories file", () => {
    const hasFile = hasRepositoriesFile("test");
    expect(hasFile).toBe(true);
  });

  test("returns false if the specified team does not have a repositories file", () => {
    const hasFile = hasRepositoriesFile("other-team");
    expect(hasFile).toBe(false);
  });
});

describe("getRepositoriesFromFile", () => {
  test("returns a list of repositories for the specified team", () => {
    const repositories = getRepositoriesFromFile("test");
    expect(repositories).toContainEqual({ full_name: "jcantosz-test-org/.github-private", permission: "pull" });
    expect(repositories).toContainEqual({ full_name: "jcantosz-test-org/package-registry", permission: "admin" });
  });
});

describe("getRepositoriesFromTeam", () => {
  test("returns a list of repositories for the specified team", async () => {
    const octokit = {
      teams: {
        listReposInOrg: jest.fn().mockResolvedValue({
          data: [
            {
              full_name: "jcantosz-test-org/.github-private",
              role_name: "pull",
            },
            {
              full_name: "jcantosz-test-org/package-registry",
              role_name: "admin",
            },
          ],
        }),
      },
    };
    const repositories = await getRepositoriesFromTeam(octokit, "jcantosz-test-org", "test");
    expect(repositories).toContainEqual({
      full_name: "jcantosz-test-org/.github-private",
      permission: "pull",
    });
    expect(repositories).toContainEqual({
      full_name: "jcantosz-test-org/package-registry",
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
      { full_name: "jcantosz-test-org/.github-private", permission: "pull" },
      { full_name: "jcantosz-test-org/package-registry", permission: "admin" },
    ];
    //octokit, organizationName, teamName, teamRepos, repositoryList)
    await addRepositoriesToTeam(octokit, "jcantosz-test-org", "test", [], repositoryList);
    expect(octokit.teams.addOrUpdateRepoPermissionsInOrg).toHaveBeenCalledWith({
      org: "jcantosz-test-org",
      team_slug: "test",
      owner: "jcantosz-test-org",
      repo: ".github-private",
      permission: "pull",
    });
    expect(octokit.teams.addOrUpdateRepoPermissionsInOrg).toHaveBeenCalledWith({
      org: "jcantosz-test-org",
      team_slug: "test",
      owner: "jcantosz-test-org",
      repo: "package-registry",
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
        full_name: "jcantosz-test-org/.github-private",
        permissions: {
          pull: true,
          push: false,
          admin: false,
        },
      },
      {
        full_name: "jcantosz-test-org/package-registry",
        permissions: {
          pull: false,
          push: true,
          admin: true,
        },
      },
      {
        full_name: "jcantosz-test-org/other-repo",
        permissions: {
          pull: true,
          push: true,
          admin: true,
        },
      },
    ];
    const repositoryList = ["jcantosz-test-org/.github-private", "jcantosz-test-org/package-registry"];
    await removeRepositoriesFromTeam(octokit, "jcantosz-test-org", "test", teamRepos, repositoryList);
    expect(octokit.teams.removeRepoInOrg).toHaveBeenCalledWith({
      org: "jcantosz-test-org",
      team_slug: "test",
      owner: "jcantosz-test-org",
      repo: "other-repo",
    });
  });
});
