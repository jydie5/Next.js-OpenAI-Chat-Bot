import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { OpenAI } from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    const { message } = await req.json();

    // ユーザーメッセージを保存
    const userMessage = await prisma.message.create({
      data: {
        sessionId: parseInt(params.id),
        role: 'user',
        content: message,
      },
    });

    // OpenAI APIにリクエスト
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: message }],
    });

    const assistantMessage = completion.choices[0]?.message?.content || 'エラーが発生しました';

    // アシスタントの応答を保存
    const savedAssistantMessage = await prisma.message.create({
      data: {
        sessionId: parseInt(params.id),
        role: 'assistant',
        content: assistantMessage,
      },
    });

    // セッションタイトルが "新規チャット" の場合、最初のメッセージを基に更新
    if (chatSession.title === '新規チャット') {
      await prisma.session.update({
        where: { id: parseInt(params.id) },
        data: { title: message.slice(0, 50) }, // 最初の50文字を使用
      });
    }

    return NextResponse.json({
      userMessage,
      assistantMessage: savedAssistantMessage,
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}