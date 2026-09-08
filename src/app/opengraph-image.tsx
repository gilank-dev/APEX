import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Apex — Enterprise Operations Control Node'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          backgroundColor: '#0C111D',
          backgroundImage:
            'radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.05) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(249, 115, 22, 0.08) 5%, transparent 0%)',
          backgroundSize: '100px 100px',
          padding: '60px 80px',
          color: '#FFFFFF',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              border: '2px solid #F97316',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F97316',
              fontWeight: 900,
              fontSize: '22px',
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
            }}
          >
            AP
          </div>
          <span
            style={{
              fontSize: '24px',
              fontWeight: 800,
              letterSpacing: '4px',
              color: '#FFFFFF',
            }}
          >
            APEX
          </span>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '2px',
              color: '#F97316',
              backgroundColor: 'rgba(249, 115, 22, 0.15)',
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              marginLeft: '12px',
            }}
          >
            ENTERPRISE SaaS NODE
          </span>
        </div>

        {/* Hero Title & Subtitle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px' }}>
          <h1
            style={{
              fontSize: '52px',
              fontWeight: 900,
              lineHeight: 1.15,
              color: '#FFFFFF',
              margin: 0,
              letterSpacing: '-1px',
            }}
          >
            Scale your enterprise operations with lightning-fast automation.
          </h1>
          <p
            style={{
              fontSize: '22px',
              color: '#94A3B8',
              lineHeight: 1.5,
              margin: 0,
              maxWidth: '850px',
            }}
          >
            Biometric Selfie Attendance • Kanban Tasks Board • Low-Stock SKU Tracking • Multi-Tenant Isolation
          </p>
        </div>

        {/* Bottom Bar: Telemetry Stats & Badges */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '30px',
          }}
        >
          <div style={{ display: 'flex', gap: '40px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '12px', color: '#64748B', letterSpacing: '1px' }}>SECURITY</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#F97316' }}>Bank-Grade RLS</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '12px', color: '#64748B', letterSpacing: '1px' }}>SYNC</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#38BDF8' }}>Offline-First IDB</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '12px', color: '#64748B', letterSpacing: '1px' }}>ACCURACY</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#34D399' }}>99.9% Telemetry</span>
            </div>
          </div>
          <div style={{ fontSize: '16px', color: '#64748B', fontFamily: 'monospace' }}>
            apex.lankdev.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
