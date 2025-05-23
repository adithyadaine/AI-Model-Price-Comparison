// ================== OpenAI Models ==================
const openAIModels = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", inputPrice: 2.5, outputPrice: 10.0, contextWindow: "128k", logo: "openai.png" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", inputPrice: 0.15, outputPrice: 0.6, contextWindow: "128k", logo: "openai.png" },
  { id: "gpt-4.1", name: "GPT-4.1", provider: "OpenAI", inputPrice: 2.0, outputPrice: 8.0, contextWindow: "1M", logo: "openai.png" },
  { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", provider: "OpenAI", inputPrice: 0.4, outputPrice: 1.6, contextWindow: "1M", logo: "openai.png" },
  { id: "gpt-4.1-nano", name: "GPT-4.1 Nano", provider: "OpenAI", inputPrice: 0.1, outputPrice: 0.4, contextWindow: "1M", logo: "openai.png" },
  { id: "o1", name: "o1", provider: "OpenAI", inputPrice: 15.0, outputPrice: 60.0, contextWindow: "200k", logo: "openai.png" },
  { id: "o1-mini", name: "o1 Mini", provider: "OpenAI", inputPrice: 1.1, outputPrice: 4.4, contextWindow: "128k", logo: "openai.png" },
  { id: "o3-mini", name: "o3 Mini", provider: "OpenAI", inputPrice: 1.1, outputPrice: 4.4, contextWindow: "200k", logo: "openai.png" },
  { id: "o3-mini-high", name: "o3-Mini-High", provider: "OpenAI", inputPrice: 1.1, outputPrice: 4.4, contextWindow: "200k", logo: "openai.png" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "OpenAI", inputPrice: 0.5, outputPrice: 1.5, contextWindow: "16k", logo: "openai.png" },
  { id: "o4-mini-high", name: "o4-Mini-High", provider: "OpenAI", inputPrice: 1.1, outputPrice: 4.4, contextWindow: "200k", logo: "openai.png" },
  
];

// ================== Anthropic Models ==================
const anthropicModels = [
  { id: "claude-3.5-haiku", name: "Claude 3.5 Haiku", provider: "Anthropic", inputPrice: 0.8, outputPrice: 4.0, contextWindow: "200k", logo: "anthropic.png" },
  { id: "claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic", inputPrice: 3.0, outputPrice: 15.0, contextWindow: "200k", logo: "anthropic.png" },
  { id: "claude-3.7-sonnet", name: "Claude 3.7 Sonnet", provider: "Anthropic", inputPrice: 3.0, outputPrice: 15.0, contextWindow: "200k", logo: "anthropic.png" },
  { id: "claude-3.7-sonnet-thinking", name: "Claude 3.7 Sonnet Thinking", provider: "Anthropic", inputPrice: 3.0, outputPrice: 15.0, contextWindow: "200k", logo: "anthropic.png" },
  { id: "claude-3-opus", name: "Claude 3 Opus", provider: "Anthropic", inputPrice: 15.0, outputPrice: 75.0, contextWindow: "200k", logo: "anthropic.png" },
];

// ================== Google Models ==================
const googleModels = [
  { id: "gemini-2.5-pro-exp", name: "Gemini 2.5 Pro Exp.", provider: "Google", inputPrice: 1.25, outputPrice: 10.0, contextWindow: "1M", logo: "google.png" },
  { id: "gemini-2.0-pro-exp", name: "Gemini 2.0 Pro Exp.", provider: "Google", inputPrice: 1.25, outputPrice: 10.0, contextWindow: "2M", logo: "google.png" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "Google", inputPrice: 0.1, outputPrice: 0.4, contextWindow: "1M", logo: "google.png" },
  { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash-Lite", provider: "Google", inputPrice: 0.075, outputPrice: 0.3, contextWindow: "1M", logo: "google.png" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "Google", inputPrice: 1.25, outputPrice: 5.0, contextWindow: "2M", logo: "google.png" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", provider: "Google", inputPrice: 0.15, outputPrice: 0.6, contextWindow: "1M", logo: "google.png" },
  { id: "gemini-1.5-flash-8b", name: "Gemini 1.5 Flash-8B", provider: "Google", inputPrice: 0.075, outputPrice: 0.3, contextWindow: "1M", logo: "google.png" },
];

// ================== DeepSeek Models ==================
const deepSeekModels = [
  { id: "deepseek-r1", name: "DeepSeek R1", provider: "DeepSeek", inputPrice: 0.55, outputPrice: 2.19, contextWindow: "128k", logo: "deepseek.png" },
  { id: "deepseek-v3-mar-25", name: "DeepSeek V3 (Mar ’25)", provider: "DeepSeek", inputPrice: 0.14, outputPrice: 0.28, contextWindow: "128k", logo: "deepseek.png" },
  { id: "deepseek-v2.5", name: "DeepSeek V2.5", provider: "DeepSeek", inputPrice: 0.14, outputPrice: 0.28, contextWindow: "128k", logo: "deepseek.png" },
  { id: "deepseek-r1-distill-qwen", name: "DeepSeek R1 Distill Qwen", provider: "DeepSeek", inputPrice: 0.27, outputPrice: 1.1, contextWindow: "128k", logo: "deepseek.png" },
];

// ================== Mistral Models ==================
const mistralModels = [
  { id: "mistral-small", name: "Mistral Small", provider: "Mistral", inputPrice: 0.1, outputPrice: 0.3, contextWindow: "32k", logo: "mistral.png" },
  { id: "mistral-small-3", name: "Mistral Small 3", provider: "Mistral", inputPrice: 0.2, outputPrice: 0.6, contextWindow: "128k", logo: "mistral.png" },
  { id: "mistral-large", name: "Mistral Large", provider: "Mistral", inputPrice: 2.0, outputPrice: 6.0, contextWindow: "128k", logo: "mistral.png" },
  { id: "mistral-large-2", name: "Mistral Large 2", provider: "Mistral", inputPrice: 2.0, outputPrice: 6.0, contextWindow: "128k", logo: "mistral.png" },
  { id: "mixtral-8x7b", name: "Mixtral 8x7B", provider: "Mistral", inputPrice: 0.5, outputPrice: 0.5, contextWindow: "32k", logo: "mistral.png" },
  { id: "mixtral-8x22b", name: "Mixtral 8x22B", provider: "Mistral", inputPrice: 0.5, outputPrice: 0.5, contextWindow: "65k", logo: "mistral.png" },
  { id: "mistral-nemo", name: "Mistral NeMo", provider: "Mistral", inputPrice: 0.15, outputPrice: 0.15, contextWindow: "128k", logo: "mistral.png" },
];

// ================== Meta Models ==================
const metaModels = [
  { id: "llama-4-scout", name: "LLaMA 4 Scout", provider: "Meta", inputPrice: 0.00017, outputPrice: 0.00017, contextWindow: "10M", logo: "meta.png" },
  { id: "llama-4-maverick", name: "LLaMA 4 Maverick", provider: "Meta", inputPrice: 0.00019, outputPrice: 0.00049, contextWindow: "1M", logo: "meta.png" },
  { id: "llama-3.3-70b", name: "LLaMA 3.3 70B", provider: "Meta", inputPrice: 0.23, outputPrice: 0.4, contextWindow: "128k", logo: "meta.png" },
  { id: "llama-3.1-405b", name: "LLaMA 3.1 405B", provider: "Meta", inputPrice: 1.79, outputPrice: 1.79, contextWindow: "128k", logo: "meta.png" },
  { id: "llama-3.2-90b-vision", name: "LLaMA 3.2 90B Vision", provider: "Meta", inputPrice: 0.35, outputPrice: 0.4, contextWindow: "128k", logo: "meta.png" },
  { id: "llama-3.1-70b", name: "LLaMA 3.1 70B", provider: "Meta", inputPrice: 0.23, outputPrice: 0.4, contextWindow: "128k", logo: "meta.png" },
  { id: "llama-3.2-11b-vision", name: "LLaMA 3.2 11B Vision", provider: "Meta", inputPrice: 0.055, outputPrice: 0.055, contextWindow: "128k", logo: "meta.png" },
];

// ================== xAI (Grok) Models ==================
const xAIModels = [
  { id: "grok-3", name: "Grok 3", provider: "xAI (Grok)", inputPrice: 0.003, outputPrice: 0.015, contextWindow: "1M", logo: "xai.png" },
  { id: "grok-2", name: "Grok 2", provider: "xAI (Grok)", inputPrice: 0.002, outputPrice: 0.01, contextWindow: "200k", logo: "xai.png" },
  { id: "grok-1", name: "Grok 1", provider: "xAI (Grok)", inputPrice: null, outputPrice: null, contextWindow: "128k", logo: "xai.png" },
];

// ================== Amazon Models ==================
const amazonModels = [
  { id: "nova-micro", name: "Nova Micro", provider: "Amazon", inputPrice: 0.035, outputPrice: 0.14, contextWindow: "128k", logo: "amazon.png" },
  { id: "nova-lite", name: "Nova Lite", provider: "Amazon", inputPrice: 0.06, outputPrice: 0.24, contextWindow: "300k", logo: "amazon.png" },
  { id: "nova-pro", name: "Nova Pro", provider: "Amazon", inputPrice: 0.8, outputPrice: 3.2, contextWindow: "300k", logo: "amazon.png" },
];

// ================== Alibaba Models ==================
const alibabaModels = [
{ id: "qwen-max", name: "Qwen-Max", provider: "Alibaba", inputPrice: 1.6, outputPrice: 6.4, contextWindow: "128k", logo: "alibaba.png"},
{ id: "qwen-plus", name: "Qwen-Plus", provider: "Alibaba", inputPrice: 0.4, outputPrice: 1.2, contextWindow: "128k", logo: "alibaba.png"},
{ id: "qwen-plus-latest-thinking", name: "Qwen-Plus-Latest (Thinking)", provider: "Alibaba", inputPrice: 0.4, outputPrice: 8.0, contextWindow: "128k", logo: "alibaba.png"},
{ id: "qwen-plus-latest", name: "Qwen-Plus-Latest", provider: "Alibaba", inputPrice: 0.4, outputPrice: 1.2, contextWindow: "128k", logo: "alibaba.png"},
{ id: "qwen-turbo", name: "Qwen-Turbo", provider: "Alibaba", inputPrice: 0.05, outputPrice: 0.2, contextWindow: "32k", logo: "alibaba.png"},
{ id: "qwen-vl-max", name: "Qwen-VL-Max", provider: "Alibaba", inputPrice: 0.41, outputPrice: 0.41, contextWindow: "128k", logo: "alibaba.png"},
];

// ================== NVIDIA Models ==================
const NVIDIAModels = [
  {id: "llama-3.1-nemotron-70b-instruct", name: "Llama 3.1 Nemotron 70B Instruct", provider: "NVIDIA", inputPrice: 0.12, outputPrice: 0.30, contextWindow: "131k", logo: "nvidia.png"},
  {id: "llama-3.1-nemotron-8b-instruct-bf16", name: "Llama 3.1 Nemotron 8B Instruct (BF16)", provider: "NVIDIA", inputPrice: 0.025, outputPrice: 0.04, contextWindow: "131k", logo: "nvidia.png"},
  {id: "llama-3.1-405b-instruct-fp8", name: "Llama 3.1 405B Instruct (FP8)", provider: "NVIDIA", inputPrice: 0.80, outputPrice: 0.80, contextWindow: "131k", logo: "nvidia.png"},
  {id: "llama-3.2-3b-instruct-bf16", name: "Llama 3.2 3B Instruct (BF16)", provider: "NVIDIA", inputPrice: 0.015, outputPrice: 0.025, contextWindow: "131k", logo: "nvidia.png"},
];

// ================== Combine all models ==================
// This is the final array used by script.js
// Make sure to add any new provider arrays here!
const modelsData = [
  ...openAIModels,
  ...anthropicModels,
  ...googleModels,
  ...deepSeekModels,
  ...mistralModels,
  ...metaModels,
  ...xAIModels,
  ...amazonModels,
  ...alibabaModels,
  ...NVIDIAModels
];

// EDIT THIS VALUE WHEN DATA CHANGES
const lastUpdated = "May 2025";