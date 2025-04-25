# AI Model Pricing Comparator V0

A simple web-based tool to compare the pricing and context windows of various Generative AI models.

## Features

*   **Model Comparison:** Select multiple AI models to compare their input/output pricing and context window size.
*   **Provider Grouping:** Models are grouped by provider (OpenAI, Google, Anthropic, Meta, etc.) in the selection panel.
*   **Collapsible Selection:** Providers are listed in collapsible dropdowns for a cleaner interface.
*   **Visual Logos:** Provider logos are displayed next to model names for easy identification.
*   **Multiple Views:** Compare models using either a detailed **Table View** or a visual **Bar Chart View**.
*   **Responsive Chart:** The bar chart scrolls horizontally to accommodate many selected models.
*   **Off-Canvas Selection:** Model selection panel slides in via a hamburger menu, keeping the main interface clean.
*   **Easy Reset:** A "Clear" button allows for quick page refresh to reset selections.
*   **Customizable Data:** Model data is stored in a separate `models.js` file for straightforward updates.
*   **Fixed Footer:** Attribution footer pinned to the bottom.
*   **Favicon:** Custom icon for the browser tab.

## Setup & Installation

This is a pure front-end application built with HTML, CSS, and vanilla JavaScript (using Chart.js via CDN). No build steps are required.

1.  **Clone or Download:** Get the project files (`index.html`, `style.css`, `models.js`, `script.js`, `README.md`, `.gitignore`, and the `img/` folder).
2.  **Logo Images:** Ensure you have the necessary provider logo images (e.g., `openai.png`, `google.png`, etc.) placed inside the `img/logos/` directory. Make sure the filenames match those specified in the `logo` property within the `models.js` file.
3.  **Favicon:** Ensure you have a `favicon.png` (or your chosen format/name) inside the `img/favicon/` directory and that the `<link>` tag in `index.html` points to it correctly.
4.  **Open:** Open the `index.html` file directly in your web browser.

## Usage

1.  Click the hamburger icon (☰) in the top-left corner to open the "Select Models" panel.
2.  Click on a provider's name (e.g., "OpenAI") to expand the list of models for that provider.
3.  Check the boxes next to the models you want to compare.
4.  Close the panel by clicking the 'X' button or the overlay outside the panel.
5.  The main comparison area will update automatically.
6.  Use the "Table" and "Bar Chart" buttons to switch between comparison views.
7.  If viewing the bar chart with many models selected, you can scroll horizontally within the chart area.
8.  Click the "Clear" button (next to the view toggles) to refresh the page and reset all selections.

## Data Updates

To update model pricing, context windows, logos, or add/remove models:

1.  Edit the `modelsData` array within the **`models.js`** file.
2.  Update the `lastUpdated` variable in **`models.js`** to reflect the date of your changes.
3.  If adding new logos, place the image files in the `img/logos/` directory and reference the correct filename in `models.js`.

## Attribution

Maintained with ❤️ by Adithya D M
