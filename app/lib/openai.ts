import OpenAI from 'openai';

export type ReasoningEffort = 'high' | 'medium' | 'low';

export type ModelConfig = {
  model: string;
  description: string;
  supportsReasoningEffort?: boolean;
};

// モデル設定の定義
export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  'o3-mini': {
    model: 'o3-mini',
    description: 'o3-mini',
    supportsReasoningEffort: true
  },
  'gpt-4o': {
    model: 'gpt-4o',
    description: 'gpt-4o',
    supportsReasoningEffort: false
  }
};

// コードブロックをMarkdown形式でフォーマットする関数
function formatResponseAsMarkdown(content: string): string {
  if (content.includes('```')) {
    return content;
  }

  let formattedContent = content
    .replace(/(以下|下記|次)(?:は|の|が|に).*?[：:]?\n([\s\S]*?)(?=\n\n|$)/g, (_, prefix, code) => {
      const cleanCode = code.trim();
      return `${prefix}\n\`\`\`typescript\n${cleanCode}\n\`\`\`\n`;
    })
    .replace(/\b((?:function|class|const|let|var|if|for|while)\s+[\s\S]*?)(?=\n\n|$)/g, (_, code) => {
      return `\n\`\`\`typescript\n${code.trim()}\n\`\`\`\n`;
    })
    .replace(/`([^`]+)`/g, '`$1`');

  return formattedContent;
}

// OpenAIクライアントをサーバーサイドでのみ初期化
let openai: OpenAI;
if (typeof window === 'undefined') {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export type DebugInfo = {
  id: string;
  model: string;
  usage: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
    completion_tokens_details?: {
      accepted_prediction_tokens: number;
      audio_tokens: number;
      reasoning_tokens: number;
      rejected_prediction_tokens: number;
    };
    prompt_tokens_details?: {
      audio_tokens: number;
      cached_tokens: number;
    };
  };
  service_tier: string;
  system_fingerprint: string;
};

export type Message = {
  role: 'user' | 'assistant';
  content: string;
  debugInfo?: DebugInfo;
};

export type ChatConfig = {
  model: string;
  reasoningEffort?: ReasoningEffort;
};

export async function generateChatResponse(
  messages: Message[],
  config: ChatConfig
): Promise<{ content: string; debugInfo: DebugInfo }> {
  try {
    if (!openai) {
      throw new Error('OpenAI client is not initialized');
    }

    const formattedMessages = messages.map(({ role, content }) => ({
      role,
      content,
    }));

    const response = await openai.chat.completions.create(
      config.model === 'o3-mini' 
        ? {
            model: 'o3-mini',
            reasoning_effort: config.reasoningEffort,
            messages: [
              { role: 'system', content: 'Formatting re-enabled\nあなたは丁寧で優しい口調の日本語で回答するAIアシスタントです。' },
              ...formattedMessages
            ],
            max_completion_tokens: 25000,
          }
        : {
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: 'Formatting re-enabled\nあなたは丁寧で優しい口調の日本語で回答するAIアシスタントです。' },
              ...formattedMessages
            ],
            max_tokens: 4096,
          }
    );

    const content = formatResponseAsMarkdown(response.choices[0]?.message?.content || '回答を生成できませんでした。');
    const usage = response.usage || {
      completion_tokens: 0,
      prompt_tokens: 0,
      total_tokens: 0,
      completion_tokens_details: {
        accepted_prediction_tokens: 0,
        audio_tokens: 0,
        reasoning_tokens: 0,
        rejected_prediction_tokens: 0
      },
      prompt_tokens_details: {
        audio_tokens: 0,
        cached_tokens: 0
      }
    };

    return {
      content,
      debugInfo: {
        id: response.id || 'unknown',
        model: response.model || 'unknown',
        usage: {
          ...usage,
          completion_tokens_details: {
            accepted_prediction_tokens: usage.completion_tokens_details?.accepted_prediction_tokens ?? 0,
            audio_tokens: usage.completion_tokens_details?.audio_tokens ?? 0,
            reasoning_tokens: usage.completion_tokens_details?.reasoning_tokens ?? 0,
            rejected_prediction_tokens: usage.completion_tokens_details?.rejected_prediction_tokens ?? 0
          },
          prompt_tokens_details: {
            audio_tokens: usage.prompt_tokens_details?.audio_tokens ?? 0,
            cached_tokens: usage.prompt_tokens_details?.cached_tokens ?? 0
          }
        },
        service_tier: response.service_tier || 'default',
        system_fingerprint: response.system_fingerprint || 'unknown'
      }
    };
  } catch (error) {
    console.error('OpenAI API エラー:', error);
    throw new Error('AIからの応答の取得に失敗しました。しばらくしてからもう一度お試しください。');
  }
}

export async function generateStreamingChatResponse(
  messages: Message[],
  config: ChatConfig
) {
  try {
    if (!openai) {
      throw new Error('OpenAI client is not initialized');
    }

    const formattedMessages = messages.map(({ role, content }) => ({
      role,
      content,
    }));

    const stream = await openai.chat.completions.create(
      config.model === 'o3-mini' 
        ? {
            model: 'o3-mini',
            reasoning_effort: config.reasoningEffort,
            messages: [
              { role: 'system', content: 'Formatting re-enabled\nあなたは丁寧で優しい口調の日本語で回答するAIアシスタントです。' },
              ...formattedMessages
            ],
            max_completion_tokens: 25000,
            stream: true,
          }
        : {
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: 'Formatting re-enabled\nあなたは丁寧で優しい口調の日本語で回答するAIアシスタントです。' },
              ...formattedMessages
            ],
            max_tokens: 4096,
            stream: true,
          }
    );
    return stream;
  } catch (error) {
    console.error('OpenAI API ストリーミングエラー:', error);
    throw new Error('AIからの応答の取得に失敗しました。しばらくしてからもう一度お試しください。');
  }
}