## Update Team Repositories

This is a Node.js script that updates the repositories that are associated with teams in a GitHub organization. The script reads a list of repositories from a file in each team directory, adds or updates the repositories in the corresponding team, and removes any repositories from the team that are not listed in the file.

## Usage

### To run as an action:

### To run locally

1. Clone the repository
1. Install the dependencies: `npm install`
1. Create a .env file with the following contents:

- `INPUTS_APP_ID` - GitHub App's app ID
- `INPUTS_PRIVATE_KEY` - GitHub App's private key
- `INPUTS_CLIENT_ID` - GitHub App's client ID
- `INPUTS_CLIENT_SECRET` - GitHub App's client secret
- `INPUTS_INSTALLATION_ID` - GitHub App's Installation ID
- `INPUTS_ORGANIZATION_NAME` - GitHub organization with teams/repositories to modify

1. `node main.js`

You can create a GitHub App and generate a private key by following the instructions in the GitHub documentation.

## Configuration

Create a file named repositories in each team directory. The file should contain a list of repositories in the format <permission> <owner>/<repo>, where <permission> is one of pull, push, or admin, and <owner>/<repo> is the owner and name of the repository separated by a slash. For example:

## Testing

To run the tests, use the following command: `npm test`

The tests use the Jest testing framework to test the behavior of the utils.js module. The tests mock the necessary dependencies and test the behavior of each function.
