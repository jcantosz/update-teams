const fs = require('fs');
const path = require('path');
const { getDirectories, getRepositories, addRepositoriesToTeam, removeRepositoriesFromTeam } = require('./utils');

// Mock the Octokit client
const octokit = {
  teams: {
    addOrUpdateRepoInOrg: jest.fn(),
    listReposInOrg: jest.fn(),
    removeRepoInOrg: jest.fn(),
  },
};

// Mock the organization name
const organizationName = 'my-org';

describe('getDirectories', () => {
  test('returns a list of directories in the current directory', () => {
    // Mock the list of directories
    fs.readdirSync = jest.fn(() => [
      { name: 'team1', isDirectory: () => true },
      { name: 'file1', isDirectory: () => false },
      { name: 'team2', isDirectory: () => true },
    ]);

    expect(getDirectories()).toEqual(['team1', 'team2']);
  });
});

describe('getRepositories', () => {
  test('returns an empty list if the repositories file does not exist', () => {
    // Mock the repositories file not existing
    fs.existsSync = jest.fn(() => false);

    expect(getRepositories('team1')).toEqual([]);
  });

  test('returns a list of repositories from the repositories file', () => {
    // Mock the repositories file existing
    fs.existsSync = jest.fn(() => true);
    fs.readFileSync = jest.fn(() => 'push my-org/repo1 admin\npull my-org/repo2 push\n');

    expect(getRepositories('team1')).toEqual(['push my-org/repo1 admin', 'pull my-org/repo2 push']);
  });
});

describe('addRepositoriesToTeam', () => {
  test('adds the specified repositories to the team', async () => {
    // Mock the addOrUpdateRepoInOrg method
    octokit.teams.addOrUpdateRepoInOrg.mockResolvedValueOnce();

    await addRepositoriesToTeam(octokit, organizationName, 'team1', ['push my-org/repo1 admin', 'pull my-org/repo2 push']);

    expect(octokit.teams.addOrUpdateRepoInOrg).toHaveBeenCalledTimes(2);
    expect(octokit.teams.addOrUpdateRepoInOrg).toHaveBeenCalledWith({
      org: organizationName,
      team_slug: 'team1',
      owner: 'my-org',
      repo: 'repo1',
      permission: 'admin',
    });
    expect(octokit.teams.addOrUpdateRepoInOrg).toHaveBeenCalledWith({
      org: organizationName,
      team_slug: 'team1',
      owner: 'my-org',
      repo: 'repo2',
      permission: 'push',
    });
  });
});

describe('removeRepositoriesFromTeam', () => {
  test('removes any repositories from the team that are not listed in the repositories file', async () => {
    // Mock the listReposInOrg and removeRepoInOrg methods
    octokit.teams.listReposInOrg.mockResolvedValueOnce({
      data: [
        { owner: { login: 'my-org' }, name: 'repo1' },
        { owner: { login: 'my-org' }, name: 'repo2' },
        { owner: { login: 'my-org' }, name: 'repo3' },
      ],
    });
    octokit.teams.removeRepoInOrg.mockResolvedValueOnce();

    await removeRepositoriesFromTeam(octokit, organizationName, 'team1', ['push my-org/repo1 admin']);

    expect(octokit.teams.listReposInOrg).toHaveBeenCalledTimes(1);
    expect(octokit.teams.listReposInOrg).toHaveBeenCalledWith({
      org: organizationName,
      team_slug: 'team1',
    });
    expect(octokit.teams.removeRepoInOrg).toHaveBeenCalledTimes(2);
    expect(octokit.teams.removeRepoInOrg).toHaveBeenCalledWith({
      org: organizationName,
      team_slug: 'team1',
      owner: 'my-org',
      repo: 'repo2',
    });
    expect(octokit.teams.removeRepoInOrg).toHaveBeenCalledWith({
      org: organizationName,
      team_slug: 'team1',
      owner: 'my-org',
      repo: 'repo3',
    });
  });
});