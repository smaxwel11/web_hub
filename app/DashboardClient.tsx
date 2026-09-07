'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function DashboardClient({ initialDevices }: { initialDevices: any[] }) {
  const router = useRouter()

  // Auto-refresh the Server Component every 5 seconds to get the latest DB status
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 5000)
    return () => clearInterval(interval)
  }, [router])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {initialDevices.map(device => {
        // Calculate if device is offline (no ping in the last 15 minutes to account for 10-min polling)
        const lastPingDate = new Date(device.lastPing)
        const isOffline = (new Date().getTime() - lastPingDate.getTime()) > 900000

        let statusColor = 'bg-gray-200'
        let statusText = 'Unknown'

        if (isOffline) {
          statusColor = 'bg-red-500'
          statusText = 'OFFLINE ALERT'
        } else if (device.status === 'recording') {
          statusColor = 'bg-red-600 animate-pulse'
          statusText = 'RECORDING'
        } else {
          statusColor = 'bg-blue-500'
          statusText = 'IDLE (Hibernating)'
        }

        return (
          <div key={device.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b pb-4">
              <h2 className="text-xl font-bold text-gray-800">{device.deviceId}</h2>
              <div className={`px-3 py-1 rounded-full text-white text-xs font-bold ${statusColor}`}>
                {statusText}
              </div>
            </div>
            
            <div className="space-y-3 text-sm text-gray-600 flex-grow">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Active Class:</span>
                <span className="text-right">{device.className || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Last Ping:</span>
                <span className="text-right">
                  {lastPingDate.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
