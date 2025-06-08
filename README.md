# AI Model Pricing Comparator V2

A modern, responsive web tool to compare the pricing and context windows of various Generative AI models. The application features a clean, dynamic interface and pulls all model data from a simple `models.csv` file for easy maintenance.

## V2 Features

### Core Functionality

*   **CSV Data Source:** Model data (pricing, context, provider) is loaded from `models.csv`, making updates simple and code-free.
*   **Dual Comparison Views:** Switch seamlessly between a detailed **Table View** and a visual **Bar Chart View**.
*   **Dynamic Charting:** The bar chart is powered by Chart.js and scrolls horizontally to cleanly accommodate any number of selected models.
*   **Visual Logos:** Provider logos are displayed throughout the UI for quick and easy identification.

### UI & UX Enhancements

*   **Modern Interface:** A complete UI overhaul with a fixed header and footer for persistent navigation.
*   **Off-Canvas Selection Panel:** The model selection list slides in from the side, keeping the main comparison area uncluttered.
*   **Advanced Panel Controls:**
    *   **Select All:** Quickly select all available models for a comprehensive overview.
    *   **Expand All:** Instantly open all provider dropdowns to see every model.
    *   **Clear & Collapse:** A single click to deselect all models and collapse all provider lists.
    *   **Clear per Provider:** A new "X" button appears on hover next to each provider's name, allowing you to clear selections for just that group.
*   **Dynamic Timestamp:** The "Last updated" time is now dynamically generated and formatted for readability (e.g., "Saturday, June 8, 2025, 12:17 AM").
*   **Fully Responsive:** The layout is optimized for both desktop and mobile devices.

## Setup & Installation

This is a pure front-end application built with HTML, CSS, and vanilla JavaScript. No build steps are required.

1.  **Clone or Download:** Get all project files (`index.html`, `style.css`, `script.js`, `models.csv`, `README.md`, and the `img/` folder).
2.  **CSV Data File:** Ensure the `models.csv` file is present in the root directory. This file is the single source of truth for all model data.
3.  **Logo Images:** Place provider logo images (e.g., `openai.png`, `google.png`) inside the `img/logos/` directory. The script automatically derives filenames from the "Vendor" column in the CSV (e.g., "OpenAI" becomes "openai.png").
4.  **Favicon:** Ensure your favicon (`innovative-brain-icon.png`) is located in the `img/favicon/` directory, as referenced in `index.html`.
5.  **Open:** Open the `index.html` file directly in your web browser.

## Usage

1.  Click the hamburger icon (☰) in the top-left corner to open the "Select Models" panel.
2.  Use the panel action buttons:
    *   Click **"Select All Models"** to check every model.
    *   Click **"Expand All Providers"** to open all dropdowns.
    *   Click **"Clear & Collapse Selections"** to reset the panel.
3.  Click on a provider's name (e.g., "OpenAI") to expand or collapse its list of models.
4.  Hover over a provider's name and click the **"×"** button that appears to clear selections for only that provider.
5.  Check or uncheck the boxes next to the individual models you want to compare.
6.  Close the panel by clicking the 'X' button or the dark overlay. The main view will update automatically.
7.  Use the "Table" and "Bar Chart" buttons to switch between comparison views.
8.  Click the "Clear" button in the main view to refresh the page and start over.

## Data Updates

To add, remove, or modify models:

1.  Open the **`models.csv`** file in any spreadsheet or text editor.
2.  Modify or add rows, following the existing column structure:
    *   `Vendor`
    *   `Model`
    *   `Context (tokens)` (e.g., `128000`)
    *   `Input Price ($/1M tokens)` (e.g., `2.5`; leave empty or use "Not Public" for N/A)
    *   `Output Price ($/1M tokens)` (same as input)
    *   `Status` (e.g., "Active", "Legacy", "Beta")
3.  If you add a new vendor, ensure a corresponding logo (e.g., `newvendor.png`) is placed in the `img/logos/` directory.
4.  Save the `models.csv` file. The application will reflect the new data the next time it is loaded.

## Attribution

Maintained with ❤️ by Adithya D M