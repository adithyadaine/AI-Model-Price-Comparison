# AI Model Pricing Comparator V3

A modern, responsive web tool to compare the pricing and context windows of various Generative AI models. The application features a clean, dynamic, and interactive interface that pulls all model data from a simple `models.csv` file for easy maintenance.

## V3 Features: Interactivity & Persistence

Version 3 transforms the comparator into a powerful, interactive, and shareable tool.

*   **Shareable URLs:** Selections are now encoded directly into the URL. You can configure a specific comparison and share the link with colleagues, who will see the exact same view.
*   **Persistent Selections:** The tool uses `localStorage` to remember your selections. If you refresh the page or close the tab, your previously compared models will be waiting for you when you return.
*   **Interactive Table Sorting:** Instantly find the best model for your needs by clicking on any table header (Model Name, Price, Context Window) to sort the data.
*   **Live Search Filter:** A search bar has been added to the selection panel, allowing you to instantly filter the list of models as you type.

## Key Features

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
    *   **Clear per Provider:** An "X" button appears on hover next to each provider's name, allowing you to clear selections for just that group.
*   **Dynamic Timestamp:** The "Last updated" time is dynamically generated and formatted for readability.
*   **Fully Responsive:** The layout is optimized for both desktop and mobile devices.

## Setup & Installation

This is a pure front-end application built with HTML, CSS, and vanilla JavaScript. No build steps are required.

1.  **Clone or Download:** Get all project files (`index.html`, `style.css`, `script.js`, `models.csv`, `README.md`, and the `img/` folder).
2.  **CSV Data File:** Ensure the `models.csv` file is present in the root directory.
3.  **Logo Images:** Place provider logo images (e.g., `openai.png`) inside the `img/logos/` directory. The script automatically derives filenames from the "Vendor" column in the CSV.
4.  **Favicon:** Ensure your favicon is located in the `img/favicon/` directory.
5.  **Open:** Open the `index.html` file directly in your web browser.

## Usage

1.  Click the hamburger icon (☰) to open the "Select Models" panel.
2.  **Find models** by scrolling or using the **search bar** at the top of the panel.
3.  Check the boxes next to the models you want to compare. The main view updates automatically.
4.  In the **Table View**, click on column headers like "Input Price" or "Context Window" to **sort the data**.
5.  Use the "Table" and "Bar Chart" buttons to switch between views.
6.  To **share your comparison**, simply copy the URL from your address bar.
7.  Click the **"Clear"** button in the main view or **"Clear & Collapse Selections"** in the panel to reset all selections.

## Data Updates

To add, remove, or modify models:

1.  Open the **`models.csv`** file in any spreadsheet or text editor.
2.  Modify or add rows, following the existing column structure:
    *   `Vendor`
    *   `Model`
    *   `Context (tokens)`
    *   `Input Price ($/1M tokens)`
    *   `Output Price ($/1M tokens)`
    *   `Status`
3.  If you add a new vendor, ensure a corresponding logo (e.g., `newvendor.png`) is placed in the `img/logos/` directory.
4.  Save the `models.csv` file. The application will reflect the new data on the next load.

## Attribution

Maintained with ❤️ by Adithya D M