# Web Login Automation Scripts

This project contains automation scripts written in Python and Node.js for logging into a web application using Selenium and Puppeteer respectively. The scripts automate the login process for multiple users and can be configured to handle different environments.

## Prerequisites

### For Local Users Script (Python - Selenium)

- Python installed
- ChromeDriver installed (ensure compatibility with your Chrome version)

### For External Users Script (Node.js - Puppeteer)

- Node.js installed on your system. You can download it from [here](https://nodejs.org/).

## Setup

1. Clone or download the script files to your local machine.

2. Run the `run_scripts.bat` batch file to execute the desired script. The batch file will automatically install any missing dependencies.

## Configuration

### For Local Users Script (Python - Selenium)

- Ensure ChromeDriver is installed and compatible with your Chrome version.
- Update the `users.xlsx` file with user data, including columns "UserName" and "Password".
- * If needed - Adjust the XPath paths in the script for username, password, login button, and success element based on your web application structure.

### For External Users Script (Node.js - Puppeteer)

- Update the `externalusers.xlsx` file with user data, including columns for email and password.
- Adjust the `BASE_DIRECTORY`, `EXTERNAL_USERS_FILE`, and `INITIAL_PAGE_URL` variables in the script as needed.

## Usage

1. Run the `run_scripts.bat` batch file and follow the on-screen instructions to select and run the desired script.

## Important Notes

- **Manual Steps**: Both scripts may require manual intervention at certain steps, such as clicking "Yes" to stay signed in. Follow the on-screen instructions when prompted.
- **Logs and Metrics**: The scripts capture Network Requests, Responses, Error logs, and Performance Metrics during execution. These are stored in external files in the `logs` folder.
- **Customization**: The scripts can be customized by adjusting variables, XPath paths, and error handling based on specific requirements.

