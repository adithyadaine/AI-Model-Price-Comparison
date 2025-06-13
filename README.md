# AI Model Pricing Comparator

A modern, responsive web tool to compare the pricing, context windows, and capabilities of various Generative AI models. The application features a clean, dynamic, and interactive interface designed for both casual users and power users who need deep filtering and customization.

All model data is pulled from a simple `models.csv` file, making maintenance and updates incredibly easy.

## What's New: Efficiency Frontier Scatter Plot

The latest version introduces a powerful new analytical view to help users find the most cost-effective models.

*   **Efficiency Frontier View:** A new "Price vs. Context" scatter plot helps you instantly identify models that offer the largest context window for the lowest price.
*   **Logarithmic Scale:** The chart uses a logarithmic scale for the context window, making it easy to compare models across a vast range of context sizes (from thousands to millions of tokens).
*   **Charts Dropdown:** The main view now features a "Charts" dropdown, allowing you to switch between the classic "Price Comparison (Bar)" chart and the new "Price vs. Context (Scatter)" plot.

## Key Features

### Core Functionality

*   **CSV Data Source:** Model data is loaded from `models.csv`, making updates simple and code-free.
*   **Multiple Comparison Views:** Switch seamlessly between a detailed **Table View**, a visual **Bar Chart**, and the new **Scatter Plot**.
*   **Shareable URLs:** Selections are encoded directly into the URL. Configure a specific comparison and share the link with colleagues, who will see the exact same view.
*   **Persistent Selections:** The tool uses `localStorage` to remember your model selections and UI preferences between sessions.

### UI & UX Enhancements

*   **Modern Interface:** A complete UI overhaul with a fixed header and footer for persistent navigation.
*   **Off-Canvas Selection Panel:** The model selection list slides in from the side, keeping the main comparison area uncluttered.
*   **Dynamic Timestamp:** The "Last updated" time is dynamically generated and formatted for readability.
*   **Fully Responsive:** The layout is optimized for both desktop and mobile devices.

### Interaction & Filtering

*   **Interactive Table Sorting:** Instantly find the best model for your needs by clicking on any table header (Model Name, Price, etc.) to sort the data.
*   **Live Search Filter:** A search bar in the selection panel allows you to instantly filter the list of models as you type.
*   **Advanced Panel Controls:** Use panel buttons to "Select All" models, "Expand All" provider lists, or "Clear & Collapse" all selections with a single click.
*   **Quick Filters:** Use the colored buttons in the panel to quickly select all models with a specific capability (e.g., Vision, Function Calling).

## Setup & Installation

This is a pure front-end application built with HTML, CSS, and vanilla JavaScript. No build steps are required.

1.  **Clone or Download:** Get all project files (`index.html`, `style.css`, `script.js`, `models.csv`, `README.md`, and the `img/` folder).
2.  **CSV Data File:** Ensure the `models.csv` file is present in the root directory.
3.  **Logo Images:** Place provider logo images (e.g., `openai.png`) inside the `img/logos/` directory. The script automatically derives filenames from the "Vendor" column in the CSV.
4.  **Favicon:** Ensure your favicon is located in the `img/favicon/` directory.
5.  **Open:** Open the `index.html` file directly in your web browser.

## Usage

1.  Click the hamburger icon (☰) to open the **"Select Models"** panel.
2.  Select models using the checkboxes or the quick-filter buttons.
3.  Use the **"Filter" dropdown** in the main view to toggle the "Capabilities" column or apply price filters.
4.  Switch between **"Table"** and the **"Charts"** dropdown to select your desired view.
5.  In the Table View, click column headers to **sort the data**.
6.  To share your comparison, simply **copy the URL** from your address bar.

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
    *   `Capabilities` (comma-separated, e.g., "Vision, Function Calling")
3.  If you add a new vendor, ensure a corresponding logo (e.g., `newvendor.png`) is placed in the `img/logos/` directory.
4.  Save the `models.csv` file. The application will reflect the new data on the next load.

## Attribution

Maintained with ❤️ by Adithya D M