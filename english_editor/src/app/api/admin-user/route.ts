import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    console.log('Getting admin user...');
    
    // Get or create the admin user
    let adminUser = await db.user.findFirst({
      where: { email: 'admin@example.com' }
    });

    if (!adminUser) {
      console.log('Creating admin user...');
      adminUser = await db.user.create({
        data: {
          email: 'admin@example.com',
          name: 'ادمین سیستم',
          role: 'admin'
        }
      });
      console.log('Admin user created:', adminUser);
    } else {
      console.log('Admin user found:', adminUser);
    }

    return NextResponse.json({ 
      message: 'Admin user ready', 
      user: adminUser,
      userId: adminUser.id 
    });
  } catch (error) {
    console.error('Error with admin user:', error);
    return NextResponse.json({ error: 'Failed to get admin user' }, { status: 500 });
  }
}