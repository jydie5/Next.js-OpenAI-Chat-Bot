import { NextResponse } from 'next/server';
import { generateStreamingChatResponse, Message } from '@/lib/openai';
import OpenAI from 'openai';

// ストリームを適切に処理するためのヘルパー関数
function streamToReadableStream(stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>) {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array>;
  let responseDebugInfo: any = null;
  
  const readable = new ReadableStream({
    start(c) {
      controller = c;
      
      async function push() {
        try {
          for await (const chunk of stream) {
            // デバッグ情報を保存
            // 最後のチャンクの場合のみデバッグ情報を保存
            if (chunk.choices[0]?.finish_reason === "stop") {
              responseDebugInfo = {
                id: chunk.id,
                model: chunk.model,
                usage: chunk.usage || {
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
                service_tier: chunk.service_tier,
                system_fingerprint: chunk.system_fingerprint,
              };
            }

            const text = chunk.choices[0]?.delta?.content || '';
            if (text) {
              // JSON形式でチャンクを送信
              const jsonChunk = {
                content: text,
                isLast: false,
              };
              controller.enqueue(encoder.encode(JSON.stringify(jsonChunk) + '\n'));
            }
          }
          // 最後のチャンクでデバッグ情報を送信
          const finalChunk = {
            content: '',
            isLast: true,
            debugInfo: responseDebugInfo,
          };
          controller.enqueue(encoder.encode(JSON.stringify(finalChunk) + '\n'));
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