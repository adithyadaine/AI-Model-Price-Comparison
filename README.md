# AI Model Pricing Comparator V1

A simple web-based tool to compare the pricing and context windows of various Generative AI models, with data managed via a CSV file.

## V1 Features

*   **CSV Data Source:** Model data (pricing, context, provider, logo reference) is loaded from `models.csv` for easier updates.
*   **Model Comparison:** Select multiple AI models to compare their input/output pricing and context window size.
*   **Provider Grouping:** Models are grouped by provider in the selection panel.
*   **Collapsible Selection:** Providers are listed in collapsible dropdowns for a cleaner interface.
*   **Visual Logos:** Provider logos are displayed next to model names for easy identification.
*   **"Select All" Functionality:** A button within the selection panel to quickly select all available models.
*   **Multiple Views:** Compare models using either a detailed **Table View** or a visual **Bar Chart View**.
*   **Responsive Chart:** The bar chart scrolls horizontally to accommodate many selected models.
*   **Off-Canvas Selection:** Model selection panel slides in via a hamburger menu, keeping the main interface clean.
*   **Easy Reset:** A "Clear" button (page refresh) allows for quick resetting of selections and views.
*   **Fixed Footer:** Attribution footer pinned to the bottom.
*   **Favicon:** Custom icon for the browser tab.

## Setup & Installation

This is a pure front-end application built with HTML, CSS, and vanilla JavaScript (using Chart.js via CDN). No build steps are required.

1.  **Clone or Download:** Get the project files (`index.html`, `style.css`, `script.js`, `models.csv`, `README.md`, `.gitignore`, and the `img/` folder).
2.  **CSV Data File:** Ensure the `models.csv` file is present in the root directory of the project. This file contains all the model data.
3.  **Logo Images:** Ensure you have the necessary provider logo images (e.g., `openai.png`, `google.png`, etc.) placed inside the `img/logos/` directory. The `script.js` file attempts to derive logo filenames based on the "Vendor" name in the CSV (e.g., "OpenAI" becomes "openai.png"). Adjust filenames or the `getLogoFilename` function in `script.js` if needed.
4.  **Favicon:** Ensure you have a `favicon.png` (or your chosen format/name) inside the `img/` directory and that the `<link>` tag in `index.html` points to it correctly.
5.  **Open:** Open the `index.html` file directly in your web browser.

## Usage

1.  Click the hamburger icon (☰) in the top-left corner to open the "Select Models" panel.
2.  Optionally, click the "Select All Models" button to check all available models.
3.  Click on a provider's name (e.g., "OpenAI") to expand the list of models for that provider.
4.  Check or uncheck the boxes next to the models you want to compare.
5.  Close the panel by clicking the 'X' button or the overlay outside the panel.
6.  The main comparison area will update automatically.
7.  Use the "Table" and "Bar Chart" buttons to switch between comparison views.
8.  If viewing the bar chart with many models selected, you can scroll horizontally within the chart area.
9.  Click the "Clear" button (next to the view toggles) to refresh the page and reset all selections.

## Data Updates

To update model pricing, context windows, add/remove models, or change logos:

1.  Open the **`models.csv`** file using a spreadsheet editor (like Microsoft Excel, Google Sheets, LibreOffice Calc) or a text editor.
2.  Modify the rows or add new ones according to the existing column structure:
    *   `Vendor`
    *   `Model`
    *   `Context (tokens)` (enter as a plain number, e.g., `128000`)
    *   `Input Price ($/1M tokens)` (enter as a number, e.g., `2.5` or `0.15`; use empty for N/A, or "Open Source"/"Not Public")
    *   `Output Price ($/1M tokens)` (same as input price)
    *   `Status` (e.g., "Active", "Legacy", "Beta")
3.  The `Logo` column is not in the CSV; logo filenames are derived by `script.js` from the `Vendor` name. If you add a new vendor, ensure a corresponding logo (e.g., `newvendor.png`) is placed in the `img/logos/` directory.
4.  Save the `models.csv` file.
5.  The "Data source: models.csv" text in the UI is static. The application will reflect the new data upon the next page load/refresh.

## Attribution

Maintained with ❤️ by Adithya D M
