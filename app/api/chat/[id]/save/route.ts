import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

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

    const { content } = await req.json();

    // アシスタントの応答を保存
    const savedMessage = await prisma.message.create({
      data: {
        sessionId: parseInt(params.id),
        role: 'assistant',
        content,
      },
    });

    return NextResponse.json({ message: savedMessage });
  } catch (error) {
    console.error('Error saving assistant message:', error);
    return NextResponse.json(
      { error: 'メッセージの保存に失敗しました' },
      { status: 500 }
    );
  }
}