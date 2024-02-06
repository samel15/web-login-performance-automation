@echo off
REM This batch script installs Node.js dependencies for the given Node.js script

REM Check if Node.js is installed
node --version
IF %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed. Please install Node.js and try again.
    exit /b 1
)

REM Install dependencies
npm install
IF %ERRORLEVEL% NEQ 0 (
    echo Failed to install dependencies. Please check the package.json file and try again.
    exit /b 1
)

echo Dependencies installed successfully.
exit /b 0
