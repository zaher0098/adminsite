import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const published = searchParams.get('published');
    const archived = searchParams.get('archived');
    
    let whereClause: any = {};
    
    if (published === 'true') {
      whereClause.published = true;
      whereClause.archived = false;
    }
    
    if (archived === 'true') {
      whereClause.archived = true;
    } else if (archived === 'false') {
      whereClause.archived = false;
    }

    const posts = await db.post.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, canvasData, background, blurAmount, published, authorId } = body;

    if (!title || !authorId) {
      return NextResponse.json({ error: 'Title and authorId are required' }, { status: 400 });
    }

    // Generate unique slug with timestamp
    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const timestamp = Date.now();
    const slug = `${baseSlug}-${timestamp}`;

    const post = await db.post.create({
      data: {
        title,
        slug,
        content,
        canvasData,
        background,
        blurAmount: blurAmount || 0,
        published: published || false,
        archived: false,
        authorId
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}