import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const email = searchParams.get('email')

    if (!token || !email) {
      return NextResponse.redirect(
        new URL('/?error=missing_params', request.url)
      )
    }

    // Find valid token
    const emailToken = await db.emailToken.findFirst({
      where: {
        email: email,
        token: token,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      }
    })

    if (!emailToken) {
      return NextResponse.redirect(
        new URL('/?error=invalid_token', request.url)
      )
    }

    // Mark token as used
    await db.emailToken.update({
      where: { id: emailToken.id },
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
          passwordHash: 'hashed_in_production',
        }
      })
    }

    // Create a session token for the frontend
    const sessionToken = Buffer.from(JSON.stringify({
      adminId: admin.id,
      email: admin.email,
      timestamp: Date.now()
    })).toString('base64')

    // Redirect to main page with session token
    const redirectUrl = new URL('/', request.url)
    redirectUrl.searchParams.set('admin_session', sessionToken)
    
    return NextResponse.redirect(redirectUrl.toString())

  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.redirect(
      new URL('/?error=verification_failed', request.url)
    )
  }
}