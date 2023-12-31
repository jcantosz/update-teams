## Update Team Repositories

This is a Node.js script that updates the repositories that are associated with teams in a GitHub organization. The script reads a list of repositories from a file in each team directory, adds or updates the repositories in the corresponding team, and removes any repositories from the team that are not listed in the file.

## Usage

### To run as an action:

```yaml
name: Build and Test

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Sync team repositories
        uses: jcantosz/update-teams/sync-repositories@v1
        with:
          app_id: ${{ secrets.app_id }}
          private_key: ${{ secrets.private_key }}
          installation_id: ${{ secrets.installation_id }}
          organization_name: "my-org"
```

### To run locally

1. Clone the repository
1. Install the dependencies: `npm install`
1. Create a `.env` file that exports the following environment variables:

- `INPUT_APP_ID` - GitHub App's app ID
- `INPUT_PRIVATE_KEY` - GitHub App's private key
- `INPUT_INSTALLATION_ID` - GitHub App's Installation ID
- `INPUT_ORGANIZATION_NAME` - GitHub organization with teams/repositories to modify
- `INPUT_DRY_RUN` - if set, skip any execution that would make changes to GitHub

4. Source the env file: `source ./.env`
5. Run the program: `node main.js`

You can create a GitHub App and generate a private key by following the instructions in the GitHub documentation.

## Configuration

Create a file named `repositories` in each team directory. The file should contain a list of repositories in the format `<permission> <owner>/<repo>`, where `<permission>` is one of `read|pull`, `triage`, `write|push`, `maintain`, `admin`, and `<owner>/<repo>` is the owner and name of the repository separated by a slash. For example:

## Testing

To run the tests, use the following command: `npm test`

The tests use the Jest testing framework to test the behavior of the utils.js module. The tests mock the necessary dependencies and test the behavior of each function.
