# LLM Ledger - AI Model Pricing & Specs

A modern, responsive dashboard for comparing the pricing, capabilities, and performance of Generative AI models. LLM Ledger pulls real-time data from industry-leading APIs to provide a "no-hype" single source of truth for developers and businesses.

## Key Features

### 🚀 Real-Time Data Intelligence
*   **Live API Integration:** Fetches up-to-the-minute model pricing, context windows, and specifications directly from **OpenRouter**.
*   **Performance Benchmarks:** Integrates "Intelligence Index" and "Speed" metrics from **Artificial Analysis** to go beyond just price.
*   **Status Monitoring:** Real-time health checks for critical APIs (OpenRouter, HuggingFace, Artificial Analysis) built directly into the UI.

### 📊 Dynamic Visualizations
Three powerful charting views to analyze the landscape:
*   **Pricing Bar Chart:** Compare Input vs. Output costs ($/1M tokens) side-by-side. Featuring custom X-axis with provider logos.
*   **Efficiency Scatter Plot:** Visual "Price vs. Context" analysis to identify models that offer the most value (tokens per dollar).
*   **Release Timeline:** A scrolling history of model releases to visualize the pace of innovation.

### 💻 Modern UI/UX
*   **Dark Mode:** Fully themed dark/light mode toggle with persistent preferences.
*   **Interactive Sidebar:**
    *   "Select Models" offcanvas panel for easy filtering.
    *   Live search with instant suggestions and provider logo previews.
    *   "Explore Models" navigation for quick access.
*   **Responsive Design:** Mobile-ready layout with offcanvas menus and adaptive chart sizing.
*   **Provider Deep Dives:** Detailed profile cards for top providers (OpenAI, Anthropic, Google, etc.) with aggregated model statistics.

## Tech Stack

*   **Core:** Vanilla JavaScript (ES6+ Modules) for lightweight, build-free performance.
*   **Styling:** Bootstrap 5.3 + Custom CSS variables.
*   **Icons:** Bootstrap Icons.
*   **Visualization:** Chart.js 4.x with `date-fns` adapter for time-series data.
*   **Data Transport:** `fetch` API using CORS proxies (`corsproxy.io`) for seamless client-side data retrieval.

## Setup & Usage

This is a pure front-end application. No complex build steps (Webpack, Vite, etc.) are strictly required, though a local server is recommended.

### 1. Installation
Clone the repository:
```bash
git clone https://github.com/yourusername/ai-model-comparison.git
cd ai-model-comparison
```

### 2. Configuration (Optional)
To enable advanced benchmark data, add your Artificial Analysis API key:
1.  Open `js/config.js`.
2.  Set your key: `ARTIFICIAL_ANALYSIS_API_KEY: "your_key_here"`.
*(Note: Basic pricing and specs work without this key).*

### 3. Running Locally
For the best experience (to avoid local file CORS restrictions), use a static local server.
*   **VS Code:** Use the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension.
*   **Node:** `npx serve .`

### 4. Deployment
This project is optimized for **GitHub Pages**.
1.  Push the code to a GitHub repository.
2.  Go to **Settings** > **Pages**.
3.  Select the `main` branch and click **Save**.
4.  Your site will be live instantly at `https://yourusername.github.io/ai-model-comparison/`.

## Attribution

*   **Data Sources:** [OpenRouter](https://openrouter.ai), [Artificial Analysis](https://artificialanalysis.ai), [HuggingFace](https://huggingface.co).
*   **Icons:** [Bootstrap Icons](https://icons.getbootstrap.com/).
*   **Logos:** Provider logos fetched dynamically via Google Favicon API or hosted locally.

---
*Maintained with ❤️ by Adithya D M*