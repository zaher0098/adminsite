import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Get or create the admin user
    let adminUser = await db.user.findFirst({
      where: { email: 'admin@example.com' }
    });

    if (!adminUser) {
      adminUser = await db.user.create({
        data: {
          email: 'admin@example.com',
          name: 'System Admin',
          role: 'admin'
        }
      });
    }

    return NextResponse.json({ message: 'Admin user ready', user: adminUser });
  } catch (error) {
    console.error('Error with admin user:', error);
    return NextResponse.json({ error: 'Failed to get admin user' }, { status: 500 });
  }
}

export async function POST() {
  try {
    // Create a sample admin user if it doesn't exist
    const existingUser = await db.user.findFirst({
      where: { email: 'admin@example.com' }
    });

    if (!existingUser) {
      const user = await db.user.create({
        data: {
          email: 'admin@example.com',
          name: 'System Admin',
          role: 'admin'
        }
      });
      return NextResponse.json({ message: 'Admin user created', user });
    }

    return NextResponse.json({ message: 'Admin user already exists', user: existingUser });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
