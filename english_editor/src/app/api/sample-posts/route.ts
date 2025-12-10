import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  try {
    // Get the admin user
    const adminUser = await db.user.findFirst({
      where: { email: 'admin@example.com' }
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    // Create sample posts
    const samplePosts = [
      {
        title: 'Sample Graphic Post 1',
        content: 'This is a sample post with an image background',
        background: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        blurAmount: 2,
        canvasData: JSON.stringify({
          elements: [
            {
              type: 'text',
              content: 'عنوان اصلی',
              position: { x: 50, y: 50 },
              style: { fontSize: 32, color: '#ffffff', fontWeight: 'bold' }
            },
            {
              type: 'text',
              content: 'Details about this post',
              position: { x: 50, y: 100 },
              style: { fontSize: 16, color: '#ffffff' }
            }
          ]
        }),
        published: true,
        archived: false
      },
      {
        title: 'Sample Graphic Post 2',
        content: 'This is a sample post with a colored background',
        background: '#3b82f6',
        blurAmount: 0,
        canvasData: JSON.stringify({
          elements: [
            {
              type: 'text',
              content: 'Second Post',
              position: { x: 100, y: 80 },
              style: { fontSize: 28, color: '#ffffff', fontWeight: 'bold' }
            }
          ]
        }),
        published: true,
        archived: false
      },
      {
        title: 'Draft Post',
        content: 'This post is not yet published',
        background: '#10b981',
        blurAmount: 1,
        canvasData: JSON.stringify({
          elements: [
            {
              type: 'text',
              content: 'پیش‌نویس',
              position: { x: 150, y: 120 },
              style: { fontSize: 24, color: '#ffffff' }
            }
          ]
        }),
        published: false,
        archived: false
      }
    ];

    const createdPosts = [];
    for (let i = 0; i < samplePosts.length; i++) {
      const postData = samplePosts[i];
      const post = await db.post.create({
        data: {
          ...postData,
          slug: `${postData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${i}`,
          authorId: adminUser.id
        }
      });
      createdPosts.push(post);
    }

    return NextResponse.json({ 
      message: 'Sample posts created successfully', 
      posts: createdPosts 
    });
  } catch (error) {
    console.error('Error creating sample posts:', error);
    return NextResponse.json({ error: 'Failed to create sample posts' }, { status: 500 });
  }
}
