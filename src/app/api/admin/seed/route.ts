import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Check if admin already exists
    const existingAdmin = await db.admin.findFirst()
    
    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: 'Admin already exists',
        admin: {
          id: existingAdmin.id,
          email: existingAdmin.email
        }
      })
    }

    // Create initial admin
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456!'
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com'
    
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10)

    const admin = await db.admin.create({
      data: {
        email: ADMIN_EMAIL,
        passwordHash: hashedPassword,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        id: admin.id,
        email: admin.email
      }
    })

  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { success: false, message: 'Error creating admin' },
      { status: 500 }
    )
  }
}