Update Repositories
This is a Node.js script that updates the repositories that are associated with teams in a GitHub organization. The script reads a list of repositories from a file in each team directory, adds or updates the repositories in the corresponding team, and removes any repositories from the team that are not listed in the file.

Usage
Clone the repository:

Install the dependencies:

Create a .env file with the following contents:

You can create a GitHub App and generate a private key by following the instructions in the GitHub documentation.

Modify the organizationName variable in index.js to match the name of your GitHub organization.

Create a file named repositories in each team directory. The file should contain a list of repositories in the format <permission> <owner>/<repo>, where <permission> is one of pull, push, or admin, and <owner>/<repo> is the owner and name of the repository separated by a slash. For example:

Run the script:

start
The script will loop through each team directory, read the repositories file, and update the corresponding team in the GitHub organization.

Testing
To run the tests, use the following command:

test
The tests use the Jest testing framework to test the behavior of the utils.js module. The tests mock the necessary dependencies and test the behavior of each function.