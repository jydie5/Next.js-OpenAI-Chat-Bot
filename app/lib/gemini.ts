import { GoogleGenerativeAI } from "@google/generative-ai";
import { Message, ChatConfig, DebugInfo } from './openai';

// Geminiクライアントのインスタンスをサーバーサイドでのみ初期化
let genAI: GoogleGenerativeAI;
if (typeof window === 'undefined') {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY environment variable is required');
  }
  genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
}

// Geminiメッセージ形式への変換
function convertToGeminiFormat(messages: Message[]) {
  return messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));
}

// デバッグ情報の生成（Gemini用）
function createGeminiDebugInfo(): DebugInfo {
  return {
    id: `gemini-${Date.now()}`,
    model: 'gemini-2.0-flash',
    usage: {
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
    },
    service_tier: 'gemini',
    system_fingerprint: 'gemini-2.0'
  };
}

// レート制限エラーを処理する関数
async function handleRateLimit(error: any): Promise<never> {
  if (error?.status === 429) {
    const retryDelay = error?.errorDetails?.[2]?.retryDelay;
    if (retryDelay) {
      throw new Error(`APIの使用制限に達しました。${retryDelay}後に再試行してください。`);
    }
  }
  throw error;
}

export async function generateGeminiResponse(
  messages: Message[],
  config: ChatConfig
): Promise<{ content: string; debugInfo: DebugInfo }> {
  try {
    if (!genAI) {
      throw new Error('Gemini client is not initialized');
    }

    // チャットの作成
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash'
    });

    // メッセージの準備
    const formattedMessages = messages.map(msg => msg.content).join("\n\n");
    const result = await model.generateContent(formattedMessages);
    const response = await result.response;
    const text = response.text();

    return {
      content: text,
      debugInfo: createGeminiDebugInfo()
    };
  } catch (error) {
    console.error('Gemini API エラー:', error);
    await handleRateLimit(error);
    throw new Error('Geminiからの応答の取得に失敗しました。しばらくしてからもう一度お試しください。');
  }
}

// AsyncGenerator型を返すヘルパー関数
async function* createStreamingGenerator(model: any, content: string) {
  try {
    const result = await model.generateContent(content);
    const response = await result.response;
    yield { text: response.text() };
  } catch (error) {
    await handleRateLimit(error);
    throw error;
  }
}

export async function generateGeminiStreamingResponse(
  messages: Message[],
  config: ChatConfig
) {
  try {
    if (!genAI) {
      throw new Error('Gemini client is not initialized');
    }

    // チャットの作成
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash'
    });
    
    // メッセージの準備
    const formattedMessages = messages.map(msg => msg.content).join("\n\n");
    return createStreamingGenerator(model, formattedMessages);
  } catch (error) {
    console.error('Gemini API ストリーミングエラー:', error);
    await handleRateLimit(error);
    throw new Error('Geminiからの応答の取得に失敗しました。しばらくしてからもう一度お試しください。');
  }
}