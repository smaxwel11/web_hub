import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined
}

const prisma = global.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { device_id, status, class_name } = data
    
    if (!device_id) {
        return NextResponse.json({ error: 'Missing device_id' }, { status: 400 })
    }

    // Upsert the device status into Vercel Postgres
    const device = await prisma.device.upsert({
      where: { deviceId: device_id },
      update: {
        status: status,
        className: class_name || null,
        lastPing: new Date(),
        alertSent: false, // Reset alert trap when device comes back online
      },
      create: {
        deviceId: device_id,
        status: status,
        className: class_name || null,
        lastPing: new Date(),
        alertSent: false,
      },
    })
    
    return NextResponse.json({ success: true, device })
  } catch (error) {
    console.error("Telemetry Error:", error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
