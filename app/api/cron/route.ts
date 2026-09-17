import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import nodemailer from 'nodemailer'

declare global {
  var prisma: PrismaClient | undefined
}
const prisma = global.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  // Protect this endpoint so only Vercel Cron can trigger it
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
    
    // Find devices offline for > 30 mins that haven't triggered an alert yet
    const offlineDevices = await prisma.device.findMany({
        where: {
            lastPing: { lt: thirtyMinutesAgo },
            alertSent: false
        }
    })

    if (offlineDevices.length > 0) {
        console.log(`Found ${offlineDevices.length} newly offline devices. Sending email...`)
        
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        })
        
        const deviceList = offlineDevices.map(d => d.deviceId).join('\n- ')
        
        await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Pi Fleet Monitor" <alerts@yourdomain.com>',
            to: process.env.ALERT_EMAIL_TO,
            subject: 'URGENT: Classroom Recorders Offline',
            text: `The following Raspberry Pi recorders have missed heartbeats for over 30 minutes:\n\n- ${deviceList}\n\nPlease check their power and network connections immediately.`
        })

        // Mark these devices as alerted so we don't spam
        await prisma.device.updateMany({
            where: { id: { in: offlineDevices.map(d => d.id) } },
            data: { alertSent: true }
        })
    }
    
    return NextResponse.json({ success: true, alertedCount: offlineDevices.length })
  } catch (error) {
    console.error("Cron Error:", error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
