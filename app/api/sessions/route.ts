import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: '認証が必要です' }),
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    const sessions = await prisma.session.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    return new NextResponse(
      JSON.stringify({ sessions }),
      { status: 200 }
    );
  } catch (error) {
    console.error('セッション取得エラー:', error);
    return new NextResponse(
      JSON.stringify({ error: 'セッションの取得に失敗しました' }),
      { status: 500 }
    );
  }
}

// 新規セッション作成のPOSTエンドポイント
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: '認証が必要です' }),
        { status: 401 }
      );
    }
    
    const userId = parseInt(session.user.id);
    
    // 新規セッションを作成
    const newSession = await prisma.session.create({
      data: {
        userId: userId,
        title: '新規チャット',
        messages: {
          create: []
        }
      }
    });
    
    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        session: newSession 
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('セッション作成エラー:', error);
    return new NextResponse(
      JSON.stringify({ error: 'セッションの作成に失敗しました' }),
      { status: 500 }
    );
  }
}

// セッション削除のDELETEエンドポイント
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: '認証が必要です' }),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');

    if (!sessionId) {
      return new NextResponse(
        JSON.stringify({ error: 'セッションIDが必要です' }),
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);

    // セッションの所有者確認
    const targetSession = await prisma.session.findUnique({
      where: { id: parseInt(sessionId) },
    });

    if (!targetSession) {
      return new NextResponse(
        JSON.stringify({ error: 'セッションが見つかりません' }),
        { status: 404 }
      );
    }

    if (targetSession.userId !== userId) {
      return new NextResponse(
        JSON.stringify({ error: 'このセッションを削除する権限がありません' }),
        { status: 403 }
      );
    }

    // セッションとそれに関連するメッセージを削除
    await prisma.message.deleteMany({
      where: { sessionId: parseInt(sessionId) },
    });

    await prisma.session.delete({
      where: { id: parseInt(sessionId) },
    });

    return new NextResponse(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (error) {
    console.error('セッション削除エラー:', error);
    return new NextResponse(
      JSON.stringify({ error: 'セッションの削除に失敗しました' }),
      { status: 500 }
    );
  }
}