// --- State ---
let currentView = "table"; // 'table', 'bar'
let priceChartInstance = null; // To hold the chart instance

// --- DOM Elements ---
const modelSelectionList = document.getElementById("model-selection-list");
const comparisonTableBody = document.getElementById("comparison-table-body");
const lastUpdatedDateSpan = document.getElementById("last-updated-date");
const viewTitle = document.getElementById("view-title");

// View Containers
const tableView = document.getElementById("table-view");
const barChartView = document.getElementById("bar-chart-view");

// View Toggles
const tableViewBtn = document.getElementById("tableViewBtn");
const barChartViewBtn = document.getElementById("barChartViewBtn");
const refreshPageBtn = document.getElementById("refreshPageBtn");

// Chart Elements
const priceChartCanvas = document.getElementById("priceChart");
const barChartMessage = document.getElementById("bar-chart-message");
const barChartCanvasContainer = document.querySelector(
  ".chart-canvas-container"
);

// Panel/Overlay/Button References
const hamburgerBtn = document.getElementById("hamburgerBtn");
const selectionPanel = document.getElementById("selectionPanel");
const closePanelBtn = document.getElementById("closePanelBtn");
const overlay = document.getElementById("overlay");

// --- Functions ---

// Panel Toggle Functions
function openPanel() {
  if (selectionPanel && hamburgerBtn) {
    document.body.classList.add("panel-open");
    selectionPanel.setAttribute("aria-hidden", "false");
    hamburgerBtn.setAttribute("aria-expanded", "true");
  }
}

function closePanel() {
  if (selectionPanel && hamburgerBtn) {
    document.body.classList.remove("panel-open");
    selectionPanel.setAttribute("aria-hidden", "true");
    hamburgerBtn.setAttribute("aria-expanded", "false");
  }
}

/**
 * Formats large numbers into k (thousands) or M (millions) notation.
 * @param {number} num - The number to format.
 * @returns {string} - The formatted string.
 */
function formatNumber(num) {
  if (num === null || num === undefined) return "N/A";
  if (num >= 1000000) {
    return (num / 1000000).toFixed(num % 1000000 !== 0 ? 1 : 0) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(num % 1000 !== 0 ? 1 : 0) + "k";
  }
  return num.toString();
}

/**
 * Groups models by provider for display.
 * Assumes 'modelsData' is available globally from models.js
 * @param {Array} models - The array of model objects.
 * @returns {Object} - An object where keys are providers and values are arrays of models.
 */
function groupModelsByProvider(models) {
  if (typeof modelsData === "undefined") {
    console.error(
      "modelsData is not loaded. Ensure models.js is included before script.js."
    );
    return {};
  }
  return models.reduce((acc, model) => {
    const provider = model.provider || "Other";
    if (!acc[provider]) {
      acc[provider] = [];
    }
    acc[provider].push(model);
    return acc;
  }, {});
}

/**
 * Populates the model selection list in the UI with provider dropdowns.
 * Assumes 'modelsData' is available globally from models.js
 */
function populateModelSelection() {
    if (!modelSelectionList) {
        console.error("modelSelectionList element not found.");
        return;
    }
    if (typeof modelsData === "undefined") {
      modelSelectionList.innerHTML = "<p>Error: Model data not loaded.</p>";
      return;
    }
  
    modelSelectionList.innerHTML = "";
    const groupedModels = groupModelsByProvider(modelsData);
  
    const sortedProviders = Object.keys(groupedModels).sort((a, b) => {
      if (a === "Other") return 1;
      if (b === "Other") return -1;
      return a.localeCompare(b);
    });
  
    for (const provider of sortedProviders) {
      const groupDiv = document.createElement("div");
      groupDiv.className = "model-group";
  
      const providerTitle = document.createElement("h3");
      providerTitle.className = "provider-title";
      providerTitle.textContent = provider;
      providerTitle.setAttribute("aria-expanded", "false");
  
      const modelListDiv = document.createElement("div");
      modelListDiv.className = "model-list";
      modelListDiv.id = `provider-list-${provider.replace(/\s+/g, "-")}`;
      providerTitle.setAttribute("aria-controls", modelListDiv.id);
  
      providerTitle.addEventListener("click", () => {
        const isExpanded = groupDiv.classList.toggle("expanded");
        providerTitle.setAttribute("aria-expanded", isExpanded);
      });
  
      const sortedModels = groupedModels[provider].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
  
      sortedModels.forEach((model) => {
        const div = document.createElement("div");
        div.className = "model-item"; // Flex container for checkbox + label
  
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `model-${model.id}`;
        checkbox.value = model.id;
        checkbox.addEventListener("change", updateDisplay);
  
        const label = document.createElement("label");
        label.htmlFor = `model-${model.id}`;
        // Label itself will be a flex container for logo + text span
  
        // Add Logo Image
        if (model.logo) {
            const logoImg = document.createElement("img");
            logoImg.src = `img/logos/${model.logo}`;
            logoImg.alt = `${model.provider} logo`;
            logoImg.className = "model-logo"; // Style for logo
            logoImg.loading = "lazy";
            label.appendChild(logoImg); // Add logo to label
        }
  
        // **** WRAP TEXT IN A SPAN ****
        const nameSpan = document.createElement("span");
        nameSpan.className = "model-name-text"; // Style for text block
        nameSpan.textContent = model.name;
        label.appendChild(nameSpan); // Add text span to label
        // **** END TEXT WRAP ****
  
        div.appendChild(checkbox); // Checkbox is first item in .model-item
        div.appendChild(label); // Label (containing logo+span) is second item
        modelListDiv.appendChild(div);
      });
  
      groupDiv.appendChild(providerTitle);
      groupDiv.appendChild(modelListDiv);
      modelSelectionList.appendChild(groupDiv);
    }
  }
  
  // --- Keep all other functions in script.js the same ---
  
/**
 * Updates the comparison table view.
 * @param {Array} selectedModelsData - Array of selected model objects.
 */
function updateTableView(selectedModelsData) {
  // Ensure table body exists
  if (!comparisonTableBody) return;

  comparisonTableBody.innerHTML = "";

  if (!selectedModelsData || selectedModelsData.length === 0) {
    comparisonTableBody.innerHTML = `<tr><td colspan="5">Select models to compare.</td></tr>`;
    return;
  }

  // Sorting happens in updateDisplay before calling this

  selectedModelsData.forEach((model) => {
    const row = document.createElement("tr");
    const formatPrice = (price) =>
      price !== null && price !== undefined ? `$${price.toFixed(2)}` : "N/A";

    row.innerHTML = `
            <td>${model.name}</td>
            <td>${model.provider}</td>
            <td>${formatPrice(model.inputPrice)}</td>
            <td>${formatPrice(model.outputPrice)}</td>
            <td>${model.contextWindow || "N/A"}</td>
        `;
    comparisonTableBody.appendChild(row);
  });
}

/**
 * Renders the bar chart view with horizontal scrolling.
 * @param {Array} selectedModelsData - Array of selected model objects.
 */
function renderBarChart(selectedModelsData) {
    // Ensure essential elements exist
    if (!priceChartCanvas || !barChartCanvasContainer || !barChartMessage) {
        console.error("Chart rendering failed: Missing required canvas elements.");
        return;
    }

    // Clear previous chart instance
    if (priceChartInstance) {
        priceChartInstance.destroy();
        priceChartInstance = null;
    }

    // Clear message and reset container width/canvas display
    barChartMessage.textContent = "";
    priceChartCanvas.style.display = "block"; // Ensure canvas itself is displayed
    barChartCanvasContainer.style.minWidth = "0px"; // Reset min-width

    // Handle no data case
    if (!selectedModelsData || selectedModelsData.length === 0) {
        barChartMessage.textContent = "Select models to display chart.";
        priceChartCanvas.style.display = "none"; // Hide canvas if no data
        return;
    }

    // Sorting happens in updateDisplay before calling this

    // Calculate minimum width for horizontal scrolling
    const minBarWidthPerModel = 80;
    const chartPadding = 100;
    const calculatedMinWidth = selectedModelsData.length * minBarWidthPerModel + chartPadding;
    barChartCanvasContainer.style.minWidth = `${calculatedMinWidth}px`;

    // Prepare data for Chart.js
    const labels = selectedModelsData.map((model) => model.name);
    const inputPrices = selectedModelsData.map((model) => model.inputPrice ?? 0); // Use 0 for null/undefined
    const outputPrices = selectedModelsData.map((model) => model.outputPrice ?? 0); // Use 0 for null/undefined

    const data = {
        labels: labels,
        datasets: [
            {
                label: "Input Price ($/1M tokens)",
                data: inputPrices,
                backgroundColor: "rgba(54, 162, 235, 0.6)", // Blue
                borderColor: "rgba(54, 162, 235, 1)",
                borderWidth: 1,
            },
            {
                label: "Output Price ($/1M tokens)",
                data: outputPrices,
                backgroundColor: "rgba(255, 99, 132, 0.6)", // Red
                borderColor: "rgba(255, 99, 132, 1)",
                borderWidth: 1,
            },
        ],
    };

    // Chart configuration
    const config = {
        type: "bar",
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: "x",
            plugins: {
                title: {
                    display: true,
                    text: "Model Pricing Comparison ($/1M Tokens)",
                    padding: { top: 10, bottom: 20 },
                    font: { size: 14 },
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || "";
                            if (label) label += ": ";
                            const modelIndex = context.dataIndex;
                            // Check if selectedModelsData exists and index is valid
                            if (!selectedModelsData || modelIndex >= selectedModelsData.length) {
                                return label + "Error";
                            }
                            const model = selectedModelsData[modelIndex];
                            if (!model) return label + "Error";

                            const originalValue = context.dataset.label.toLowerCase().startsWith("input")
                                ? model.inputPrice
                                : model.outputPrice;

                            if (originalValue !== null && originalValue !== undefined) {
                                label += `$${context.parsed.y.toFixed(2)}`;
                            } else {
                                label += "N/A";
                            }
                            return label;
                        },
                    },
                },
                legend: { position: "top" },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: "Price ($/1M tokens)" },
                    ticks: { callback: (value) => "$" + value.toFixed(2) },
                },
                x: {
                    title: { display: true, text: "Model" },
                },
            },
        },
    };

    // Get context and create chart
    const ctx = priceChartCanvas.getContext("2d");
    if (ctx) {
        try { // Add try-catch for Chart.js specific errors
            priceChartInstance = new Chart(ctx, config);
        } catch (error) {
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
 * Switches the active view (Table, Bar Chart)
 * @param {string} view - The view to switch to ('table', 'bar').
 */
function switchView(view) {
  // Ensure buttons exist before toggling
  if (tableViewBtn) tableViewBtn.classList.toggle("active", view === "table");
  if (barChartViewBtn) barChartViewBtn.classList.toggle("active", view === "bar");

  // Ensure view containers exist
  if (tableView) tableView.classList.toggle("active", view === "table");
  if (barChartView) barChartView.classList.toggle("active", view === "bar");

  // Update title
  if (viewTitle) {
      switch (view) {
          case "bar": viewTitle.textContent = "Bar Chart"; break;
          case "table": default: viewTitle.textContent = "Table"; break;
      }
  }

  // Set current view state *before* updating display
  currentView = view;
  // Update the content of the newly activated view
  updateDisplay();
}

/**
 * Main function to update the currently active view based on selected models.
 * Assumes 'modelsData' is available globally from models.js
 */
function updateDisplay() {
  if (typeof modelsData === "undefined") {
    console.error("Cannot update display: modelsData not loaded.");
    if (comparisonTableBody) comparisonTableBody.innerHTML = `<tr><td colspan="5">Error: Model data not loaded.</td></tr>`;
    if (barChartMessage) barChartMessage.textContent = "Error: Model data not loaded.";
    if (priceChartInstance) priceChartInstance.destroy();
    if (priceChartCanvas) priceChartCanvas.style.display = "none";
    return;
  }

  // Ensure the selection list exists before querying it
  if (!modelSelectionList) {
      console.error("Cannot update display: modelSelectionList not found.");
      return;
  }

  const selectedModelIds = Array.from(
    modelSelectionList.querySelectorAll('input[type="checkbox"]:checked')
  ).map((checkbox) => checkbox.value);

  let selectedModelsData = modelsData.filter((model) =>
    selectedModelIds.includes(model.id)
  );

  // Sort the data *once* here before passing to view functions
  selectedModelsData.sort((a, b) => a.name.localeCompare(b.name));

  // Call the appropriate update function based on the current view
  switch (currentView) {
    case "bar":
      renderBarChart(selectedModelsData);
      break;
    case "table":
    default:
      updateTableView(selectedModelsData);
      break;
  }
}

/**
 * Updates the "Last Updated" date in the UI.
 * Assumes 'lastUpdated' is available globally from models.js
 */
function setLastUpdatedDate() {
  if (typeof lastUpdated !== "undefined" && lastUpdatedDateSpan) {
    lastUpdatedDateSpan.textContent = lastUpdated;
  } else if (lastUpdatedDateSpan) {
    lastUpdatedDateSpan.textContent = "Error: Date not loaded";
    console.error(
      "lastUpdated variable not found. Ensure models.js is loaded first."
    );
  }
}

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  // Check if essential elements and data are loaded
  if (
      typeof modelsData !== 'undefined' &&
      typeof lastUpdated !== 'undefined' &&
      modelSelectionList && // Check if main list container exists
      comparisonTableBody && // Check if table body exists
      priceChartCanvas // Check if canvas exists
     )
  {
    populateModelSelection();
    setLastUpdatedDate();

    // Add event listeners only if buttons exist
    if (tableViewBtn) tableViewBtn.addEventListener("click", () => switchView("table"));
    if (barChartViewBtn) barChartViewBtn.addEventListener("click", () => switchView("bar"));
    if (refreshPageBtn) refreshPageBtn.addEventListener("click", () => location.reload());
    if (hamburgerBtn) hamburgerBtn.addEventListener("click", openPanel);
    if (closePanelBtn) closePanelBtn.addEventListener("click", closePanel);
    if (overlay) overlay.addEventListener("click", closePanel);

    // Set initial view
    switchView(currentView);
  } else {
    // Handle critical loading error
    console.error(
      "Initialization failed: Essential data or DOM elements might be missing. Check HTML structure and ensure models.js loads before script.js."
    );
    // Display user-friendly errors if possible
    if (!modelSelectionList) document.body.innerHTML = "<h1>Error: Application structure incomplete.</h1>";
    else modelSelectionList.innerHTML = "<p>Error loading model data. Check console.</p>";

    if (comparisonTableBody) comparisonTableBody.innerHTML = `<tr><td colspan="5">Error loading application.</td></tr>`;
    if (lastUpdatedDateSpan) lastUpdatedDateSpan.textContent = "Error";
  }
});
