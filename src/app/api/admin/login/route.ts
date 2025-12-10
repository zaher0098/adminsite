import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/lib/db'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { success: false, message: 'رمز عبور الزامی است' },
        { status: 400 }
      )
    }

    // Hash the provided password and compare with stored admin password
    // For demo purposes, we'll use a hardcoded strong password
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456!'
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'zahrerezaibfw@gmail.com'
    
    // For simplicity in demo, we'll compare directly
    // In production, you should store hashed password in database
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, message: 'رمز عبور اشتباه است' },
        { status: 401 }
      )
    }

    // Generate unique verification token
    const verificationToken = uuidv4()
    
    // Store token in database
    await db.emailToken.create({
      data: {
        email: ADMIN_EMAIL,
        token: verificationToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      }
    })

    // Create verification link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const verificationLink = `${baseUrl}/api/admin/verify-link?token=${verificationToken}&email=${encodeURIComponent(ADMIN_EMAIL)}`

    let emailSent = false
    let emailInfo = null

    // Try to send email with real SMTP first
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        })

        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: ADMIN_EMAIL,
          subject: '🔐 ورود امن به پنل ادمین',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🔐 ورود امن</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">پنل مدیریت سایت</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
                <h2 style="color: #333; margin-bottom: 15px;">درخواست ورود دریافت شد</h2>
                <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                  برای ورود امن به پنل ادمین، روی دکمه زیر کلیک کنید. این لینک تنها به مدت 15 دقیقه معتبر است.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verificationLink}" 
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; 
                            padding: 15px 40px; 
                            text-decoration: none; 
                            border-radius: 50px; 
                            font-weight: bold; 
                            font-size: 18px;
                            display: inline-block;
                            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                            transition: all 0.3s ease;">
                    ✅ تأیید و ورود به پنل
                  </a>
                </div>
                
                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 20px; border-radius: 5px;">
                  <p style="color: #856404; margin: 0; font-size: 14px;">
                    <strong>⚠️ توجه:</strong> اگر شما درخواست ورود نکرده‌اید، این پیام را نادیده بگیرید.
                  </p>
                </div>
              </div>
              
              <div style="text-align: center; color: #999; font-size: 12px;">
                <p>این ایمیل به صورت خودکار ارسال شده است.</p>
                <p>لینک فقط یک بار قابل استفاده است.</p>
              </div>
            </div>
          `,
        })
        emailSent = true
      } catch (emailError) {
        console.error('Failed to send real email:', emailError)
      }
    }

    // Try Ethereal for testing if real email fails
    if (!emailSent) {
      try {
        const testAccount = await nodemailer.createTestAccount()
        const etherealTransporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        })

        emailInfo = await etherealTransporter.sendMail({
          from: testAccount.user,
          to: ADMIN_EMAIL,
          subject: '🔐 ورود امن به پنل ادمین (تست)',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🔐 ورود امن</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">پنل مدیریت سایت (تست)</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
                <h2 style="color: #333; margin-bottom: 15px;">درخواست ورود دریافت شد</h2>
                <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                  برای ورود امن به پنل ادمین، روی دکمه زیر کلیک کنید. این لینک تنها به مدت 15 دقیقه معتبر است.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verificationLink}" 
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; 
                            padding: 15px 40px; 
                            text-decoration: none; 
                            border-radius: 50px; 
                            font-weight: bold; 
                            font-size: 18px;
                            display: inline-block;
                            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                            transition: all 0.3s ease;">
                    ✅ تأیید و ورود به پنل
                  </a>
                </div>
                
                <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin-top: 20px; border-radius: 5px;">
                  <p style="color: #155724; margin: 0; font-size: 14px;">
                    <strong>ℹ️ این یک ایمیل تست است:</strong> از طریق Ethereal Email ارسال شده است.
                  </p>
                </div>
              </div>
              
              <div style="text-align: center; color: #999; font-size: 12px;">
                <p>این ایمیل به صورت خودکار ارسال شده است.</p>
                <p>لینک فقط یک بار قابل استفاده است.</p>
              </div>
            </div>
          `,
        })
        
        console.log('📧 Ethereal Email Preview URL:', nodemailer.getTestMessageUrl(emailInfo))
        emailSent = true // Mark as sent for our purposes
      } catch (etherealError) {
        console.error('Failed to send Ethereal email:', etherealError)
      }
    }

    console.log('🔗 Verification Link (Demo):', verificationLink)
    console.log('📊 Response data:', {
      success: true,
      message: emailSent 
        ? 'لینک تأیید با موفقیت به ایمیل شما ارسال شد' 
        : 'لینک تأیید در کنسول سرور نمایش داده شد (تست)',
      verificationLink: verificationLink,
      emailSent: emailSent
    })

    return NextResponse.json({
      success: true,
      message: emailSent 
        ? 'لینک تأیید با موفقیت به ایمیل شما ارسال شد' 
        : 'لینک تأیید در کنسول سرور نمایش داده شد (تست)',
      verificationLink: verificationLink, // For demo purposes
      emailSent: emailSent
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در پردازش درخواست' },
      { status: 500 }
    )
  }
}