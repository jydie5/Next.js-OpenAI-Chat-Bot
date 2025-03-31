import { NextResponse } from 'next/server';
import { generateChatResponse, Message } from '@/lib/openai';
import OpenAI from 'openai';

export async function POST(request: Request) {
  try {
    const { messages } = await request.json() as { messages: Message[] };
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Valid messages array is required' },
        { status: 400 }
      );
    }

    // 通常の（ノンストリーミング）レスポンスを生成
    const result = await generateChatResponse(messages, {
      model: 'o3-mini', // デフォルトモデルを使用
      reasoningEffort: 'medium' // デフォルトの推論レベル
    });
    // APIレスポンスを整形
    const response = {
      content: result.content,
      isLast: true,
      debugInfo: result.debugInfo
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    );
  }
}