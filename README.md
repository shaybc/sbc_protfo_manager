# SBC Portfo Manager

SBC Portfo Manager is a lightweight, user-friendly desktop application built with Neutralinojs, designed to streamline the creation and management of stock portfolio settings for the TradingView 'SBC Portfo' indicator. This tool empowers users to efficiently organize multiple portfolios, input stock entries, and export data in the precise format required by the TradingView indicator, enhancing the workflow for traders and investors.

**Disclaimer**: SBC Portfo Manager is an independent tool and is **not** affiliated with TradingView. It is solely intended to assist users in generating compatible portfolio settings for the 'SBC Portfo' indicator.

## Purpose

The primary purpose of SBC Portfo Manager is to simplify the process of creating and managing stock portfolios for use with the TradingView 'SBC Portfo' indicator. The app allows users to:
- **Create and Organize Portfolios**: Manage up to five portfolios, each containing multiple stock entries with details such as ticker symbols, buy prices, and quantities.
- **Generate Indicator-Compatible Output**: Produce portfolio data in the exact format required by the TradingView 'SBC Portfo' indicator (e.g., `Portfolio1:QQQ:468x4;TSLA:266.72x10`).
- **Enhance Usability**: Offer a clean interface with features like light/dark theme toggling, table visibility control, and a detailed help manual to guide users.
- **Ensure Data Persistence**: Save portfolios locally, with options to back up to a text file or restore from a backup, ensuring data is never lost unintentionally.

This tool is ideal for traders who rely on the 'SBC Portfo' indicator to visualize portfolio performance on TradingView and need a reliable way to manage and format their portfolio data.

## Screenshots

the SBN_Portfo_Manager app screenshots, and some screenshots of the 'SBC_Portfo' Indicator in TradingView (TM)
* this app is not associated with nor represents TradingView

![Screenshot of SBC Portfo Manager](/img/screenshot_1.png)

![Screenshot of SBC Portfo Manager](/img/screenshot_2.png)

![Screenshot of SBC Portfo Manager](/img/screenshot_3.png)

![Screenshot of SBC Portfo Manager](/img/screenshot_4.png)

![Screenshot of SBC Portfo Manager](/img/screenshot_5.png)


## Features

- **Portfolio Management**:
  - Create, rename, and delete portfolios (up to 5).
  - Add, edit, or remove stock entries with fields for ticker (e.g., `AAPL`), buy price, and quantity.
  - Switch between portfolios seamlessly using a dropdown menu.
- **Data Export**:
  - Automatically generate portfolio values in the TradingView-compatible format.
  - Copy portfolio data to the clipboard with a single click for easy pasting into TradingView.
- **Data Management**:
  - Save portfolios to local storage for persistence across sessions.
  - Backup portfolios to a `.txt` file and restore them later.
  - Clear all data with a confirmation prompt to prevent accidental loss.
- **User Interface**:
  - Toggle between light and dark themes for comfortable viewing.
  - Show/hide the portfolio table to focus on the output.
  - Display success/error messages for user actions (e.g., saving, copying).
- **Help Manual**:
  - Access a comprehensive guide via a pop-up window, detailing app usage and TradingView integration.
- **System Tray Support** (Windows/Linux):
  - Minimize the app to the system tray with options to check the version or exit.

## Installation

1. **Download**:
   - Visit the [Releases page](https://github.com/your-repo/sbc-portfo-manager/releases) and download the latest version (e.g., `sbc-portfo-manager-v1.0.0-windows-x64.zip`).
2. **Extract**:
   - Unzip the downloaded file to a folder of your choice.
3. **Run**:
   - Double-click `sbc-portfo-manager.exe` to launch the app.
   - No additional dependencies are required (WebView2 is included in Windows 10/11).
4. **Optional**:
   - Ensure internet access for loading Font Awesome icons via CDN. For offline use, consider bundling the icons locally by modifying the app's resources.

## Usage

Follow these steps to use SBC Portfo Manager effectively:

1. **Create a Portfolio**:
   - Click the "New Portfolio" button to create a new portfolio. A default name (e.g., `Portfolio1`) is assigned, which you can rename later.
   - Use the dropdown menu to switch between portfolios.

2. **Add Stock Entries**:
   - Click "+ Add Row" to add a stock entry.
   - Enter the ticker symbol (e.g., `AAPL`), buy price (e.g., `150.25`), and quantity (e.g., `10`). Ticker symbols are automatically converted to uppercase.
   - Add multiple rows for the same ticker with different buy prices or quantities as needed.

3. **Manage Portfolios**:
   - **Rename**: Click "Rename" to change the current portfolio’s name.
   - **Delete**: Click "Delete" to remove a portfolio (requires at least one portfolio to remain).
   - **Save**: Click "Save" to store the portfolio data locally and copy it to the clipboard.
   - **Backup/Restore**: Use "Backup" to save all portfolios to a `.txt` file, or "Restore" to load portfolios from a backup (note: restoring overwrites existing data).
   - **Clear**: Click "Clear" to reset the app, deleting all portfolios (irreversible).

4. **Export to TradingView**:
   - The "Indicator Portfolio Value" field displays the portfolio data in the required format (e.g., `Portfolio1:QQQ:468x4;TSLA:266.72x10`).
   - Click the copy button next to the field to copy the data to the clipboard.
   - Open TradingView, add the 'SBC Portfo' indicator to your chart, and paste the copied value into the indicator’s portfolio input field in the settings dialog.
   - Save the settings to apply the portfolio to the indicator.

5. **Additional Features**:
   - Toggle the table visibility with the "Hide"/"Show" button to focus on the output.
   - Switch between light and dark themes using the toggle in the top-right corner.
   - Access the help manual by clicking the info icon for detailed guidance on app usage and TradingView integration.

## System Requirements

- **Operating System**: Windows 10/11 (64-bit)
- **Disk Space**: Approximately 50 MB
- **Internet**: Optional, for loading Font Awesome icons via CDN
- **Dependencies**: None (WebView2 is included in Windows)

## Known Limitations

- The app supports up to 5 portfolios to maintain performance.
- Internet access is required for Font Awesome icons unless bundled locally.
- The help manual opens in a new window, requiring pop-up permissions.
- Currently supports Windows only; macOS and Linux builds are planned for future releases.

## Contributing

Contributions are welcome! To report bugs, suggest features, or submit pull requests:
1. Visit the [GitHub repository](https://github.com/your-repo/sbc-portfo-manager).
2. Create an issue or fork the repository to contribute code.
3. Follow the contribution guidelines in the repository.

## License

This project is licensed under the [Attribution-NonCommercial 4.0 International](LICENSE).

## Acknowledgments

- **Neutralinojs**: For providing a lightweight, cross-platform framework.
- **Font Awesome**: For the icons used in the app’s interface.
- **TradingView Community**: For inspiring tools like the 'SBC Portfo' indicator.

## Contact

For support or inquiries, create an issue on the [GitHub repository](https://github.com/your-repo/sbc-portfo-manager/issues).

---
**Get Started**: Download the latest release and start managing your TradingView portfolios today!
