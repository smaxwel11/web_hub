import { PrismaClient } from '@prisma/client'
import { DashboardClient } from './DashboardClient'

// Prevent multiple Prisma instances in dev
declare global {
  var prisma: PrismaClient | undefined
}
const prisma = global.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') global.prisma = prisma

// Force Next.js to dynamically render this page on every request
export const dynamic = 'force-dynamic'

export default async function Page() {
  const devices = await prisma.device.findMany({
    orderBy: { deviceId: 'asc' }
  })
  
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Classroom Recorders Fleet</h1>
            <div className="flex items-center space-x-2">
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-sm font-medium text-gray-600">Live Database Connection</span>
            </div>
        </div>
        <DashboardClient initialDevices={devices} />
      </div>
    </main>
  )
}
