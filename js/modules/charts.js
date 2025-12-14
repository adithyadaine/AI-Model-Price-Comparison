import { getChartColors, parseFormattedNumber, parseValueForSort, preloadLogosForChart, getPreloadedImage } from './utils.js';

let priceChartInstance = null;

// Ensure Chart is available from global scope (CDN)
const Chart = window.Chart;

if (Chart) {
  // Register Chart Plugin
  try {
    Chart.register({
      id: "customAxisRenderer",
      afterDraw(chart, args, options) {
        const { ctx } = chart;
        
        // --- Bar Chart X-Axis Renderer ---
        if (chart.config.type === "bar") {
            const pluginOpts = chart.config.options.plugins.customXAxisRenderer;
            if (!pluginOpts || !pluginOpts.selectedModels) return;
            
            const xAxis = chart.scales.x;
            const logoSize = pluginOpts.logoSize || 16;
            const textPadding = pluginOpts.textPadding || 4;
            // const font = pluginOpts.font || "10px Arial, sans-serif";
            const textColor = pluginOpts.textColor || "#444";
            const MAX_LABEL_LENGTH = 15;
    
            ctx.save();
            ctx.font = "10px Inter, -apple-system, BlinkMacSystemFont, sans-serif"; // hardcode standard font
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
    
            pluginOpts.selectedModels.forEach((model, index) => {
              if (index >= xAxis.ticks.length) return;
              
              // Only draw if within visible range (optimization) - simplistic check
              const xPos = xAxis.getPixelForTick(index);
              
              const logo = getPreloadedImage(model);
              
              let currentY = xAxis.bottom + 2; // slight shift down
              
              if (logo) {
                const logoX = xPos - logoSize / 2;
                ctx.drawImage(logo, logoX, currentY, logoSize, logoSize);
                currentY += logoSize + 4; // space after logo
              } else {
                 // space placeholder if wanted, or just text shift
                 currentY += logoSize + 4;
              }
              
              ctx.fillStyle = textColor;
              let displayLabel = model.name || "N/A";
              if (displayLabel.length > MAX_LABEL_LENGTH) {
                  displayLabel = displayLabel.substring(0, MAX_LABEL_LENGTH - 3) + "...";
              }
              ctx.fillText(displayLabel, xPos, currentY); 
            });
            ctx.restore();
        }
        
        // --- Timeline Chart Y-Axis Renderer ---
        if (chart.config.options.plugins.customYAxisRenderer) {
             const pluginOpts = chart.config.options.plugins.customYAxisRenderer;
             const yAxis = chart.scales.y;
             const logoSize = 20; // Slightly larger for providers
             const paddingRight = 4; // Moved closer to axis (was 8)
             
             // Map provider name to a representative model for logo lookup
             const providerModelMap = pluginOpts.providerModelMap || {};
             
             ctx.save();
             
             // Iterate through y-axis ticks (which are provider names)
             yAxis.ticks.forEach((tick, index) => {
                 const providerName = yAxis.getLabelForValue(tick.value);
                 const yPos = yAxis.getPixelForTick(index);
                 // X position: to the left of the axis line. 
                 // We need to find where the label *would* be. 
                 // Chart.js fits labels in the "left" area. 
                 // We'll draw the logo to the left of the text, or just replace the text if we wanted (but we want both).
                 // Simpler approach: Draw logo just to the left of the Y-axis line, and ensure padding is sufficient.
                 
                 const xPos = yAxis.right - paddingRight; // Align right side of logo to axis
                 
                 // Find a model for this provider to get the logo
                 const representativeModel = providerModelMap[providerName];
                 const logo = getPreloadedImage(representativeModel);
                 
                 if (logo) {
                     // Draw logo centered vertically on the tick
                     ctx.drawImage(logo, xPos - logoSize, yPos - logoSize/2, logoSize, logoSize);
                 }
             });
             
             ctx.restore();
        }
      },
    });
  } catch (e) {
    console.warn("Chart plugin registration failed or already registered", e);
  }
}

export async function renderBarChart(selectedModelsData) {
  if (!window.Chart) {
      console.error("Chart.js not loaded");
      return;
  }
  const priceChartCanvas = document.getElementById("priceChartCanvas");
  const barChartCanvasContainer = document.getElementById("barChartCanvasContainer");
  const barChartMessage = document.getElementById("barChartMessage");

  if (!priceChartCanvas || !barChartCanvasContainer || !barChartMessage) return;
  if (priceChartInstance) priceChartInstance.destroy();
  barChartMessage.textContent = "";
  priceChartCanvas.style.display = "block";
  barChartCanvasContainer.style.minWidth = "0px";

  if (!selectedModelsData || selectedModelsData.length === 0) {
    barChartMessage.textContent = "Select models to display chart.";
    priceChartCanvas.style.display = "none";
    return;
  }

  await preloadLogosForChart(selectedModelsData);

  const minBarWidthPerModel = 100;
  const chartPadding = 100;
  const calculatedMinWidth = selectedModelsData.length * minBarWidthPerModel + chartPadding;
  barChartCanvasContainer.style.minWidth = `${calculatedMinWidth}px`;

  const labels = selectedModelsData.map((model) => model.name);
  const inputPrices = selectedModelsData.map((model) => model.inputPrice ?? null);
  const outputPrices = selectedModelsData.map((model) => model.outputPrice ?? null);
  const data = { labels, datasets: [
    { label: "Input Price ($/1M)", data: inputPrices, backgroundColor: "rgba(54, 162, 235, 0.6)", borderColor: "rgba(54, 162, 235, 1)", borderWidth: 1, minBarLength: 5 },
    { label: "Output Price ($/1M)", data: outputPrices, backgroundColor: "rgba(255, 99, 132, 0.6)", borderColor: "rgba(255, 99, 132, 1)", borderWidth: 1, minBarLength: 5 },
  ]};

  const logoSize = 16;
  const textPadding = 4;
  const xAxisItemHeight = logoSize + textPadding + 12 + 5;
  
  const colors = getChartColors();

  const config = {
    type: "bar",
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "x",
      interaction: {
        mode: 'index',
        intersect: false,
      },
      layout: { padding: { bottom: xAxisItemHeight } },
      plugins: {
        title: { display: true, text: "Model Pricing Comparison ($/1M)", padding: { top: 10, bottom: 20 }, font: { size: 14 }, color: colors.textColor },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";
              if (label) label += ": ";
              if (context.raw === null || context.raw === undefined) return label + "N/A";
              const model = selectedModelsData[context.dataIndex];
              if (!model) return label + "N/A";
              const originalValue = context.dataset.label.toLowerCase().startsWith("input") ? model.inputPrice : model.outputPrice;
              if (originalValue !== null && originalValue !== undefined && !isNaN(originalValue)) label += `$${context.parsed.y.toFixed(2)}`;
              else label += "N/A";
              return label;
            },
          },
        },
        legend: { position: "top", labels: { color: colors.textColor } },
        customXAxisRenderer: { selectedModels: selectedModelsData, logoSize, textPadding, textColor: colors.textColor },
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "Price ($/1M)", color: colors.textColor }, ticks: { callback: (value) => "$" + value.toFixed(2), color: colors.textColor }, grid: { color: colors.gridColor }, min: 0 },
        x: { 
            barPercentage: 0.5, 
            categoryPercentage: 0.7, 
            // Hide standard labels so we can draw our own
            ticks: { display: false }, 
            grid: { color: colors.gridColor, drawTicks: false } 
        },
      },
    },
  };
  const ctx = priceChartCanvas.getContext("2d");
  if (ctx) {
    try { priceChartInstance = new window.Chart(ctx, config); } catch (e) { console.error(e); }
  }
}

export async function renderScatterChart(selectedModelsData) {
  if (!window.Chart) return;
  const priceChartCanvas = document.getElementById("priceChartCanvas");
  const barChartCanvasContainer = document.getElementById("barChartCanvasContainer");
  const barChartMessage = document.getElementById("barChartMessage");

  if (!priceChartCanvas || !barChartCanvasContainer || !barChartMessage) return;
  if (priceChartInstance) priceChartInstance.destroy();
  barChartMessage.textContent = "";
  priceChartCanvas.style.display = "block";
  const validModels = selectedModelsData.filter(m => m.inputPrice !== null && m.contextWindow && parseFormattedNumber(m.contextWindow));

  const minWidthPerPoint = 12; 
  const chartPadding = 100;
  const calculatedMinWidth = validModels.length * minWidthPerPoint + chartPadding;
  barChartCanvasContainer.style.minWidth = `${calculatedMinWidth}px`;

  if (validModels.length === 0) {
    barChartMessage.textContent = "Select models with price and context window data to display scatter plot.";
    priceChartCanvas.style.display = "none";
    return;
  }

  const scatterData = validModels.map(model => ({ x: parseFormattedNumber(model.contextWindow), y: model.inputPrice, model }));

  const colors = getChartColors();

  const config = {
    type: "scatter",
    data: {
      datasets: [{ label: "Models", data: scatterData, backgroundColor: "rgba(0, 123, 255, 0.6)", pointRadius: 5, pointHoverRadius: 8 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: "Price vs. Context Window", font: { size: 14 }, color: colors.textColor },
        legend: { display: false },
        tooltip: {
          mode: "nearest",
          intersect: true,
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          callbacks: {
            label: function (context) {
              const model = context.raw.model;
              return [`${model.name}`, `Context: ${model.contextWindow}`, `Input Price: $${model.inputPrice.toFixed(2)} / 1M`];
            },
          },
        },
      },
      scales: {
        x: { type: "logarithmic", title: { display: true, text: "Context Window (Tokens) - Logarithmic Scale", color: colors.textColor }, ticks: { callback: v => v >= 1e6 ? `${v/1e6}M` : (v >= 1e3 ? `${v/1e3}k` : v), color: colors.textColor }, grid: { color: colors.gridColor } },
        y: { type: "linear", beginAtZero: true, title: { display: true, text: "Input Price ($/1M)", color: colors.textColor }, ticks: { callback: v => `$${v.toFixed(2)}`, color: colors.textColor }, min: 0, grid: { color: colors.gridColor } },
      },
    },
  };
  const ctx = priceChartCanvas.getContext("2d");
  if (ctx) priceChartInstance = new window.Chart(ctx, config);
}

export async function renderTimelineChart(selectedModelsData) {
  if (!window.Chart) return;
  const priceChartCanvas = document.getElementById("priceChartCanvas");
  const barChartCanvasContainer = document.getElementById("barChartCanvasContainer");
  const barChartMessage = document.getElementById("barChartMessage");

  if (!priceChartCanvas || !barChartCanvasContainer || !barChartMessage) return;
  if (priceChartInstance) priceChartInstance.destroy();
  barChartMessage.textContent = "";
  priceChartCanvas.style.display = "block";
  barChartCanvasContainer.style.minWidth = "0px";

  const validModels = selectedModelsData.filter(m => m.releaseDate && parseValueForSort(m.releaseDate, "date").getTime() > 0);

  if (validModels.length === 0) {
    barChartMessage.textContent = "Select models with release dates to display timeline.";
    priceChartCanvas.style.display = "none";
    return;
  }

  // Preload logos for unique providers
  const providerModelMap = {};
  validModels.forEach(m => {
      // Prioritize keeping a model with a logoUrl if possible
      if (!providerModelMap[m.provider] || (!providerModelMap[m.provider].logoUrl && m.logoUrl)) {
          providerModelMap[m.provider] = m;
      }
  });
  
  await preloadLogosForChart(Object.values(providerModelMap));

  const providers = [...new Set(validModels.map(m => m.provider))].sort();
  
  const timelineData = validModels.map(model => ({
    x: parseValueForSort(model.releaseDate, "date"),
    y: model.provider,
    model
  }));
  
  const colors = getChartColors();

  const ctx = priceChartCanvas.getContext("2d");
  if (!ctx) return;

  const config = {
    type: "scatter",
    data: {
      datasets: [{
        label: "Models",
        data: timelineData,
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        pointRadius: 6,
        pointHoverRadius: 9
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
          // padding: { left: 0 } 
      },
      plugins: {
        title: { display: true, text: "Model Release Timeline", font: { size: 14 }, color: colors.textColor },
        legend: { display: false },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          callbacks: {
            label: function(context) {
              const model = context.raw.model;
              return `${model.name} (${model.releaseDate})`;
            }
          }
        },
        customYAxisRenderer: { providerModelMap }
      },
      scales: {
        x: {
          type: "time",
          time: { unit: "month" },
          title: { display: true, text: "Release Date", color: colors.textColor },
          ticks: { color: colors.textColor },
          grid: { color: colors.gridColor }
        },
        y: {
          type: "category",
          labels: providers,
          // title: { display: true, text: "Provider", color: colors.textColor },
          offset: true,
          ticks: { color: colors.textColor, padding: 18}, // Space for logo (20px) + padding
          grid: { color: colors.gridColor }
        }
      }
    }
  };

  priceChartInstance = new window.Chart(ctx, config);
}
