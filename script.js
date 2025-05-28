// --- Global State ---
// These variables store the application's current state and data.

// `currentView`: A string that keeps track of whether the user is viewing the 'table' or 'bar' chart.
let currentView = "table";
// `priceChartInstance`: Holds the Chart.js object for the bar chart.
// It's used to destroy the old chart before drawing a new one.
let priceChartInstance = null;
// `modelsData`: An array that will store all the AI model objects after being loaded and parsed from models.csv.
// This is the primary source of data for the application.
let modelsData = [];

// --- DOM Elements ---
// These constants store references to HTML elements on the page.
// This is done once when the script loads for efficiency, so we don't have to query the DOM repeatedly.

// Elements for model selection and display
const modelSelectionList = document.getElementById("model-selection-list"); // The <div> where model checkboxes will be added.
const comparisonTableBody = document.getElementById("comparison-table-body"); // The <tbody> of the comparison table.
const viewTitle = document.getElementById("view-title"); // The <span> that shows "Table" or "Bar Chart" in the main heading.

// Containers for different views
const tableView = document.getElementById("table-view"); // The <div> containing the table.
const barChartView = document.getElementById("bar-chart-view"); // The <div> containing the bar chart.

// Buttons for view toggling and actions
const tableViewBtn = document.getElementById("tableViewBtn"); // Button to switch to table view.
const barChartViewBtn = document.getElementById("barChartViewBtn"); // Button to switch to bar chart view.
const refreshPageBtn = document.getElementById("refreshPageBtn"); // Button to clear selections (by refreshing the page).
const selectAllBtn = document.getElementById("selectAllBtn"); // Button to select all models.

// Elements related to the bar chart
const priceChartCanvas = document.getElementById("priceChart"); // The <canvas> element for Chart.js.
const barChartMessage = document.getElementById("bar-chart-message"); // <p> tag to show messages for the bar chart (e.g., "Select models...").
const barChartCanvasContainer = document.querySelector(".chart-canvas-container"); // Inner <div> that wraps the canvas, used for sizing.

// Elements for the off-canvas selection panel (hamburger menu)
const hamburgerBtn = document.getElementById("hamburgerBtn"); // The hamburger icon button.
const selectionPanel = document.getElementById("selectionPanel"); // The <aside> panel itself.
const closePanelBtn = document.getElementById("closePanelBtn"); // The 'X' button inside the panel.
const overlay = document.getElementById("overlay"); // The dim overlay shown when the panel is open.

// --- Helper Functions ---

/**
 * Formats a raw number string (from CSV) into a more readable string with "k" (thousands) or "M" (millions).
 * Example: "128000" becomes "128k", "1000000" becomes "1M".
 * @param {string} numStr - The number string to format (e.g., context window size).
 * @returns {string} - The formatted string or "N/A" if input is invalid.
 */
function formatNumber(numStr) {
    // Handle null, undefined, or empty strings by returning "N/A"
    if (numStr === null || numStr === undefined || numStr.trim() === "") return "N/A";
    // Convert the string to an integer
    const num = parseInt(numStr, 10);
    // If parsing fails (e.g., text instead of number), return "N/A"
    if (isNaN(num)) return "N/A";

    // Format for millions
    if (num >= 1000000) return (num / 1000000).toFixed(num % 1000000 !== 0 ? 1 : 0) + "M";
    // Format for thousands
    if (num >= 1000) return (num / 1000).toFixed(num % 1000 !== 0 ? 1 : 0) + "k";
    // Return as string if less than 1000
    return num.toString();
}

/**
 * Derives a standardized logo filename from a provider/vendor name.
 * Example: "OpenAI" becomes "openai.png", "xAI (Grok)" becomes "xaigrok.png".
 * @param {string} vendorName - The name of the vendor/provider.
 * @returns {string} - The derived logo filename (e.g., "openai.png"). Defaults to "other.png".
 */
function getLogoFilename(vendorName) {
    if (!vendorName) return "other.png"; // Default if no vendor name
    return vendorName.toLowerCase()          // Convert to lowercase
        .replace(/\s+/g, '')             // Remove all spaces
        .replace(/\(.*\)/g, '')          // Remove content in parentheses (e.g., "(Grok)")
        .replace(/[^a-z0-9]/gi, '') + '.png'; // Remove non-alphanumeric characters and add .png
}

// --- CSV Processing Functions ---

/**
 * Parses raw CSV text into an array of structured model objects.
 * This function is crucial for converting the flat CSV data into a format
 * the rest of the application can easily use.
 * @param {string} csvText - The raw string content of the CSV file.
 * @returns {Array} - An array of model objects. Each object represents a row from the CSV.
 */
function parseCSV(csvText) {
    console.log("Starting CSV Parse (Direct Header Match, Robust Price Handling)...");
    // Split the CSV text into lines, handling both Windows (\r\n) and Unix (\n) line endings.
    const lines = csvText.trim().split(/\r\n|\n/);
    // A CSV needs at least a header row and one data row.
    if (lines.length < 2) {
        console.warn("CSV has too few lines (header + data expected).");
        return [];
    }

    // The first line is assumed to be the header. Trim whitespace and split by comma.
    const headers = lines[0].trim().split(',').map(header => header.trim());
    console.log("CSV Headers:", headers);

    // Get the index (column number) for each expected header. This makes parsing robust to column order.
    const vendorIdx = headers.indexOf('Vendor');
    const modelIdx = headers.indexOf('Model');
    const contextIdx = headers.indexOf('Context (tokens)');
    const inputPriceIdx = headers.indexOf('Input Price ($/1M tokens)');
    const outputPriceIdx = headers.indexOf('Output Price ($/1M tokens)');
    const statusIdx = headers.indexOf('Status');

    // Check if all required headers were found.
    if ([vendorIdx, modelIdx, contextIdx, inputPriceIdx, outputPriceIdx, statusIdx].some(idx => idx === -1)) {
        console.error("One or more required CSV headers are missing. Check your models.csv file headers.");
        console.error("Expected headers: 'Vendor', 'Model', 'Context (tokens)', 'Input Price ($/1M tokens)', 'Output Price ($/1M tokens)', 'Status'");
        return []; // Stop parsing if headers are incorrect.
    }

    // Get all lines except the header line.
    const dataRows = lines.slice(1);
    const parsedData = []; // Array to store the parsed model objects.

    dataRows.forEach((line, rowIndex) => {
        if (line.trim() === "") return; // Skip empty lines in the CSV.

        // Split each data line by comma and trim whitespace from each value.
        const values = line.trim().split(',').map(value => value.trim());
        // Check if the number of values matches the number of headers.
        if (values.length !== headers.length) {
            console.warn(`Row ${rowIndex + 1} (0-indexed) has incorrect number of columns. Expected ${headers.length}, got ${values.length}. Line: "${line}"`);
            return; // Skip this malformed row.
        }

        const modelName = values[modelIdx];
        if (!modelName) { // Every model must have a name.
            console.warn(`Model name missing at row ${rowIndex + 1}. Skipping.`);
            return;
        }

        // Helper function to parse price strings from the CSV.
        const parsePrice = (priceValue) => {
            // If price is "Open Source", "Not Public", empty, or undefined, treat as null (N/A).
            if (priceValue === "Open Source" || priceValue === "Not Public" || priceValue === "" || priceValue === undefined) return null;
            // Convert the string to a floating-point number.
            const num = parseFloat(priceValue);
            // If conversion fails (e.g., text in price column), return null.
            return isNaN(num) ? null : num;
        };

        // Create a structured object for the current model.
        const modelObject = {
            provider: values[vendorIdx],
            name: modelName,
            // Generate a simple, URL-friendly ID from the model name. Used for checkbox values.
            id: modelName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/gi, ''),
            contextWindow: formatNumber(values[contextIdx]), // Format the context window number.
            inputPrice: parsePrice(values[inputPriceIdx]),   // Parse and convert input price.
            outputPrice: parsePrice(values[outputPriceIdx]), // Parse and convert output price.
            status: values[statusIdx],                       // Get the status.
            logo: getLogoFilename(values[vendorIdx])         // Derive the logo filename.
        };
        
        // Specific handling for "Grok 1" if "0" in CSV means N/A for price.
        // If "0" is a valid price for Grok 1 (meaning free), this block should be removed.
        if (modelObject.name === "Grok 1") {
            if (modelObject.inputPrice === 0) modelObject.inputPrice = null;
            if (modelObject.outputPrice === 0) modelObject.outputPrice = null;
        }

        // Ensure an ID was successfully generated. This is critical for selection.
        if (!modelObject.id) {
             console.warn(`Model at row ${rowIndex + 1} resulted in an empty ID. Name: "${modelName}"`);
             return; // Skip if ID generation failed.
        }
        parsedData.push(modelObject); // Add the processed model object to our data array.
    });
    console.log("CSV Parsed Data (first 5):", parsedData.slice(0, 5)); // Log a sample for debugging.
    return parsedData;
}

/**
 * Asynchronously fetches the models.csv file and then parses it.
 * This is the entry point for getting model data into the application.
 * @returns {Promise<Array>} - A promise that resolves to the array of model data, or an empty array on error.
 */
async function loadModelsData() {
    console.log("Loading models.csv...");
    try {
        // Fetch the CSV file. 'models.csv' is expected to be in the same directory as index.html.
        const response = await fetch('models.csv');
        // Check if the fetch request was successful (HTTP status 200-299).
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        // Get the text content of the CSV file.
        const csvText = await response.text();
        console.log("Fetched models.csv. Length:", csvText.length);
        // Parse the CSV text into structured data.
        return parseCSV(csvText);
    } catch (error) {
        // Log errors and display a message to the user if fetching/parsing fails.
        console.error("Failed to load/parse models.csv:", error);
        if (modelSelectionList) modelSelectionList.innerHTML = `<p>Error loading model data: ${error.message}.</p>`;
        if (comparisonTableBody) comparisonTableBody.innerHTML = `<tr><td colspan="5">Error loading model data.</td></tr>`;
        return []; // Return an empty array so the app doesn't completely break.
    }
}

// --- UI and Logic Functions ---

/**
 * Opens the off-canvas selection panel.
 * It adds a class to the body to trigger CSS for the panel and overlay.
 * Updates ARIA attributes for accessibility.
 */
function openPanel() {
  if (selectionPanel && hamburgerBtn) { // Ensure elements exist
    document.body.classList.add("panel-open");
    selectionPanel.setAttribute("aria-hidden", "false");
    hamburgerBtn.setAttribute("aria-expanded", "true");
  }
}

/**
 * Closes the off-canvas selection panel.
 * Removes the class from the body.
 * Updates ARIA attributes.
 */
function closePanel() {
  if (selectionPanel && hamburgerBtn) { // Ensure elements exist
    document.body.classList.remove("panel-open");
    selectionPanel.setAttribute("aria-hidden", "true");
    hamburgerBtn.setAttribute("aria-expanded", "false");
  }
}

/**
 * Groups the flat array of model objects by their 'provider' property.
 * This is used to create the collapsible sections in the selection panel.
 * @param {Array} models - The flat array of model objects (global modelsData).
 * @returns {Object} - An object where keys are provider names and values are arrays of models for that provider.
 */
function groupModelsByProvider(models) {
    if (!models || models.length === 0) return {}; // Handle empty input
    return models.reduce((acc, model) => {
        const provider = model.provider || "Other"; // Default to "Other" if provider is missing
        if (!acc[provider]) acc[provider] = []; // Initialize array for new provider
        acc[provider].push(model);
        return acc;
    }, {});
}

/**
 * Dynamically populates the model selection panel with checkboxes.
 * It uses the globally loaded `modelsData`.
 * Creates provider groups, dropdowns, logos, and checkboxes.
 */
function populateModelSelection() {
    console.log("Populating model selection...");
    if (!modelSelectionList) { console.error("populateModelSelection: modelSelectionList not found."); return; }
    if (!modelsData || modelsData.length === 0) {
        modelSelectionList.innerHTML = "<p>No model data available.</p>";
        console.warn("populateModelSelection: modelsData is empty."); return;
    }
    modelSelectionList.innerHTML = ""; // Clear any existing content (like "Loading models...")
    const groupedModels = groupModelsByProvider(modelsData); // Group data by provider

    // Sort provider names alphabetically for consistent display
    const sortedProviders = Object.keys(groupedModels).sort((a, b) => {
        if (a === "Other") return 1; if (b === "Other") return -1; // Keep "Other" at the end
        return a.localeCompare(b);
    });

    // Create UI for each provider group
    for (const provider of sortedProviders) {
        const groupDiv = document.createElement("div"); groupDiv.className = "model-group";
        const providerTitle = document.createElement("h3"); providerTitle.className = "provider-title";
        providerTitle.textContent = provider; providerTitle.setAttribute("aria-expanded", "false");
        
        const modelListDiv = document.createElement("div"); modelListDiv.className = "model-list";
        modelListDiv.id = `provider-list-${provider.replace(/\s+/g, "-")}`; // Unique ID for ARIA
        providerTitle.setAttribute("aria-controls", modelListDiv.id);

        // Event listener for expanding/collapsing provider model list
        providerTitle.addEventListener("click", () => {
            const isExpanded = groupDiv.classList.toggle("expanded");
            providerTitle.setAttribute("aria-expanded", isExpanded);
        });

        // Sort models within each provider group alphabetically
        const sortedModels = groupedModels[provider].sort((a, b) => a.name.localeCompare(b.name));

        // Create checkbox and label for each model
        sortedModels.forEach((model) => {
            if (!model.id) { console.warn("Skipping model due to missing ID:", model); return; } // Critical check
            const div = document.createElement("div"); div.className = "model-item";
            const checkbox = document.createElement("input"); checkbox.type = "checkbox";
            checkbox.id = `model-checkbox-${model.id}`; // Unique HTML ID for the checkbox element
            checkbox.value = model.id; // The value used to identify the model in modelsData
            checkbox.addEventListener("change", updateDisplay); // Update comparison when checked/unchecked

            const label = document.createElement("label"); label.htmlFor = `model-checkbox-${model.id}`; // Associate label with checkbox
            
            // Add logo if available
            if (model.logo) {
                const logoImg = document.createElement("img"); logoImg.src = `img/logos/${model.logo}`;
                logoImg.alt = `${model.provider || 'Provider'} logo`; logoImg.className = "model-logo";
                logoImg.loading = "lazy"; // Defer loading of off-screen images
                label.appendChild(logoImg);
            }
            // Add model name text (wrapped in a span for styling control)
            const nameSpan = document.createElement("span"); nameSpan.className = "model-name-text";
            nameSpan.textContent = model.name || "Unnamed Model"; label.appendChild(nameSpan);
            
            div.appendChild(checkbox); div.appendChild(label); modelListDiv.appendChild(div);
        });
        groupDiv.appendChild(providerTitle); groupDiv.appendChild(modelListDiv); modelSelectionList.appendChild(groupDiv);
    }
    console.log("Model selection populated.");
}

/**
 * Checks all model checkboxes in the selection panel and updates the display.
 */
function selectAllModels() {
    if (!modelSelectionList) {
        console.error("selectAllModels: modelSelectionList not found.");
        return;
    }
    const checkboxes = modelSelectionList.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true; // Set all checkboxes to checked
    });
    updateDisplay(); // Refresh the comparison views
    console.log("All models selected.");
}

/**
 * Updates the HTML table with data from the selected models.
 * @param {Array} selectedModelsData - An array of model objects that are currently selected.
 */
function updateTableView(selectedModelsData) {
    if (!comparisonTableBody) return; // Ensure table body exists
    comparisonTableBody.innerHTML = ""; // Clear previous table rows
    if (!selectedModelsData || selectedModelsData.length === 0) {
        comparisonTableBody.innerHTML = `<tr><td colspan="5">Select models to compare.</td></tr>`;
        return;
    }
    // Note: selectedModelsData is already sorted by name in updateDisplay()

    selectedModelsData.forEach((model) => {
        const row = document.createElement("tr");
        // Helper to format price, ensuring it's a number before toFixed
        const formatPrice = (price) =>
            price !== null && price !== undefined && !isNaN(price) ? `$${price.toFixed(2)}` : "N/A";
        row.innerHTML = `
            <td>${model.name || "N/A"}</td>
            <td>${model.provider || "N/A"}</td>
            <td>${formatPrice(model.inputPrice)}</td>
            <td>${formatPrice(model.outputPrice)}</td>
            <td>${model.contextWindow || "N/A"}</td>
        `;
        comparisonTableBody.appendChild(row);
    });
}

/**
 * Renders or updates the bar chart with data from the selected models.
 * Uses Chart.js library.
 * @param {Array} selectedModelsData - An array of model objects that are currently selected.
 */
function renderBarChart(selectedModelsData) {
    if (!priceChartCanvas || !barChartCanvasContainer || !barChartMessage) return; // Ensure elements exist
    if (priceChartInstance) priceChartInstance.destroy(); // Destroy old chart if it exists

    barChartMessage.textContent = "";
    priceChartCanvas.style.display = "block";
    barChartCanvasContainer.style.minWidth = "0px"; // Reset width

    if (!selectedModelsData || selectedModelsData.length === 0) {
        barChartMessage.textContent = "Select models to display chart.";
        priceChartCanvas.style.display = "none";
        return;
    }
    // Note: selectedModelsData is already sorted by name in updateDisplay()

    // Calculate minimum width for horizontal scrolling based on number of models
    const minBarWidthPerModel = 80, chartPadding = 100;
    const calculatedMinWidth = selectedModelsData.length * minBarWidthPerModel + chartPadding;
    barChartCanvasContainer.style.minWidth = `${calculatedMinWidth}px`;

    // Prepare data for Chart.js
    const labels = selectedModelsData.map((model) => model.name);
    const inputPrices = selectedModelsData.map((model) => model.inputPrice ?? 0); // Use 0 for null/undefined for charting
    const outputPrices = selectedModelsData.map((model) => model.outputPrice ?? 0);

    const data = { labels, datasets: [] };
    data.datasets = [
        { label: "Input Price ($/1M tokens)", data: inputPrices, backgroundColor: "rgba(54, 162, 235, 0.6)", borderColor: "rgba(54, 162, 235, 1)", borderWidth: 1 },
        { label: "Output Price ($/1M tokens)", data: outputPrices, backgroundColor: "rgba(255, 99, 132, 0.6)", borderColor: "rgba(255, 99, 132, 1)", borderWidth: 1 },
    ];
    
    // Chart.js configuration object
    const config = { type: "bar", data, options: {} };
    config.options = {
        responsive: true, maintainAspectRatio: false, indexAxis: "x", // Vertical bars
        plugins: {
            title: { display: true, text: "Model Pricing Comparison ($/1M Tokens)", padding: { top: 10, bottom: 20 }, font: { size: 14 } },
            tooltip: {
                callbacks: {
                    label: function (context) { // Custom tooltip to show "N/A" for null prices
                        let label = context.dataset.label || "";
                        if (label) label += ": ";
                        const modelIndex = context.dataIndex;
                        if (!selectedModelsData || modelIndex >= selectedModelsData.length) return label + "Error";
                        const model = selectedModelsData[modelIndex];
                        if (!model) return label + "Error";
                        const originalValue = context.dataset.label.toLowerCase().startsWith("input") ? model.inputPrice : model.outputPrice;
                        if (originalValue !== null && originalValue !== undefined && !isNaN(originalValue)) label += `$${context.parsed.y.toFixed(2)}`;
                        else label += "N/A";
                        return label;
                    },
                },
            },
            legend: { position: "top" },
        },
        scales: {
            y: { beginAtZero: true, title: { display: true, text: "Price ($/1M tokens)" }, ticks: { callback: (value) => "$" + value.toFixed(2) } }, // Format Y-axis as currency
            x: { title: { display: true, text: "Model" } },
        },
    };

    const ctx = priceChartCanvas.getContext("2d"); // Get canvas context
    if (ctx) {
        try { priceChartInstance = new Chart(ctx, config); } // Create new chart
        catch (error) { // Catch errors during chart initialization
            console.error("Chart.js initialization error:", error);
            barChartMessage.textContent = "Error rendering chart. Check console.";
            priceChartCanvas.style.display = "none";
        }
    } else {
        console.error("Failed to get 2D context for price chart canvas.");
        barChartMessage.textContent = "Error rendering chart context.";
        priceChartCanvas.style.display = "none";
    }
}

/**
 * Switches between the table view and bar chart view.
 * @param {string} view - The view to switch to ('table' or 'bar').
 */
function switchView(view) {
    // Toggle active class on buttons
    if (tableViewBtn) tableViewBtn.classList.toggle("active", view === "table");
    if (barChartViewBtn) barChartViewBtn.classList.toggle("active", view === "bar");
    // Toggle active class on view containers
    if (tableView) tableView.classList.toggle("active", view === "table");
    if (barChartView) barChartView.classList.toggle("active", view === "bar");
    
    // Update the title in the comparison area
    if (viewTitle) {
        switch (view) {
            case "bar": viewTitle.textContent = "Bar Chart"; break;
            case "table": default: viewTitle.textContent = "Table"; break;
        }
    }
    currentView = view; // Update global state
    updateDisplay();    // Refresh the content for the new view
}

/**
 * Central function to update the comparison display (table or chart).
 * It reads the currently selected checkboxes, filters `modelsData`, and calls
 * the appropriate rendering function (`updateTableView` or `renderBarChart`).
 */
function updateDisplay() {
    console.log("updateDisplay called. Current view:", currentView);
    if (!modelsData || modelsData.length === 0) {
        console.warn("updateDisplay: modelsData is empty or not loaded.");
        if (comparisonTableBody) comparisonTableBody.innerHTML = `<tr><td colspan="5">No model data loaded.</td></tr>`;
        if (barChartMessage) barChartMessage.textContent = "No model data loaded.";
        if (priceChartInstance) priceChartInstance.destroy();
        if (priceChartCanvas) priceChartCanvas.style.display = "none";
        return;
    }
    if (!modelSelectionList) { // Ensure selection list exists
        console.error("updateDisplay: modelSelectionList not found.");
        return;
    }

    // Get all currently checked checkboxes
    const selectedCheckboxes = modelSelectionList.querySelectorAll('input[type="checkbox"]:checked');
    // Extract their 'value' (which is the model.id)
    const selectedModelIds = Array.from(selectedCheckboxes).map((checkbox) => checkbox.value);
    console.log("Selected Model IDs from checkboxes:", selectedModelIds);

    // Filter the global modelsData to get only the selected models
    let filteredModelsData = modelsData.filter((model) => {
        return model.id && selectedModelIds.includes(model.id); // Ensure model has an ID
    });
    console.log("Filtered Models Data for display (count):", filteredModelsData.length);
    if (filteredModelsData.length > 0) {
        console.log("First filtered model:", filteredModelsData[0]); // Log sample for debugging
    }

    // Sort the filtered data by model name for consistent display order
    filteredModelsData.sort((a, b) => a.name.localeCompare(b.name));

    // Call the appropriate rendering function based on the current view
    switch (currentView) {
        case "bar": renderBarChart(filteredModelsData); break;
        case "table": default: updateTableView(filteredModelsData); break;
    }
}

// --- Initialization ---
// This function runs once the entire HTML document is fully loaded and parsed.
document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM fully loaded and parsed.");
    // Critical check for essential DOM elements needed for the app to function.
    if (!modelSelectionList || !comparisonTableBody || !priceChartCanvas) {
        console.error("Initialization failed: Essential DOM elements are missing. Check HTML structure.");
        if (document.body) document.body.innerHTML = "<h1>Error: Application structure incomplete.</h1>";
        return;
    }

    modelsData = await loadModelsData(); // Asynchronously load and parse data from models.csv
    console.log("Global modelsData count after load:", modelsData.length);
    if (modelsData.length > 0) {
        console.log("First model in global modelsData:", modelsData[0]); // Log sample for debugging
    }

    // Proceed with UI setup only if data was successfully loaded.
    if (modelsData && modelsData.length > 0) {
        populateModelSelection(); // Populate the model selection panel

        // Attach event listeners to buttons if they exist
        if (tableViewBtn) tableViewBtn.addEventListener("click", () => switchView("table"));
        if (barChartViewBtn) barChartViewBtn.addEventListener("click", () => switchView("bar"));
        if (refreshPageBtn) refreshPageBtn.addEventListener("click", () => location.reload());
        if (hamburgerBtn) hamburgerBtn.addEventListener("click", openPanel);
        if (closePanelBtn) closePanelBtn.addEventListener("click", closePanel);
        if (overlay) overlay.addEventListener("click", closePanel);
        if (selectAllBtn) {
            selectAllBtn.addEventListener("click", selectAllModels);
        } else {
            console.warn("Select All button not found in the DOM.");
        }
        
        switchView(currentView); // Set up the initial view (e.g., table)
    } else {
        // Handle case where no data was loaded (error messages already shown by loadModelsData)
        console.warn("No model data was loaded to initialize the application. Check models.csv and console for errors.");
        if (modelSelectionList) modelSelectionList.innerHTML = "<p>Failed to load model data. Please check the console for errors and ensure 'models.csv' is correctly formatted and accessible.</p>";
    }
});
// --- End of script.js ---