Azure AD User List Exporter
This is a Node.js program that exports the list of users in each group in your Azure Active Directory (AD) to a file.

Prerequisites
Before you can use this program, you need to have the following:

An Azure AD tenant
An Azure AD application with the following permissions:
Directory.Read.All (Application permission)
User.Read.All (Delegated permission)
The TENANT_ID, CLIENT_ID, and CLIENT_SECRET environment variables set to the appropriate values for your Azure AD application
Installation
To install this program, follow these steps:

Clone this repository to your local machine.
Run npm install to install the required dependencies.
Usage
To use this program, follow these steps:

Create a file named groups in the root directory of this program.

Add the display names of the groups you want to export to the groups file, one per line. If you want to specify a custom folder name for a group, add a space after the display name and then add the folder name. For example:

Group3Folder
In this example, Group 1 will be processed and its user list will be written to a directory named Group 1 in the current directory. Group 2 will be processed and its user list will be written to a directory named Group2Folder in the current directory. Group 3 will be processed and its user list will be written to a directory named Group3Folder in the current directory.

Run npm start to start the program.

The program will create a directory for each group in the current directory and write a file named users in each directory with the list of users in the group.

Configuration
You can configure the behavior of this program using the following environment variables:

CONTINUE_ON_ERRORS: If set to "true", the program will continue processing groups even if an error occurs. If set to "false" (the default), the program will stop processing groups when an error occurs.
DRY_RUN: If set to "true", the program will not write any files. Instead, it will log the file contents that would have been written. If set to "false" (the default), the program will write the files as usual.
License
This program is licensed under the MIT License. See the LICENSE file for details.
