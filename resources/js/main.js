window.onload = () => {
    console.log("Application initialized");

    // Portfolio management
    let portfolios = {};
    let currentPortfolio = null;
    let isTableVisible = true;
    let hasUnsavedStructuralChanges = false; // Track portfolio creation/rename/deletion
    let helpWindowInstance = null; // Track help window instance

    // Settings file path
    const SETTINGS_FILE = '.storage/settings.json';

    // Helper function to save settings to settings.json
    function saveSettings(theme, lastPortfolio, tableVisible) {
        const settings = { theme, lastPortfolio, tableVisible };
        Neutralino.filesystem.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2))
            .then(() => {
                console.log('Settings saved to', SETTINGS_FILE);
            })
            .catch(err => {
                console.error('Failed to save settings:', err);
                showMessage("Failed to save settings", "error");
            });
    }

    // Helper function to load settings from settings.json
    function loadSettings(callback) {
        Neutralino.filesystem.readFile(SETTINGS_FILE)
            .then(data => {
                try {
                    const settings = JSON.parse(data);
                    const theme = settings.theme === 'dark' ? 'dark' : 'light';
                    const lastPortfolio = typeof settings.lastPortfolio === 'string' ? settings.lastPortfolio : null;
                    const tableVisible = typeof settings.tableVisible === 'boolean' ? settings.tableVisible : true;
                    callback(theme, lastPortfolio, tableVisible);
                } catch (err) {
                    console.error('Invalid settings JSON:', err);
                    callback('light', null, true); // Default to light theme, no portfolio, table visible
                }
            })
            .catch(err => {
                console.warn('Settings file not found or inaccessible:', err);
                callback('light', null, true); // Default to light theme, no portfolio, table visible
            });
    }

    // Helper function to get table body reference
    function getTableBody() {
        return document.querySelector("#dataTable tbody");
    }

    // Helper function to update row indices
    function updateRowIndices() {
        const tbody = getTableBody();
        if (!tbody) return;
        const rows = tbody.querySelectorAll("tr");
        rows.forEach((row, index) => {
            const indexCell = row.querySelector("td:first-child");
            if (indexCell) {
                indexCell.textContent = index + 1;
            }
        });
    }

    // Helper function to update exportResult textarea and check for changes
    function updateExportResult() {
        const tbody = getTableBody();
        if (!tbody) {
            console.error("Table not found");
            return;
        }

        const rows = tbody.querySelectorAll("tr");
        const dataMap = {};

        rows.forEach(row => {
            const inputs = row.querySelectorAll("input");
            if (inputs.length >= 3) {
                const ticker = inputs[0].value.trim().toUpperCase(); // Convert to uppercase
                const price = parseFloat(inputs[1].value.trim());
                const qty = parseFloat(inputs[2].value.trim());

                if (ticker && !isNaN(price) && !isNaN(qty) && price >= 0 && qty >= 0) {
                    if (!dataMap[ticker]) {
                        dataMap[ticker] = [];
                    }
                    dataMap[ticker].push(`${price}x${qty}`);
                }
            }
        });

        const outputParts = [];
        for (const ticker in dataMap) {
            if (dataMap[ticker].length > 0) {
                outputParts.push(`${ticker}:${dataMap[ticker].join(',')}`);
            }
        }

        const combinedString = outputParts.join(';');
        const resultField = document.getElementById("exportResult");
        if (resultField && currentPortfolio) {
            resultField.value = combinedString ? `${currentPortfolio}:${combinedString}` : '';
            portfolios[currentPortfolio].data = combinedString;
            portfolios[currentPortfolio].hasUnsavedChanges = combinedString !== portfolios[currentPortfolio].savedData;
        }
    }

    // Add a new row to the table
    window.addRow = function(ticker = '', price = '', qty = '') {
        const tbody = getTableBody();
        const row = tbody.insertRow();

        // Convert ticker to uppercase
        ticker = ticker.toUpperCase();

        // Calculate index (number of rows + 1)
        const index = tbody.children.length;

        row.innerHTML = `
            <td>${index}</td>
            <td><input type="text" value="${ticker}" placeholder="AAPL"/></td>
            <td><input type="number" step="any" value="${price}" placeholder="150.25"/></td>
            <td><input type="number" step="any" value="${qty}" placeholder="10"/></td>
            <td>
                <button onclick="removeRow(this)" class="delete-btn">Delete</button>
            </td>
        `;

        // Add input event listeners to update textarea and check changes
        const inputs = row.querySelectorAll("input");
        inputs.forEach(input => {
            input.addEventListener("input", () => {
                // Convert ticker input to uppercase on input
                if (input.type === "text") {
                    input.value = input.value.toUpperCase();
                }
                updateExportResult();
            });
        });

        // Update textarea if the new row has valid data
        if (ticker && price && qty && parseFloat(price) >= 0 && parseFloat(qty) >= 0) {
            updateExportResult();
        }
    };

    // Remove row function
    window.removeRow = function(btn) {
        const row = btn.closest("tr");
        row.parentNode.removeChild(row);
        updateRowIndices(); // Reindex rows after deletion
        updateExportResult();
    };

    // Toggle table visibility
    window.toggleTable = function() {
        const tableWrapper = document.getElementById("tableWrapper");
        const toggleButton = document.getElementById("toggleButton");

        if (isTableVisible) {
            tableWrapper.classList.add("table-hidden");
            toggleButton.textContent = "Show";
            isTableVisible = false;
        } else {
            tableWrapper.classList.remove("table-hidden");
            toggleButton.textContent = "Hide";
            isTableVisible = true;
        }
        saveSettings(
            document.documentElement.getAttribute("data-theme") || "light",
            currentPortfolio,
            isTableVisible
        ); // Save table visibility
    };

    // Show a message to the user
    function showMessage(message, type = "success") {
        const output = document.getElementById("output");
        if (output) {
            output.textContent = message;
            output.className = type;

            setTimeout(() => {
                output.textContent = "";
                output.className = "";
            }, 3000);
        } else {
            alert(message);
        }
    }

    // Copy textarea to clipboard
    window.copyToClipboard = function() {
        const resultField = document.getElementById("exportResult");
        if (resultField && resultField.value) {
            try {
                navigator.clipboard.writeText(resultField.value)
                    .then(() => showMessage("Copied to clipboard", "success"))
                    .catch(err => {
                        console.error("Clipboard error:", err);
                        showMessage("Failed to copy to clipboard", "error");
                    });
            } catch (err) {
                console.error("Clipboard API not available:", err);
                showMessage("Clipboard API not available", "error");
            }
        } else {
            showMessage("No portfolio value to copy", "error");
        }
    };

    // Show help manual
    window.showHelpManual = function() {
        // Check if help window is already open and not closed
        if (helpWindowInstance && !helpWindowInstance.closed) {
            helpWindowInstance.focus();
            return;
        }

        const helpContent = `
            <html>
            <head>
                <title>SBC Portfo Manager Help</title>
                <style>
                    body {
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                        margin: 20px;
                        background-color: #f5f5f5;
                        color: #333;
                    }
                    h1 {
                        color: #2c3e50;
                        border-bottom: 2px solid #ecf0f1;
                        padding-bottom: 10px;
                    }
                    h2 {
                        color: #4c75af;
                        margin-top: 20px;
                    }
                    p, li {
                        line-height: 1.6;
                    }
                    ul {
                        margin: 10px 0;
                        padding-left: 20px;
                    }
                    .code {
                        background-color: #e9ecef;
                        padding: 2px 6px;
                        border-radius: 4px;
                        font-family: monospace;
                    }
                </style>
            </head>
            <body>
                <h1>SBC Portfo Manager Help</h1>
                <p>Welcome to the SBC Portfo Manager, a tool to manage multiple portfolios and their stock buy entries for the TradingView 'SBC Portfo' indicator.</p>
                
                <h2>Using the App</h2>
                <ul>
                    <li><strong>Create a Portfolio</strong>: Click "New Portfolio" to create a new portfolio (up to 5). Each portfolio can hold multiple stock entries.</li>
                    <li><strong>Switch Portfolios</strong>: Use the dropdown to switch between portfolios.</li>
                    <li><strong>Rename Portfolio</strong>: Click "Rename" to change the current portfolio's name.</li>
                    <li><strong>Delete Portfolio</strong>: Click "Delete" to remove the current portfolio (minimum one portfolio required).</li>
                    <li><strong>Add Stock Entries</strong>: Click "+ Add Row" to add a stock entry with ticker (e.g., <span class="code">AAPL</span>), buy price (e.g., <span class="code">150.25</span>), and quantity (e.g., <span class="code">10</span>). Ticker names will be converted to uppercase.</li>
                    <li><strong>Delete Rows</strong>: Click "Delete" in a row to remove it.</li>
                    <li><strong>Hide/Show Table</strong>: Click "Hide" to collapse the table and action buttons, or "Show" to show them.</li>
                    <li><strong>Save</strong>: Click "Save" to save the current portfolio to local storage and copy its value to the clipboard.</li>
                    <li><strong>Backup</strong>: Click "Backup" to save all portfolios to a <span class="code">.txt</span> file.</li>
                    <li><strong>Restore</strong>: Click "Restore" to load portfolios from a <span class="code">.txt</span> file, replacing existing portfolios (warning: this deletes current data).</li>
                    <li><strong>Clear</strong>: Click "Clear" to delete all portfolios and reset the app (warning: this is irreversible).</li>
                </ul>

                <h2>Using the Portfolio Value in TradingView</h2>
                <p>The <strong>Indicator Portfolio Value</strong> textarea shows the portfolio in the format required by the TradingView 'SBC Portfo' indicator (e.g., <span class="code">Portfolio1:QQQ:468x4;TSLA:266.72x10</span>).</p>
                <ul>
                    <li><strong>Copy the Value</strong>: Click the copy icon next to "Indicator Portfolio Value" to copy the textarea content.</li>
                    <li><strong>Open TradingView</strong>: Go to TradingView and add the 'SBC Portfo' indicator to your chart.</li>
                    <li><strong>Paste the Value</strong>: Open the indicator's settings dialog, find the portfolio input field, and paste the copied value.</li>
                    <li><strong>Apply</strong>: Save the settings to apply the portfolio to the indicator.</li>
                </ul>

                <h2>Tips</h2>
                <ul>
                    <li>Always save before exiting to avoid losing changes (a warning will appear if you try to exit with unsaved changes).</li>
                    <li>Use backups to safeguard your portfolios before restoring or clearing.</li>
                    <li>Toggle between light and dark themes using the theme switch in the top-right corner.</li>
                </ul>
            </body>
            </html>
        `;
        try {
            helpWindowInstance = window.open('', '_blank');
            if (helpWindowInstance) {
                helpWindowInstance.document.write(helpContent);
                helpWindowInstance.document.close();
                // Clear reference when window is closed
                helpWindowInstance.onunload = () => {
                    helpWindowInstance = null;
                };
            } else {
                showMessage("Failed to open help manual. Please allow pop-ups.", "error");
            }
        } catch (err) {
            console.error("Help manual error:", err);
            showMessage("Failed to display help manual", "error");
        }
    };

    // Toggle light/dark theme
    window.toggleTheme = function() {
        const html = document.documentElement;
        const checkbox = document.getElementById("themeCheckbox");
        const themeLabel = document.getElementById("themeLabel");
        const currentTheme = html.getAttribute("data-theme") || "light";
        const newTheme = currentTheme === "light" ? "dark" : "light";
        html.setAttribute("data-theme", newTheme);
        checkbox.checked = newTheme === "dark"; // Sync checkbox state
        if (themeLabel) {
            themeLabel.textContent = newTheme === "dark" ? "Light Mode" : "Dark Mode";
        }
        saveSettings(newTheme, currentPortfolio, isTableVisible); // Save theme, portfolio, and table visibility
    };

    // Update portfolio dropdown
    function updatePortfolioDropdown() {
        const select = document.getElementById("portfolioSelect");
        select.innerHTML = "";
        Object.keys(portfolios).forEach(name => {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        });
        if (currentPortfolio && portfolios[currentPortfolio]) {
            select.value = currentPortfolio;
        } else if (Object.keys(portfolios).length > 0) {
            currentPortfolio = Object.keys(portfolios)[0];
            select.value = currentPortfolio;
        }
    }

    // Create a new portfolio
    window.createPortfolio = function(name) {
        if (Object.keys(portfolios).length >= 5) {
            showMessage("Maximum of 5 portfolios allowed", "error");
            return;
        }
        // Default name if none provided
        name = name || `Portfolio${Object.keys(portfolios).length + 1}`;
        // Remove all ':' characters from the name
        name = name.replace(/:/g, '');
        // If name is empty after sanitization, append a number
        if (!name) {
            name = `Portfolio${Object.keys(portfolios).length + 1}`;
        }
        // Ensure name is unique
        if (portfolios[name]) {
            let i = 1;
            while (portfolios[`${name} ${i}`]) i++;
            name = `${name} ${i}`;
        }
        portfolios[name] = {
            name,
            data: "",
            savedData: "",
            hasUnsavedChanges: false
        };
        currentPortfolio = name;
        hasUnsavedStructuralChanges = true; // Mark structural change
        updatePortfolioDropdown();
        parseImportedData("");
        saveSettings(
            document.documentElement.getAttribute("data-theme") || "light",
            currentPortfolio,
            isTableVisible
        ); // Save new portfolio and table visibility
        showMessage(`Portfolio ${name} created`, "success");
    };

    // Switch to a portfolio
    window.switchPortfolio = function(name) {
        if (portfolios[name]) {
            currentPortfolio = name;
            parseImportedData(portfolios[name].data);
            updatePortfolioDropdown();
            saveSettings(
                document.documentElement.getAttribute("data-theme") || "light",
                currentPortfolio,
                isTableVisible
            ); // Save selected portfolio and table visibility
        }
    };

    // Rename current portfolio
    window.renamePortfolio = function() {
        if (!currentPortfolio) return;
        const newName = prompt("Enter new portfolio name:", currentPortfolio);
        if (newName !== null) {
            // Remove all ':' characters from the new name
            let sanitizedName = newName.replace(/:/g, '');
            if (!sanitizedName) {
                showMessage("Portfolio name cannot be empty or consist only of colons", "error");
                return;
            }
            if (sanitizedName !== currentPortfolio && !portfolios[sanitizedName]) {
                portfolios[sanitizedName] = { ...portfolios[currentPortfolio], name: sanitizedName, hasUnsavedChanges: true };
                delete portfolios[currentPortfolio];
                currentPortfolio = sanitizedName;
                hasUnsavedStructuralChanges = true; // Mark structural change
                updatePortfolioDropdown();
                updateExportResult();
                saveSettings(
                    document.documentElement.getAttribute("data-theme") || "light",
                    currentPortfolio,
                    isTableVisible
                ); // Save renamed portfolio and table visibility
                showMessage(`Portfolio renamed to ${sanitizedName}`, "success");
            } else if (sanitizedName === currentPortfolio) {
                showMessage("Portfolio name unchanged", "error");
            } else if (portfolios[sanitizedName]) {
                showMessage("Portfolio name already exists", "error");
            }
        }
    };

    // Delete current portfolio
    window.deletePortfolio = function() {
        if (!currentPortfolio) return;
        if (Object.keys(portfolios).length <= 1) {
            showMessage("Cannot delete the last portfolio", "error");
            return;
        }
        if (confirm(`Delete portfolio ${currentPortfolio}?`)) {
            delete portfolios[currentPortfolio];
            currentPortfolio = Object.keys(portfolios)[0];
            hasUnsavedStructuralChanges = true; // Mark structural change
            updatePortfolioDropdown();
            parseImportedData(portfolios[currentPortfolio].data);
            saveSettings(
                document.documentElement.getAttribute("data-theme") || "light",
                currentPortfolio,
                isTableVisible
            ); // Save new current portfolio and table visibility
            showMessage("Portfolio deleted", "success");
        }
    };

    // Save data to storage
    function saveToStorage() {
        const saveData = Object.entries(portfolios)
            .map(([name, p]) => `${name}:${p.data}`)
            .filter(line => line.split(':')[1]) // Exclude empty portfolios
            .join('\n');
        Neutralino.storage.setData('portfolio_data', saveData)
            .then(() => {
                console.log('Data saved to storage');
                Object.values(portfolios).forEach(p => {
                    p.savedData = p.data;
                    p.hasUnsavedChanges = false;
                });
                hasUnsavedStructuralChanges = false; // Reset structural changes
                showMessage("Saved to local storage");
            })
            .catch(err => {
                console.error('Storage save error:', err);
                showMessage("Failed to save to local storage", "error");
            });
    }

    // Save current portfolio
    window.saveValues = function() {
        const tbody = getTableBody();
        if (!tbody || !currentPortfolio) {
            showMessage("Table or portfolio not found!", "error");
            return;
        }

        updateExportResult();
        const resultField = document.getElementById("exportResult");
        if (resultField) {
            resultField.select();
            try {
                navigator.clipboard.writeText(resultField.value)
                    .then(() => showMessage("Copied to clipboard and saved to storage"))
                    .catch(err => {
                        console.error("Clipboard error", err);
                        showMessage("Clipboard error, but still saved to storage", "error");
                    });
            } catch (err) {
                console.error("Clipboard API not available:", err);
                showMessage("Clipboard API not available", "error");
            }
        }

        saveToStorage();
    };

    // Backup portfolios to a file
    window.backupPortfolios = function() {
        const saveData = Object.entries(portfolios)
            .map(([name, p]) => `${name}:${p.data}`)
            .filter(line => line.split(':')[1]) // Exclude empty portfolios
            .join('\n');
        Neutralino.os.showSaveDialog('Save Portfolio Backup', {
            defaultPath: 'portfolios.txt',
            filters: [{ name: "Text Files", extensions: ["txt"] }]
        })
        .then(result => {
            if (result) {
                Neutralino.filesystem.writeFile(result, saveData)
                    .then(() => showMessage("Backup saved successfully", "success"))
                    .catch(err => {
                        console.error("Backup save error:", err.message);
                        showMessage("Failed to save backup: " + err.message, "error");
                    });
            } else {
                showMessage("Backup canceled", "error");
            }
        })
        .catch(err => {
            console.error("Save dialog error:", err.message);
            showMessage("Failed to open save dialog: " + err.message, "error");
        });
    };

    // Restore portfolios from a file
    window.restorePortfolios = function() {
        Neutralino.os.showMessageBox(
            'Confirm Restore',
            'This action cannot be undone and will delete all current portfolios and stocks. Are you sure you want to proceed?',
            'YES_NO',
            'WARNING'
        )
        .then(result => {
            if (result === 'YES') {
                Neutralino.os.showOpenDialog('Select Portfolio Backup File', {
                    filters: [{ name: "Text Files", extensions: ["txt"] }]
                })
                .then(result => {
                    if (Array.isArray(result) && result.length > 0 && result[0]) {
                        const filePath = result[0];
                        Neutralino.filesystem.readFile(filePath)
                            .then(fileContent => {
                                try {
                                    const lines = fileContent.split('\n').filter(line => line.trim());
                                    portfolios = {};
                                    lines.forEach(line => {
                                        const [name, ...dataParts] = line.split(':');
                                        let data = dataParts.join(':');
                                        // Sanitize portfolio name
                                        const sanitizedName = name.replace(/:/g, '');
                                        // Convert tickers to uppercase in data
                                        if (data) {
                                            data = data.split(';').map(entry => {
                                                const [ticker, priceQtys] = entry.split(':');
                                                if (ticker && priceQtys) {
                                                    return `${ticker.toUpperCase()}:${priceQtys}`;
                                                }
                                                return entry;
                                            }).join(';');
                                        }
                                        if (sanitizedName && data && Object.keys(portfolios).length < 5) {
                                            portfolios[sanitizedName] = {
                                                name: sanitizedName,
                                                data,
                                                savedData: data,
                                                hasUnsavedChanges: false
                                            };
                                        }
                                    });
                                    if (Object.keys(portfolios).length === 0) {
                                        createPortfolio();
                                    }
                                    currentPortfolio = Object.keys(portfolios)[0];
                                    updatePortfolioDropdown();
                                    parseImportedData(portfolios[currentPortfolio].data);
                                    saveToStorage();
                                    saveSettings(
                                        document.documentElement.getAttribute("data-theme") || "light",
                                        currentPortfolio,
                                        isTableVisible
                                    ); // Save new current portfolio and table visibility
                                    showMessage("Portfolios restored successfully", "success");
                                } catch (err) {
                                    console.error("Restore processing error:", err.message);
                                    showMessage("Error processing backup file: " + err.message, "error");
                                }
                            })
                            .catch(err => {
                                console.error("File read error:", err.message);
                                showMessage("Failed to read backup file: " + err.message, "error");
                            });
                    } else {
                        showMessage("No file selected", "error");
                    }
                })
                .catch(err => {
                    console.error("File dialog error:", err.message);
                    showMessage("Failed to open file dialog: " + err.message, "error");
                });
            }
        })
        .catch(err => {
            console.error("Message box error:", err.message);
            showMessage("Failed to show confirmation dialog", "error");
        });
    };

    // Load data from storage on startup
    window.loadFromStorage = function() {
        Neutralino.storage.getData('portfolio_data')
            .then(data => {
                portfolios = {};
                const lines = data.split('\n').filter(line => line.trim());
                lines.forEach(line => {
                    const [name, ...dataParts] = line.split(':');
                    let data = dataParts.join(':');
                    // Sanitize portfolio name
                    const sanitizedName = name.replace(/:/g, '');
                    // Convert tickers to uppercase in data
                    if (data) {
                        data = data.split(';').map(entry => {
                            const [ticker, priceQtys] = entry.split(':');
                            if (ticker && priceQtys) {
                                return `${ticker.toUpperCase()}:${priceQtys}`;
                            }
                            return entry;
                        }).join(';');
                    }
                    if (sanitizedName && data && Object.keys(portfolios).length < 5) {
                        portfolios[sanitizedName] = {
                            name: sanitizedName,
                            data,
                            savedData: data,
                            hasUnsavedChanges: false
                        };
                    }
                });
                if (Object.keys(portfolios).length === 0) {
                    createPortfolio();
                }
                // Portfolio selection is handled in loadSettings callback
                updatePortfolioDropdown();
                parseImportedData(portfolios[currentPortfolio].data);
                showMessage("Data loaded from storage");
            })
            .catch(err => {
                console.error("Load error:", err);
                showMessage("No saved data found", "error");
                createPortfolio();
                updatePortfolioDropdown();
                parseImportedData("");
            });
    };

    // Parse imported data
    function parseImportedData(data) {
        const tbody = getTableBody();
        tbody.innerHTML = '';

        const resultField = document.getElementById("exportResult");
        if (resultField && currentPortfolio) {
            resultField.value = data ? `${currentPortfolio}:${data}` : '';
        }

        try {
            if (!data || data.trim() === '') {
                addRow();
                return;
            }

            const tickerEntries = data.split(';').filter(entry => entry.trim());
            tickerEntries.forEach(entry => {
                const [ticker, priceQtys] = entry.split(':');
                if (ticker && priceQtys) {
                    const entries = priceQtys.split(',').filter(pq => pq.trim());
                    entries.forEach(priceQty => {
                        const [price, qty] = priceQty.split('x');
                        if (price && qty) {
                            addRow(ticker.toUpperCase(), price.trim(), qty.trim()); // Convert ticker to uppercase
                        }
                    });
                }
            });

            if (tickerEntries.length === 0) {
                addRow();
            }
        } catch (err) {
            console.error("Parse error:", err);
            showMessage("Error parsing imported data", "error");
            addRow();
        }

        updateExportResult();
        updateRowIndices(); // Ensure indices are set after parsing
    }

    // Clear storage and reset app state
    window.clearStorage = function() {
        Neutralino.os.showMessageBox(
            'Confirm Clear Storage',
            'This action cannot be undone and will delete all current portfolios and stocks. Are you sure you want to proceed?',
            'YES_NO',
            'WARNING'
        )
        .then(result => {
            if (result === 'YES') {
                Neutralino.storage.setData('portfolio_data', '')
                    .then(() => {
                        portfolios = {};
                        createPortfolio();
                        updatePortfolioDropdown();
                        parseImportedData("");
                        hasUnsavedStructuralChanges = false; // Reset structural changes
                        saveSettings(
                            document.documentElement.getAttribute("data-theme") || "light",
                            currentPortfolio,
                            isTableVisible
                        ); // Save new portfolio and table visibility
                        showMessage("Storage cleared");
                    })
                    .catch(err => {
                        console.error("Clear storage error:", err);
                        showMessage("Failed to clear storage", "error");
                    });
            }
        })
        .catch(err => {
            console.error("Message box error:", err.message);
            showMessage("Failed to show confirmation dialog", "error");
        });
    };

    // Handle window close with unsaved changes validation
    function onWindowClose() {
        if (hasUnsavedStructuralChanges || Object.values(portfolios).some(p => p.hasUnsavedChanges)) {
            Neutralino.os.showMessageBox(
                'Unsaved Changes',
                'You have unsaved changes in one or more portfolios. Are you sure you want to exit without saving?',
                'YES_NO',
                'WARNING'
            )
            .then(result => {
                if (result === 'YES') {
                    Neutralino.app.exit();
                } else if (result === 'NO') {
                    saveToStorage();
                    Neutralino.app.exit();
                }
            })
            .catch(err => {
                console.error("Message box error:", err.message);
                Neutralino.app.exit();
            });
        } else {
            Neutralino.app.exit();
        }
    }

    function setTray() {
        if (NL_MODE != "window") {
            console.log("INFO: Tray menu is only available in the window mode.");
            return;
        }

        let tray = {
            icon: "/resources/icons/trayIcon.png",
            menuItems: [
                {id: "VERSION", text: "Get version"},
                {id: "SEP", text: "-"},
                {id: "QUIT", text: "Quit"}
            ]
        };

        Neutralino.os.setTray(tray);
    }

    function onTrayMenuItemClicked(event) {
        switch(event.detail.id) {
            case "VERSION":
                Neutralino.os.showMessageBox("Version information",
                    `Neutralinojs server: v${NL_VERSION} | Neutralinojs client: v${NL_CVERSION}`);
                break;
            case "QUIT":
                onWindowClose();
                break;
        }
    }

    Neutralino.init();
    Neutralino.events.on("trayMenuItemClicked", onTrayMenuItemClicked);
    Neutralino.events.on("windowClose", onWindowClose);

    if (NL_OS != "Darwin") {
        setTray();
    }

    // Load saved settings and initialize app
    loadSettings((theme, lastPortfolio, tableVisible) => {
        document.documentElement.setAttribute("data-theme", theme);
        const checkbox = document.getElementById("themeCheckbox");
        const themeLabel = document.getElementById("themeLabel");
        if (checkbox) {
            checkbox.checked = theme === "dark";
        }
        if (themeLabel) {
            themeLabel.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
        }
        isTableVisible = tableVisible;
        const tableWrapper = document.getElementById("tableWrapper");
        const toggleButton = document.getElementById("toggleButton");
        if (tableWrapper && toggleButton) {
            if (isTableVisible) {
                tableWrapper.classList.remove("table-hidden");
                toggleButton.textContent = "Hide";
            } else {
                tableWrapper.classList.add("table-hidden");
                toggleButton.textContent = "Show";
            }
        }
        // Load portfolio data and select last portfolio
        Neutralino.storage.getData('portfolio_data')
            .then(data => {
                portfolios = {};
                const lines = data.split('\n').filter(line => line.trim());
                lines.forEach(line => {
                    const [name, ...dataParts] = line.split(':');
                    let data = dataParts.join(':');
                    // Sanitize portfolio name
                    const sanitizedName = name.replace(/:/g, '');
                    // Convert tickers to uppercase in data
                    if (data) {
                        data = data.split(';').map(entry => {
                            const [ticker, priceQtys] = entry.split(':');
                            if (ticker && priceQtys) {
                                return `${ticker.toUpperCase()}:${priceQtys}`;
                            }
                            return entry;
                        }).join(';');
                    }
                    if (sanitizedName && data && Object.keys(portfolios).length < 5) {
                        portfolios[sanitizedName] = {
                            name: sanitizedName,
                            data,
                            savedData: data,
                            hasUnsavedChanges: false
                        };
                    }
                });
                if (Object.keys(portfolios).length === 0) {
                    createPortfolio();
                }
                // Select last portfolio if it exists, otherwise first or new
                currentPortfolio = lastPortfolio && portfolios[lastPortfolio] ? lastPortfolio : Object.keys(portfolios)[0];
                updatePortfolioDropdown();
                parseImportedData(portfolios[currentPortfolio].data);
                showMessage("Data loaded from storage");
            })
            .catch(err => {
                console.error("Load error:", err);
                showMessage("No saved data found", "error");
                createPortfolio();
                updatePortfolioDropdown();
                parseImportedData("");
            });
    });
};