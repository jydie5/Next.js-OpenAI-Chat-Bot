import OpenAI from 'openai';

// OpenAI クライアントの初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export async function generateChatResponse(messages: Message[]): Promise<string> {
  try {
    const formattedMessages = messages.map(({ role, content }) => ({
      role,
      content,
    }));

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || '回答を生成できませんでした。';
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
      model: 'gpt-4o',
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    });

    return stream;
  } catch (error) {
    console.error('OpenAI API ストリーミングエラー:', error);
    throw new Error('AIからの応答の取得に失敗しました。しばらくしてからもう一度お試しください。');
  }
}
