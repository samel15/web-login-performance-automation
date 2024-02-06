const fs = require('fs');
const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');


// Define paths for easy configuration
const BASE_DIRECTORY = 'C:/Login_scripts'; // Provide a correct full path to the base directory
const LOGS_DIRECTORY = `${BASE_DIRECTORY}/logs`;
const EXTERNAL_USERS_FILE = `${BASE_DIRECTORY}/Login_external_users/externalusers.xlsx`;
const INITIAL_PAGE_URL = "[Provide_Initial_Page_URL]";

(async () => {
    const timeout = 60000; // Increased timeout to 60 seconds
    const validUsers = []; // Array to store users with valid credentials
    const browsers = []; // Array to store browser instances

    try {
        console.log(`${getCurrentTime()} - Start login process`);

        // Read user credentials from the Excel file
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(EXTERNAL_USERS_FILE);
        const worksheet = workbook.getWorksheet('Sheet1');

        // Iterate through rows in the Excel file starting from the second row
        for (let i = 2; i <= worksheet.rowCount; i++) {
            const userEmailCell = worksheet.getCell(`A${i}`);
            const userPasswordCell = worksheet.getCell(`B${i}`);

            // Check if both email and password cells have values
            if (!userEmailCell.value || !userPasswordCell.value) {
                // Skip rows with empty cells
                continue;
            }

            const userEmail = userEmailCell.value.toString().trim();
            const userPassword = userPasswordCell.value.toString().trim();

            // Launch a new browser instance for each user
            const browser = await puppeteer.launch({ headless: false, args: ['--start-maximized', '--auto-open-devtools-for-tabs', '--enable-chrome-browser-cloud-management'], dumpio: true });
            const pages = await browser.pages(); // Get all opened pages
            const page = pages[0]; // Use the first opened page (the initial blank tab)

            // Close the initial blank tab
            if (pages.length > 1) {
                await pages[1].close();
            }

            page.setDefaultTimeout(timeout);

            console.log(`${getCurrentTime()} - Start login process (${userEmail})`);

            // Navigate to the initial page
            await page.goto(INITIAL_PAGE_URL);
            console.log(`${getCurrentTime()} - Step 1: Navigated to the initial page (${userEmail})`);

            // Enter email and click Next button
            await page.waitForSelector('input[type="email"]#i0116', { timeout });
            await page.type('input[type="email"]#i0116', userEmail);
            await Promise.all([
                page.waitForSelector('input[type="submit"]#idSIButton9', { timeout }), // Wait for the Next button
                page.click('input[type="submit"]#idSIButton9')
            ]);
            console.log(`${getCurrentTime()} - Step 2: Entered email and pressed Next button (${userEmail})`);

            // Enter password and click Sign in button
            await page.waitForSelector(`input[type="password"][aria-label*="${userEmail}"]`, { timeout });
            await page.type(`input[type="password"][aria-label*="${userEmail}"]`, userPassword);
            await Promise.all([
                page.waitForSelector('input[type="submit"]#idSIButton9', { timeout }), // Wait for the Sign in button
                page.click('input[type="submit"]#idSIButton9')
            ]);
            console.log(`${getCurrentTime()} - Step 3: Entered password and signed in (${userEmail})`);

            // Manual action required: Select "Yes" to stay signed in
            console.log(`${getCurrentTime()} - Step 4: Please manually select Yes to stay signed in (${userEmail})`);

            // Store the browser instance and user credentials
            browsers.push({ browser, page, userEmail });

            // Store the user with valid credentials
            validUsers.push(userEmail);
        }

        // Prompt user to press 'g' to click Yes button
        console.log(`${getCurrentTime()} - Press 'g' to trigger clicking the Yes button...`);
        await waitForKeyPress('g');

        // Enable request interception to capture Network Requests and responses
        await Promise.all(browsers.map(({ page }) => page.setRequestInterception(true)));
        browsers.forEach(({ page }) => {
            page.on('request', request => {
                appendToFile('network_requests.txt', `${getCurrentTime()} - Request: ${request.url()}\n`);
                request.continue();
            });
            page.on('response', response => {
                appendToFile('network_responses.txt', `${getCurrentTime()} - Response: ${response.url()}\n`);
            });
        });

        // Capture Performance Metrics
        for (const { page, userEmail } of browsers) {
            const metrics = await page.evaluate(() => JSON.stringify(window.performance.timing));
            const data = `${getCurrentTime()} - Performance Metrics for ${userEmail}:\n`
                + `${getCurrentTime()} - Metrics: ${metrics}\n`;
            appendToFile('performance_metrics.txt', data);
        }

        // Capture error logs
        browsers.forEach(({ page, userEmail }) => {
            page.on('error', error => {
                appendToFile('error_logs.txt', `${getCurrentTime()} - Error for ${userEmail}: ${error}\n`);
            });
        });

        // Click the "Yes" button on all instances
        await Promise.all(browsers.map(({ page }) => page.click('input[type="submit"]#idSIButton9[value="Yes"]')));
        console.log(`${getCurrentTime()} - Clicking the Yes button triggered redirecting to the select profile page`);

        // Prompt user to press 'f' to close the browser
        console.log(`${getCurrentTime()} - Press 'f' to close the browser and finish the test...`);
        await waitForKeyPress('f');

    } catch (error) {
        console.error(error);
        appendToFile('error_logs.txt', `${getCurrentTime()} - Unhandled Error: ${error}\n`);
        process.exit(1);
    } finally {
        // Close all browser instances
        await Promise.all(browsers.map(({ browser }) => browser.close()));

        if (validUsers.length > 0) {
            console.log(`${getCurrentTime()} - Valid users with successful login attempts: ${validUsers.join(', ')}`);
        } else {
            console.log(`${getCurrentTime()} - No valid users found.`);
        }

        console.log(`${getCurrentTime()} - Test completed.`);
        process.exit(0); // Exit the script
    }
})();

// Function to get the current time in a formatted string
function getCurrentTime() {
    return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
}

// Function to wait for a key press
async function waitForKeyPress(key) {
    return new Promise(resolve => {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('data', onData);

        function onData(data) {
            if (data.toString().trim() === key) {
                process.stdin.off('data', onData);
                process.stdin.setRawMode(false);
                resolve();
            }
        }
    });
}

// Function to append data to a file
function appendToFile(filePath, data) {
    if (!fs.existsSync(LOGS_DIRECTORY)) {
        fs.mkdirSync(LOGS_DIRECTORY, { recursive: true }); // Create logs directory if it doesn't exist
    }
    const fullPath = `${LOGS_DIRECTORY}/${filePath}`;
    fs.appendFileSync(fullPath, data);
}
