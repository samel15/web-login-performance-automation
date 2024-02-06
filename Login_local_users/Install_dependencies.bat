@echo off
REM This batch script installs Python dependencies for the given Python script

REM Check if Python is installed
python --version
IF %ERRORLEVEL% NEQ 0 (
    echo Python is not installed. Please install Python and try again.
    exit /b 1
)

REM Install dependencies
pip install -r requirements.txt
IF %ERRORLEVEL% NEQ 0 (
    echo Failed to install dependencies. Please check the requirements file and try again.
    exit /b 1
)

echo Dependencies installed successfully.
exit /b 0
