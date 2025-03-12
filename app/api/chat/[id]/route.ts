import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { generateStreamingChatResponse } from '@/lib/openai';
import { StreamingTextResponse } from 'ai';

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const chatSession = await prisma.session.findUnique({
      where: {
        id: parseInt(params.id),
      },
      include: {
        user: true,
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
    });

    if (!chatSession) {
      return NextResponse.json(
        { error: 'セッションが見つかりません' },
        { status: 404 }
      );
    }

    if (chatSession.userId !== parseInt(session.user.id)) {
      return NextResponse.json(
        { error: 'アクセス権限がありません' },
        { status: 403 }
      );
    }

    const { message, reasoningEffort } = await req.json();

    // ユーザーメッセージを保存
    const userMessage = await prisma.message.create({
      data: {
        sessionId: parseInt(params.id),
        role: 'user',
        content: message,
      },
    });

    // 過去のメッセージも含めてコンテキストを構築
    const messages = chatSession.messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));
    messages.push({ role: 'user', content: message });

    // ストリーミングレスポンスを生成
    const stream = await generateStreamingChatResponse(messages, reasoningEffort);

    // OpenAIのストリームを適切な形式のReadableStreamに変換
    const textStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';
            controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    // セッションタイトルが "新規チャット" の場合、最初のメッセージを基に更新
    if (chatSession.title === '新規チャット') {
      await prisma.session.update({
        where: { id: parseInt(params.id) },
        data: { title: message.slice(0, 50) },
      });
    }

    // 正しく変換されたストリームを返す
    return new StreamingTextResponse(textStream);
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}