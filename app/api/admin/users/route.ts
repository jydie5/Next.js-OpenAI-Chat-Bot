import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// 管理者権限チェック
async function checkAdminAccess() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isRoot) {
    throw new Error('管理者権限が必要です');
  }
}

// ユーザー一覧取得
export async function GET() {
  try {
    await checkAdminAccess();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        isRoot: true,
        createdAt: true,
        _count: {
          select: {
            sessions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return new NextResponse(
      JSON.stringify({ users }),
      { status: 200 }
    );
  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error);
    return new NextResponse(
      JSON.stringify({ error: error instanceof Error ? error.message : 'エラーが発生しました' }),
      { status: error instanceof Error && error.message === '管理者権限が必要です' ? 403 : 500 }
    );
  }
}

// 新規ユーザー作成
export async function POST(request: Request) {
  try {
    await checkAdminAccess();

    const { username, password, isRoot } = await request.json();

    if (!username || !password) {
      return new NextResponse(
        JSON.stringify({ error: 'ユーザー名とパスワードは必須です' }),
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        isRoot: isRoot ?? false,
      },
      select: {
        id: true,
        username: true,
        isRoot: true,
        createdAt: true,
      },
    });

    return new NextResponse(
      JSON.stringify({ user }),
      { status: 201 }
    );
  } catch (error) {
    console.error('ユーザー作成エラー:', error);
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return new NextResponse(
        JSON.stringify({ error: 'このユーザー名は既に使用されています' }),
        { status: 400 }
      );
    }
    return new NextResponse(
      JSON.stringify({ error: error instanceof Error ? error.message : 'エラーが発生しました' }),
      { status: error instanceof Error && error.message === '管理者権限が必要です' ? 403 : 500 }
    );
  }
}

// ユーザー更新
export async function PUT(request: Request) {
  try {
    await checkAdminAccess();

    const { id, username, password, isRoot } = await request.json();

    if (!id) {
      return new NextResponse(
        JSON.stringify({ error: 'ユーザーIDは必須です' }),
        { status: 400 }
      );
    }

    const updateData: any = {
      username,
      isRoot,
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        username: true,
        isRoot: true,
        createdAt: true,
      },
    });

    return new NextResponse(
      JSON.stringify({ user }),
      { status: 200 }
    );
  } catch (error) {
    console.error('ユーザー更新エラー:', error);
    return new NextResponse(
      JSON.stringify({ error: error instanceof Error ? error.message : 'エラーが発生しました' }),
      { status: error instanceof Error && error.message === '管理者権限が必要です' ? 403 : 500 }
    );
  }
}

// ユーザー削除
export async function DELETE(request: Request) {
  try {
    await checkAdminAccess();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new NextResponse(
        JSON.stringify({ error: 'ユーザーIDは必須です' }),
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    return new NextResponse(
      JSON.stringify({ message: 'ユーザーを削除しました' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('ユーザー削除エラー:', error);
    return new NextResponse(
      JSON.stringify({ error: error instanceof Error ? error.message : 'エラーが発生しました' }),
      { status: error instanceof Error && error.message === '管理者権限が必要です' ? 403 : 500 }
    );
  }
}