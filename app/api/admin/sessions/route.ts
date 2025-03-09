import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// 管理者権限チェック
async function checkAdminAccess() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isRoot) {
    throw new Error('管理者権限が必要です');
  }
}

// セッション一覧取得（最新100件）
export async function GET() {
  try {
    await checkAdminAccess();

    const sessions = await prisma.session.findMany({
      take: 100,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
        _count: {
          select: {
            messages: true,
          }
        },
      },
    });

    const formattedSessions = sessions.map(session => ({
      id: session.id,
      title: session.title,
      createdAt: session.createdAt,
      username: session.user.username,
      messageCount: session._count.messages,
    }));

    return new NextResponse(
      JSON.stringify({ sessions: formattedSessions }),
      { status: 200 }
    );
  } catch (error) {
    console.error('セッション一覧取得エラー:', error);
    return new NextResponse(
      JSON.stringify({ error: error instanceof Error ? error.message : 'エラーが発生しました' }),
      { status: error instanceof Error && error.message === '管理者権限が必要です' ? 403 : 500 }
    );
  }
}

// セッション削除
export async function DELETE(request: Request) {
  try {
    await checkAdminAccess();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new NextResponse(
        JSON.stringify({ error: 'セッションIDは必須です' }),
        { status: 400 }
      );
    }

    await prisma.session.delete({
      where: { id: parseInt(id) },
    });

    return new NextResponse(
      JSON.stringify({ message: 'セッションを削除しました' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('セッション削除エラー:', error);
    return new NextResponse(
      JSON.stringify({ error: error instanceof Error ? error.message : 'エラーが発生しました' }),
      { status: error instanceof Error && error.message === '管理者権限が必要です' ? 403 : 500 }
    );
  }
}