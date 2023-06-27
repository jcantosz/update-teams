# Team Sync Actions
A group of actions to sync user and repo information to teams based on files in a repository. If a user/repo is exists in the file but does not exist for the team, the user/repo will be added. If they do not exist in the file but exist in the team, that item will be removed from the team.

## Repository Layout
```
|- ad.groups
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
A list of user ids to add to the team. Each user should be on its own line
```
<user id>
<user id>
```
ex.
```
jcantosz
```

## GitHub Application
Create a github Application with the following permissions:
// GitHub App Permissions
// Repository permissions
// Administration: Read-and-write
// Metadata: Read-only
// Organization permissions
// Members: Read-and-write


## Notes
does not do nested teams
does not create/validate teams/repos/users created/exist
