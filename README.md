# Team Sync Actions

A group of actions to sync user and repo information to teams based on files in a repository. If a user/repo is exists in the file but does not exist for the team, the user/repo will be added. If they do not exist in the file but exist in the team, that item will be removed from the team.

## Repository Layout

```
|- groups
|- <team name>
|  |- users
|  \- repositories
|- <team name>
|  |- users
|  \- repositories
\- <team name>
   |- users
   \- repositories
...
```

## Actions

### create-teams-from-directories

Creates teams in GitHub based on the directories present in the repo its run on. Will look through each top-level directory for a file named `users` or `repositories` if they are present then create a team of the same name as the directory.

### aad-user-sync

Gather a list of users for each aad group. Create a directory for that group and create a users file under that directory with each username present in the group. Optionally limit the groups to sync by creating a `groups` file that lists only the groups you wish to sync

- User names are generated from `userPrincipalName` (Everything after `@` symbol removed, non-alphanumeric symbols replaced with `-`)

### sync-users

Add all users from a `users` file to a team in GitHub with the same name as the directory the `users` file exists within

### sync-repositories

Add all repositories from a `repositories` file to a team in GitHub with the same name as the directory the `repositories` file exists within. `repositories` file defines the team's permission level and the repository slug for each repo to sync

## File Format

### repositories

A list permissions and repos to add to the team. Each item should be on its own line. Permissions are space separated from the repository. The repository should include the organization name and the repository name

```
<permission> <repository>
<permission> <repository>
<permission> <repository>
```

ex.

```
read my-org/my-repo
write my-org/other-repo
```

Where permission can be set to `read|pull`, `triage`, `write|push`, `maintain`, `admin`

### users

A list of username to add to the team. Each user should be on its own line

```
<username>
<username>
```

ex.

```
jcantosz
```

### groups

AAD groups to GitHub teams.

To limit the groups to sync, create a `groups` file withe the aad groups to sync (one per line). Groups can be mapped to different teams names with lines in the file like `<group name>:<team name>`. If the file is not present, all groups from AAD will by sync'd.

```
group 1
group 2:team-name
```

## GitHub Application

Create a github Application with the following permissions:
// GitHub App Permissions
// Repository permissions
// Administration: Read-and-write
// Metadata: Read-only
// Organization permissions
// Members: Read-and-write

sample usage
Create teams from AAD

# Sample use

Updates GitHub repository's files with users from AAD for mapped teams. Creates teams that do not exist. Runs nightly at 11pm or on demand

```yaml
name: Update GitHub teams with new users/repos defined in repo
# Controls when the workflow will run
on:
  schedule:
    # Run nightly at midnight
    - cron: "0 23 * * *"

  # Allows you to run this workflow manually from the Actions tab
  workflow_dispatch:

permissions:
  id-token: write # This is required for requesting the JWT
  contents: write # read is required for actions/checkout, write is required to create a release

jobs:
  sync-aad-users:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: "Az CLI login"
        uses: azure/login@v1
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Sync users from AAD
        uses: jcantosz/update-teams/aad-user-sync@main

      - name: Create teams from directories
        uses: jcantosz/update-teams/create-teams-from-directories@main
        with:
          app_id: ${{ secrets.app_id }}
          private_key: ${{ secrets.private_key }}
          client_id: ${{ secrets.client_id }}
          client_secret: ${{ secrets.client_secret }}
          installation_id: ${{ secrets.installation_id }}
          organization_name: "jcantosz-test-org"

      - name: setup git config
        run: |
          # setup the username and email. I tend to use 'GitHub Actions Bot' with no email by default
          git config user.name "GitHub Actions Bot"
          git config user.email "actions@github.com"

      - name: commit
        run: |
          # Stage the file, commit and push
          git add .
          git commit -m "Group membership updates"
          git push origin main
```

Updating existing GitHub teams with the users and repositories defined in the repos. Runs every night at midnight or on demand

```yaml
name: Update GitHub teams with new users/repos defined in repo
# Controls when the workflow will run
on:
  schedule:
    # Run nightly at midnight
    - cron: "0 0 * * *"

  # Allows you to run this workflow manually from the Actions tab
  workflow_dispatch:

jobs:
  sync-repos:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Sync team repositories
        uses: jcantosz/update-teams/sync-repositories@main
        with:
          app_id: ${{ secrets.app_id }}
          private_key: ${{ secrets.private_key }}
          client_id: ${{ secrets.client_id }}
          client_secret: ${{ secrets.client_secret }}
          installation_id: ${{ secrets.installation_id }}
          organization_name: "jcantosz-test-org"

  sync-users:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Sync team repositories
        uses: jcantosz/update-teams/sync-users@main
        with:
          app_id: ${{ secrets.app_id }}
          private_key: ${{ secrets.private_key }}
          client_id: ${{ secrets.client_id }}
          client_secret: ${{ secrets.client_secret }}
          installation_id: ${{ secrets.installation_id }}
          organization_name: "jcantosz-test-org"
```

## Notes

- does not do nested teams
- does not sync users from nested teams in Azure AD
- does not create/validate teams/repos/users created/exist
