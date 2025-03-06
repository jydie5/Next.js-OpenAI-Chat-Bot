import OpenAI from 'openai';

// コードブロックをMarkdown形式でフォーマットする関数
function formatResponseAsMarkdown(content: string): string {
  // コードブロックが```で既に囲まれているかチェック
  if (content.includes('```')) {
    return content;
  }

  // コードブロックパターンを検出して適切にマークアップ
  let formattedContent = content
    // コード例などの説明文が続くパターン
    .replace(/(以下|下記|次)(?:は|の|が|に).*?[：:]?\n([\s\S]*?)(?=\n\n|$)/g, (_, prefix, code) => {
      const cleanCode = code.trim();
      return `${prefix}\n\`\`\`typescript\n${cleanCode}\n\`\`\`\n`;
    })
    // 関数定義やプログラミング構文で始まるパターン
    .replace(/\b((?:function|class|const|let|var|if|for|while)\s+[\s\S]*?)(?=\n\n|$)/g, (_, code) => {
      return `\n\`\`\`typescript\n${code.trim()}\n\`\`\`\n`;
    })
    // インラインコードをバッククオートで囲む
    .replace(/`([^`]+)`/g, '`$1`');  // 既存のインラインコードは保持

  return formattedContent;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

export async function generateChatResponse(messages: Message[]): Promise<{ content: string; debugInfo: DebugInfo }> {
  try {
    const formattedMessages = messages.map(({ role, content }) => ({
      role,
      content,
    }));

    const response = await openai.chat.completions.create({
      // model: 'gpt-4o',
      model: 'o3-mini',

      // reasoning_effort:"medium",
      reasoning_effort:"high",
      //reasoning_effort=:low",

      messages: [
        { role: 'system', content: 'Formatting re-enabled\nあなたは丁寧で優しい口調の日本語で回答するAIアシスタントです。' },
        ...formattedMessages
      ],
      // temperature: 0.7,
      max_completion_tokens : 25000,
    });

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

export async function generateStreamingChatResponse(messages: Message[]) {
  try {
    const formattedMessages = messages.map(({ role, content }) => ({
      role,
      content,
    }));

    const stream = await openai.chat.completions.create({
      model: 'o3-mini',
      messages: [
        { role: 'system', content: 'Formatting re-enabled\nあなたは丁寧で優しい口調の日本語で回答するAIアシスタントです。' },
        ...formattedMessages
      ],
      reasoning_effort: "high",
      max_completion_tokens: 25000,
      stream: true,
    });

    return stream;
  } catch (error) {
    console.error('OpenAI API ストリーミングエラー:', error);
    throw new Error('AIからの応答の取得に失敗しました。しばらくしてからもう一度お試しください。');
  }
}
