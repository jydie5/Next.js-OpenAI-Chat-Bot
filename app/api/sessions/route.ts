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