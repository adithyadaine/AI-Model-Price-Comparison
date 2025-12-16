import { getLogoFilename, formatNumber } from './utils.js';

export const providerUrls = {
  "OpenAI": "https://openai.com",
  "Anthropic": "https://www.anthropic.com",
  "Google": "https://deepmind.google",
  "Meta": "https://ai.meta.com",
  "Mistral": "https://mistral.ai",
  "Cohere": "https://cohere.com",
  "DeepSeek": "https://www.deepseek.com",
  "AI21 Labs": "https://www.ai21.com",
  "Alibaba": "https://www.alibabacloud.com/en/solutions/generative-ai",
  "Amazon Bedrock": "https://aws.amazon.com/bedrock",
  "MiniMax": "https://www.minimaxi.com",
  "Moonshot AI": "https://www.moonshot.cn",
  "NVIDIA": "https://www.nvidia.com/en-us/ai-data-science",
  "Perplexity AI": "https://www.perplexity.ai",
  "xAI": "https://x.ai",
  "Zhipu AI": "https://www.zhipuai.cn/en",
  "Microsoft": "https://www.microsoft.com",
  "01.AI": "https://www.01.ai",
  "Databricks": "https://www.databricks.com",
  "Together AI": "https://www.together.ai",
  "Nous Research": "https://nousresearch.com",
  "Phind": "https://www.phind.com",
  "DeepInfra": "https://deepinfra.com",
  "Fireworks AI": "https://fireworks.ai",
  "Liquid AI": "https://www.liquid.ai",
  "Nebius": "https://nebius.com",
  "Novita": "https://novita.ai",
  "Hugging Face": "https://huggingface.co",
  "AllenAI": "https://allenai.org",
  "EleutherAI": "https://www.eleuther.ai",
  "Baidu": "https://www.baidu.com",
  "ByteDance": "https://www.bytedance.com",
  "Tencent": "https://www.tencent.com",
  "Huawei": "https://www.huawei.com",
  "Aion Labs": "https://aionlabs.com",
  "Arcee AI": "https://www.arcee.ai",
  "ArliAI": "https://arli.ai",
  "DeepCogito": "https://deepcogito.com",
  "Cognitive Computations": "https://erichartford.com",
  "Sao10K": "https://huggingface.co/Sao10K",
  "Teknium": "https://huggingface.co/teknium",
  "Gryphe": "https://huggingface.co/Gryphe",
  "PygmalionAI": "https://pygmalion.chat",
  "RWKV": "https://www.rwkv.com",
  "Recursal": "https://recursal.ai",
  "NeverSleep": "https://huggingface.co/NeverSleep",
  "Haotian": "https://llava-vl.github.io",
  "Jon Durbin": "https://huggingface.co/jondurbin",
  "RaenonX": "https://huggingface.co/RaenonX",
  "Sophosympatheia": "https://huggingface.co/Sophosympatheia",
  "Undi95": "https://huggingface.co/Undi95",
  "Alpindale": "https://huggingface.co/alpindale",
  "OpenChat": "https://openchat.team",
  "Austism": "https://huggingface.co/austism",
  "Mancer": "https://mancer.tech",
  "SF Compute": "https://sfcompute.com",
  "Anthracite-org": "https://huggingface.co/anthracite-org",
  "Alfredpros": "https://huggingface.co/alfredpros",
  "Relace": "https://relace.ai", 
  "Nex AGI": "https://nexagi.com",
  "EssentialAI": "https://essential.ai",
  "Prime Intellect": "https://primeintellect.ai",
  "TNG Technology Consulting": "https://www.tngtech.com", 
  "KwaiPilot": "https://kwaipilot.com", 
  "IBM": "https://www.ibm.com",
  "OpenRouter": "https://openrouter.ai" 
};

export const ALLOWED_PROVIDERS = [
  "AI21 Labs",
  "Alibaba",
  "Amazon Bedrock",
  "Anthropic",
  "Arcee AI",
  "Cohere",
  "DeepSeek",
  "EssentialAI",
  "Google",
  "Meta",
  "MiniMax",
  "Mistral",
  "Moonshot AI",
  "NVIDIA",
  "OpenAI",
  "Perplexity AI",
  "xAI",
  "Zhipu AI"
];

function getProviderNameFromSlug(slug) {
  const mapping = {
    'openai': 'OpenAI',
    'anthropic': 'Anthropic',
    'google': 'Google',
    'meta-llama': 'Meta',
    'meta': 'Meta',
    'mistralai': 'Mistral',
    'mistral': 'Mistral',
    'cohere': 'Cohere',
    'perplexity': 'Perplexity AI',
    'deepseek': 'DeepSeek',
    'x-ai': 'xAI',
    'alibaba': 'Alibaba',
    'ai21': 'AI21 Labs',
    'amazon': 'Amazon Bedrock',
    'minimax': 'MiniMax',
    'moonshot': 'Moonshot AI',
    'moonshotai': 'Moonshot AI',
    'nvidia': 'NVIDIA',
    'zhipu': 'Zhipu AI',
    'microsoft': 'Microsoft',
    '01-ai': '01.AI',
    'databricks': 'Databricks',
    'together': 'Together AI',
    'gryphe': 'Gryphe',
    'nousresearch': 'Nous Research',
    'openchat': 'OpenChat',
    'cognitivecomputations': 'Cognitive Computations',
    'pygmalionai': 'PygmalionAI',
    'sao10k': 'Sao10K',
    'teknium': 'Teknium',
    'alpindale': 'Alpindale',
    'austism': 'Austism',
    'rwkv': 'RWKV',
    'recursal': 'Recursal',
    'phind': 'Phind',
    'neversleep': 'NeverSleep',
    'allenai': 'AllenAI',
    'deepinfra': 'DeepInfra',
    'fireworks': 'Fireworks AI',
    'liquid': 'Liquid AI',
    'mancer': 'Mancer',
    'nebius': 'Nebius',
    'novita': 'Novita',
    'raenonx': 'RaenonX',
    'sfcompute': 'SF Compute',
    'sophosympatheia': 'Sophosympatheia',
    'undi95': 'Undi95',
    'jondurbin': 'Jon Durbin',
    'haotian': 'Haotian',
    'huggingface': 'Hugging Face',
    'relace': 'Relace',
    'nex-agi': 'Nex AGI',
    'essentialai': 'EssentialAI',
    'prime-intellect': 'Prime Intellect',
    'tngtech': 'TNG Technology Consulting',
    'kwaipilot': 'KwaiPilot',
    'ibm-granite': 'IBM',
    'openrouter': 'OpenRouter',
    'arcee-ai': 'Arcee AI',
    'deepcogito': 'DeepCogito',
    'z-ai': 'Zhipu AI'
  };
  return mapping[slug.toLowerCase()] || slug.charAt(0).toUpperCase() + slug.slice(1);
}

export async function fetchOpenRouterModels() {
  console.log("Fetching models from OpenRouter API...");
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
        console.error(`API Error: ${response.status}`);
        return null;
    }
    
    const data = await response.json();
    if (!data || !data.data) return null;

    return data.data.map(item => {
      let provider = "Other";
      let name = item.name;
      
      if (item.id.includes("/")) {
        const parts = item.id.split("/");
        const vendorSlug = parts[0];
        provider = getProviderNameFromSlug(vendorSlug);
        
        if (name.toLowerCase().startsWith(provider.toLowerCase() + ":")) {
            name = name.substring(provider.length + 1).trim();
        } else if (name.toLowerCase().startsWith(provider.toLowerCase() + " ")) {
            name = name.substring(provider.length + 1).trim();
        }
      } else if (item.name.includes(":")) {
        const parts = item.name.split(":");
        provider = parts[0].trim();
        name = parts.slice(1).join(":").trim();
      }

      const contextWindow = item.context_length ? formatNumber(item.context_length) : "N/A";
      const promptPrice = item.pricing.prompt ? parseFloat(item.pricing.prompt) * 1000000 : null;
      const completionPrice = item.pricing.completion ? parseFloat(item.pricing.completion) * 1000000 : null;

      let releaseDate = "";
      if (item.created) {
        const date = new Date(item.created * 1000);
        releaseDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
      }

      const status = "Active";
      const modelId = item.id.replace(/\//g, "-").toLowerCase();

      // Determine Logo URL
      const localLogo = getLogoFilename(provider);
      let logoUrl = null;
      if (providerUrls[provider]) {
          const domain = new URL(providerUrls[provider]).hostname;
          logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      }

      // Extract reasoning support from supported_parameters
      const supportedParams = item.supported_parameters || [];
      const supportsReasoning = supportedParams.includes("reasoning") || supportedParams.includes("include_reasoning");
      
      // Extract modalities from architecture
      const arch = item.architecture || {};
      const inputModalities = arch.input_modalities || ["text"];
      const outputModalities = arch.output_modalities || ["text"];

      return {
        provider: provider, 
        name: name,
        id: modelId,
        contextWindow: contextWindow,
        inputPrice: promptPrice,
        outputPrice: completionPrice,
        status: status,
        releaseDate: releaseDate,
        logo: localLogo,
        logoUrl: logoUrl,
        source: "api",
        supportsReasoning: supportsReasoning,
        inputModalities: inputModalities,
        outputModalities: outputModalities
      };
    });
  } catch (error) {
    console.error("Error fetching OpenRouter models:", error);
    return null;
  }
}
