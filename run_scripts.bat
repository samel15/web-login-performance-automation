@echo off
echo Current working directory: %cd%
cd /d "%~dp0"
set SCRIPT_DIR=%~dp0
set VENV_DIR=%SCRIPT_DIR%venv

:select_script
echo Select a script to run:
echo 1. Login_many_local_users.py
echo 2. Login_many_external_users.js
echo 3. Exit

set /p SCRIPT_NUMBER="Enter the script number: "

if "%SCRIPT_NUMBER%"=="1" (
    call :run_python_script "Login_local_users\Login_many_local_users.py"
) else if "%SCRIPT_NUMBER%"=="2" (
    call :run_node_script "Login_external_users\Login_many_external_users.js"
) else if "%SCRIPT_NUMBER%"=="3" (
    echo Exiting...
    exit /b 0
) else (
    echo Invalid script number. Please try again.
    goto select_script
)

:run_python_script
set SCRIPT_NAME=%1
if not exist "%VENV_DIR%" (
    echo Virtual environment not found. Installing dependencies...
    call :install_dependencies "Login_local_users"
)
call %VENV_DIR%\Scripts\activate
cd %SCRIPT_DIR%
python "%SCRIPT_NAME%"
call %VENV_DIR%\Scripts\deactivate
goto select_script

:run_node_script
set SCRIPT_NAME=%1
if not exist "%VENV_DIR%" (
    echo Virtual environment not found. Installing dependencies...
    call :install_dependencies "Login_external_users"
)
cd %SCRIPT_DIR%
call node "%SCRIPT_NAME%"
goto select_script

:install_dependencies
set SCRIPT_FOLDER=%1
cd "%SCRIPT_DIR%\%SCRIPT_FOLDER%"
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate
if not exist requirements.txt (
    echo requirements.txt not found. Please create the file with necessary dependencies.
    exit /b 1
)
echo Installing dependencies...
pip install -r requirements.txt
call venv\Scripts\deactivate
goto :eof
