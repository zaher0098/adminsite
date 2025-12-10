import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { success: false, message: 'ایمیل و کد تأیید الزامی هستند' },
        { status: 400 }
      )
    }

    // Find valid token
    const token = await db.emailToken.findFirst({
      where: {
        email: email,
        token: code,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      }
    })

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'کد تأیید نامعتبر یا منقضی شده است' },
        { status: 401 }
      )
    }

    // Mark token as used
    await db.emailToken.update({
      where: { id: token.id },
      data: { used: true }
    })

    // Create or update admin session
    let admin = await db.admin.findFirst({
      where: { email: email }
    })

    if (!admin) {
      // Create admin if doesn't exist
      admin = await db.admin.create({
        data: {
          email: email,
          passwordHash: 'hashed_in_production', // In production, this should be properly hashed
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'ورود با موفقیت انجام شد',
      admin: {
        id: admin.id,
        email: admin.email
      }
    })

  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در پردازش درخواست' },
      { status: 500 }
    )
  }
}