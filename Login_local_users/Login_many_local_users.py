import os
import json
import time
import socket
import requests
import http.client
import pandas as pd
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

# Set up Chrome DevTools Protocol (CDP) client
chrome_driver_path = r'C:\chromedriver\chromedriver-win64\chromedriver.exe'

# Configurable options
username_xpath = "/html/body/app-root/app-login/div[1]/form/div[1]/div[1]/n1-lib-input/label/div[2]/input" # Provide a correct username_xpath
password_xpath = "/html/body/app-root/app-login/div[1]/form/div[1]/div[2]/n1-lib-input/label/div[2]/input" # Provide a correct password_xpath
login_button_xpath = "/html/body/app-root/app-login/div[1]/form/div[3]/n1-lib-button/button/div/n1-lib-formatted-message" # Provide a correct login_button_xpath
success_element_xpath = "//*[@id='common.loadedItems']"  # Provide a correct success element XPath
excel_file_path = r'...\Login_scripts\Login_local_users\localusers.xlsx' # Provide a correct full path to the Excel file
initial_page_url = "[Provide_Initial_Page_URL]"
login_timeout = 20  # Define timeout for waiting for successful login (in seconds e.g. 60 seconds)

# Load user data from Excel
df = pd.read_excel(excel_file_path)
local_users = df.to_dict(orient="records")

# Define lists to keep track of login status
successful_logins = []
failed_logins = []

def check_network_connection():
    """Check network connection by resolving a domain name."""
    try:
        socket.gethostbyname("[Provide_Domain_URL]")
        return True
    except socket.error:
        return False

def create_chrome_driver():
    """Create Chrome WebDriver with specified options."""
    try:
        options = Options()
        options.add_argument("--auto-open-devtools-for-tabs")  # Open DevTools automatically
        options.add_argument("--devtools-panel=network")  # Open DevTools directly to the Network tab
        options.add_argument("--start-maximized")  # Maximize the browser window
        return webdriver.Chrome(options=options)
    except Exception as e:
        print(f"Error creating Chrome WebDriver: {e}")
        return None

def login(chrome_driver, user_data):
    """Perform login for a user."""
    try:
        # Navigate to the login page
        chrome_driver.get(initial_page_url)
        start_time = datetime.now()
        
        username_input = WebDriverWait(chrome_driver, 90).until(
            EC.presence_of_element_located((By.XPATH, username_xpath))
        )
        username_input.send_keys(user_data["UserName"])

        # Switch to the password input using the Tab key
        username_input.send_keys(Keys.TAB)

        password_input = WebDriverWait(chrome_driver, 90).until(
            EC.presence_of_element_located((By.XPATH, password_xpath))
        )
        password_input.send_keys(user_data["Password"])

        print(f"{datetime.now()} - User: {user_data['UserName']} - Credentials entered successfully. Duration: {datetime.now() - start_time}")
        return chrome_driver

    except TimeoutException as te:
        print(f"{datetime.now()} - User: {user_data.get('UserName', 'Unknown User')} - Timed out waiting for element: {te}")
        return None

    except Exception as e:
        print(f"{datetime.now()} - User: {user_data.get('UserName', 'Unknown User')} - Error during authentication: {e}")
        return None

try:
    # Iterate through each user and perform login
    chrome_instances = [create_chrome_driver() for _ in range(len(local_users))]
    for chrome_instance, user_data in zip(chrome_instances, local_users):
        if chrome_instance:
            start_time = datetime.now()
            print(f"{start_time} - User: {user_data['UserName']} - Opening the login page URL.")
            
            success = login(chrome_instance, user_data)
            if success:
                successful_logins.append(user_data["UserName"])
            else:
                failed_logins.append(user_data["UserName"])

    # Inform the user about the timeout duration for login
    print(f"Please note that the script will wait for {login_timeout} second(s) for simultaneous login attempt for all users.")

    # Prompt user to confirm simultaneous login attempt
    repeat_test = input("Do you want to initiate simultaneous login attempt for all users? Type 'yes' and press Enter: ")
    if repeat_test.lower() == "yes":
        # Start login attempts for all users simultaneously
        for instance in chrome_instances:
            if instance:
                login_button = WebDriverWait(instance, 90).until(
                    EC.element_to_be_clickable((By.XPATH, login_button_xpath))
                )
                login_button.click()

        # Check login success for all users simultaneously
        start_time_all = datetime.now()
        print(f"{start_time_all} - Waiting for all users to log in...")
        for instance, user_data in zip(chrome_instances, local_users):
            if instance:
                try:
                    WebDriverWait(instance, login_timeout).until(
                        EC.visibility_of_element_located((By.XPATH, success_element_xpath))
                    )
                    print(f"{datetime.now()} - User: {user_data['UserName']} - The expected element is visible. The login is successful.")
                    successful_logins.append(user_data["UserName"])
                except TimeoutException:
                    print(f"{datetime.now()} - User: {user_data['UserName']} - The expected element is not visible. Login unsuccessful.")
                    failed_logins.append(user_data["UserName"])

                    # Capture error logs for failed login attempts
                    capture_error_logs(f"Login unsuccessful for user: {user_data['UserName']}")

        end_time = datetime.now()
        print(f"{end_time} - All users - Duration: {end_time - start_time_all}")

    else:
        print("Simultaneous login attempt not initiated.")

except Exception as ex:
    print(f"An error occurred: {ex}")

finally:
    # Close all browsers and finish the test when the user presses 'f' and Enter
    if input("Type 'f' and press Enter to close all browsers and finish the test (be patient, it will take a while): ") == 'f':
        for instance in chrome_instances:
            if instance:
                instance.quit()
