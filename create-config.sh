#!/bin/bash

# Ensure directory exists
mkdir -p js/modules

# Create the config file
cat > js/modules/statusConfig.js <<EOF
export const providerStatusPages = {
    'OpenAI': 'https://status.openai.com',
    'Anthropic': 'https://status.anthropic.com',
    'Google': 'https://status.cloud.google.com',
    'Liquid AI': 'https://status.liquidweb.com/',
    'Meta': 'https://metastatus.com/', 
    'Mistral': 'https://status.mistral.ai',
    'Cohere': 'https://status.cohere.ai',
    'DeepSeek': 'https://status.deepseek.com',
    'EssentialAI': 'https://app.pulsetic.com/monitors/119196/overview',
    'AI21 Labs': 'https://status.ai21.com',
    'Alibaba': 'https://status.alibabacloud.com',
    'Amazon Bedrock': 'https://health.aws.amazon.com/health/status',
    'MiniMax': 'https://app.pulsetic.com/monitors/119198/overview',
    'Moonshot AI': 'https://status.moonshot.cn', 
    'Nous Research': 'https://app.pulsetic.com/monitors/131415/overview',
    'NVIDIA': 'https://status.ngc.nvidia.com', 
    'Perplexity AI': 'https://status.perplexity.ai',
    'xAI': 'https://status.x.ai',
    'Xiaomi': 'https://app.pulsetic.com/monitors/129398/overview',
    'Zhipu AI': 'https://app.pulsetic.com/monitors/119199/overview',
    'Microsoft': 'https://status.azure.com',
    'Together AI': 'https://status.together.ai',
    'Fireworks AI': 'https://status.fireworks.ai',
    'Hugging Face': 'https://status.huggingface.co',
    'OpenRouter': 'https://status.openrouter.ai',
    'Arcee AI': 'https://status.arcee.ai',
};
EOF

echo "Successfully created js/modules/statusConfig.js"
