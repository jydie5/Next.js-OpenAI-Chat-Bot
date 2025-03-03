import { NextResponse } from 'next/server';
import { generateStreamingChatResponse, Message } from '@/lib/openai';
import OpenAI from 'openai';

// ストリームを適切に処理するためのヘルパー関数
function streamToReadableStream(stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>) {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array>;
  
  const readable = new ReadableStream({
    start(c) {
      controller = c;
      
      async function push() {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
      
      push();
    },
  });
  
  return readable;
}

export async function POST(request: Request) {
  try {
    const { messages } = await request.json() as { messages: Message[] };
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Valid messages array is required' },
        { status: 400 }
      );
    }

    // ストリーミングレスポンスを生成
    const stream = await generateStreamingChatResponse(messages);
    
    // OpenAIのストリームをReadableStreamに変換
    const readableStream = streamToReadableStream(stream);
    
    // 適切なヘッダーでレスポンスを返す
    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    );
  }
}
