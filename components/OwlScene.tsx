'use client'

import { OwlStatus } from '@/types'

interface Props {
  status: OwlStatus | null
  flash: boolean
}

const STARS = [
  [18,18],[44,38],[78,13],[112,28],[145,17],[178,33],[204,11],
  [232,26],[262,16],[288,40],[306,23],[52,52],[292,53],[158,8],
  [96,44],[220,47],[330,35],[340,18],[8,42],
]

export default function OwlScene({ status, flash }: Props) {
  const windowFill = status === 'YES' ? '#2a1a04' : status === 'MISTY' ? '#0e1a1e' : '#060810'
  const hasOwl   = status === 'YES'
  const isMisty  = status === 'MISTY'

  return (
    <svg
      viewBox="0 0 320 240"
      width="100%"
      style={{ display: 'block', imageRendering: 'pixelated' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── Sky ── */}
      <rect width="320" height="240" fill="#0d0f1a" />

      {/* Stars */}
      {STARS.map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="2" height="2" fill="#c8cfd8" opacity="0.45" />
      ))}

      {/* Dim moon */}
      <circle cx="268" cy="36" r="18" fill="#c8cfd8" opacity="0.06" />
      <circle cx="268" cy="36" r="14" fill="#c8cfd8" opacity="0.04" />

      {/* ── Trees ── */}
      {/* Left bare tree */}
      <path d="M 4,240 L 22,168 L 30,98" stroke="#161e2e" strokeWidth="5" fill="none" strokeLinecap="square" />
      <path d="M 26,128 L 4,108" stroke="#161e2e" strokeWidth="3" fill="none" strokeLinecap="square" />
      <path d="M 30,98 L 52,72" stroke="#161e2e" strokeWidth="3" fill="none" strokeLinecap="square" />
      <path d="M 52,72 L 42,52" stroke="#161e2e" strokeWidth="2" fill="none" strokeLinecap="square" />
      <path d="M 52,72 L 64,60" stroke="#161e2e" strokeWidth="2" fill="none" strokeLinecap="square" />
      {/* Right bare tree */}
      <path d="M 316,240 L 296,162 L 284,92" stroke="#161e2e" strokeWidth="5" fill="none" strokeLinecap="square" />
      <path d="M 290,122 L 314,100" stroke="#161e2e" strokeWidth="3" fill="none" strokeLinecap="square" />
      <path d="M 284,92 L 262,66" stroke="#161e2e" strokeWidth="3" fill="none" strokeLinecap="square" />
      <path d="M 262,66 L 272,48" stroke="#161e2e" strokeWidth="2" fill="none" strokeLinecap="square" />

      {/* ── Window warm glow behind house (YES only) ── */}
      {status === 'YES' && (
        <>
          <rect x="70" y="90" width="180" height="90" fill="#2a1400" opacity="0.3" />
          <rect x="80" y="95" width="160" height="80" fill="#1e0e00" opacity="0.4" />
        </>
      )}

      {/* ── House body ── */}
      <rect x="50" y="72" width="220" height="168" fill="#1a2233" />
      {/* Side shadow (right) */}
      <rect x="266" y="72" width="4" height="168" fill="#0a0c14" />
      {/* Side highlight (left) */}
      <rect x="50" y="72" width="2" height="168" fill="#2e3f52" opacity="0.5" />

      {/* House horizontal stone lines (texture) */}
      {[90, 108, 126, 144, 162, 180, 198, 216].map(y => (
        <line key={y} x1="50" y1={y} x2="270" y2={y} stroke="#151e2d" strokeWidth="1" />
      ))}

      {/* ── Roof ── */}
      <polygon points="30,74 160,6 290,74" fill="#0d1322" />
      <polygon points="30,74 160,6 290,74" fill="none" stroke="#2e3f52" strokeWidth="2" />
      {/* Roof left slope shading */}
      <polygon points="30,74 160,6 160,74" fill="#090e1a" opacity="0.4" />

      {/* ── Chimney ── */}
      <rect x="88" y="16" width="28" height="56" fill="#1a2233" />
      <rect x="86" y="12" width="32" height="6" fill="#2e3f52" />
      <rect x="88" y="16" width="2" height="56" fill="#2e3f52" opacity="0.4" />

      {/* ── Attic window ── */}
      <rect x="144" y="30" width="32" height="24" fill="#2e3f52" />
      <rect x="148" y="34" width="24" height="16" fill="#060810" />
      <line x1="160" y1="34" x2="160" y2="50" stroke="#2e3f52" strokeWidth="2" />

      {/* ── Main window frame ── */}
      <rect x="78" y="100" width="164" height="72" fill="#2e3f52" />

      {/* Window glass — 4 panes */}
      <rect x="84" y="106" width="152" height="60" fill={windowFill} />
      {/* Pane dividers */}
      <line x1="160" y1="106" x2="160" y2="166" stroke="#2e3f52" strokeWidth="4" />
      <line x1="84" y1="136" x2="236" y2="136" stroke="#2e3f52" strokeWidth="4" />

      {/* ── Owl (YES) ── */}
      {hasOwl && (
        <g style={{ filter: flash ? 'brightness(1.5)' : 'brightness(1)', transition: 'filter 0.1s' }}>
          {/* Body */}
          <rect x="136" y="128" width="48" height="40" fill="#3a2810" />
          {/* Breast (lighter center) */}
          <rect x="146" y="134" width="28" height="30" fill="#4a3820" />
          <rect x="150" y="136" width="20" height="26" fill="#524020" />
          {/* Wing texture dither left */}
          <rect x="136" y="130" width="4" height="36" fill="#2a1c08" />
          <rect x="140" y="132" width="2" height="32" fill="#2a1c08" />
          {/* Wing texture dither right */}
          <rect x="180" y="130" width="4" height="36" fill="#222008" />
          {/* Head */}
          <rect x="140" y="108" width="40" height="24" fill="#3a2810" />
          {/* Ear tufts */}
          <rect x="140" y="104" width="10" height="8" fill="#3a2810" />
          <rect x="142" y="100" width="8" height="6" fill="#3a2810" />
          <rect x="170" y="104" width="10" height="8" fill="#3a2810" />
          <rect x="170" y="100" width="8" height="6" fill="#3a2810" />
          {/* Eyes — amber */}
          <rect x="144" y="112" width="14" height="12" fill="#c8860a" />
          <rect x="162" y="112" width="14" height="12" fill="#c8860a" />
          {/* Pupils */}
          <rect x="148" y="114" width="6" height="8" fill="#0d0f1a" />
          <rect x="166" y="114" width="6" height="8" fill="#0d0f1a" />
          {/* Eye shine */}
          <rect x="148" y="114" width="3" height="3" fill="#f0d060" />
          <rect x="166" y="114" width="3" height="3" fill="#f0d060" />
          {/* Beak */}
          <rect x="156" y="123" width="8" height="6" fill="#7a5418" />
          <rect x="158" y="125" width="4" height="4" fill="#5a3c10" />
          {/* Feet (peeking above sill) */}
          <rect x="148" y="163" width="6" height="4" fill="#5a4018" />
          <rect x="158" y="163" width="6" height="4" fill="#5a4018" />
          <rect x="168" y="163" width="6" height="4" fill="#5a4018" />
        </g>
      )}

      {/* ── Fog overlay (MISTY) ── */}
      {isMisty && (
        <g>
          <rect x="84" y="106" width="152" height="60" fill="#0e1e24" opacity="0.6" />
          {/* Fog dither rows */}
          {[0,1,2].map(row =>
            [0,1,2,3,4,5,6,7].map(col => (
              <rect
                key={`${row}-${col}`}
                x={84 + col * 19 + (row % 2) * 10}
                y={110 + row * 20}
                width="10"
                height="9"
                fill="#2a3a40"
                opacity="0.45"
              />
            ))
          )}
          {/* Horizontal wisps */}
          <rect x="88" y="118" width="70" height="3" fill="#3a4a50" opacity="0.5" />
          <rect x="148" y="132" width="84" height="3" fill="#3a4a50" opacity="0.4" />
          <rect x="94" y="150" width="56" height="3" fill="#3a4a50" opacity="0.35" />
        </g>
      )}

      {/* ── Window sill ── */}
      <rect x="74" y="165" width="172" height="8" fill="#2e3f52" />
      <rect x="72" y="171" width="176" height="4" fill="#1e2f3e" />

      {/* ── Door ── */}
      <rect x="128" y="178" width="64" height="62" fill="#0e1622" />
      {/* Door arch */}
      <rect x="128" y="174" width="64" height="6" fill="#0e1622" />
      <rect x="132" y="170" width="56" height="6" fill="#0e1622" />
      <rect x="138" y="167" width="44" height="5" fill="#0e1622" />
      {/* Door frame */}
      <rect x="126" y="176" width="4" height="64" fill="#2e3f52" />
      <rect x="190" y="176" width="4" height="64" fill="#1e2f3e" />
      <rect x="126" y="174" width="68" height="4" fill="#2e3f52" />
      {/* Door knob */}
      <rect x="182" y="206" width="6" height="6" fill="#2e3f52" />
      <rect x="183" y="207" width="4" height="4" fill="#3a5060" />

      {/* ── Ground ── */}
      <rect x="0" y="228" width="320" height="12" fill="#111a11" />
      {/* Ground dither */}
      {Array.from({ length: 20 }, (_, i) => (
        <rect key={i} x={i * 16} y={228} width="8" height="2" fill="#192419" opacity="0.6" />
      ))}
      {/* Path to door */}
      <rect x="136" y="226" width="48" height="6" fill="#1a2020" />
      <rect x="140" y="226" width="40" height="4" fill="#1c2222" />
    </svg>
  )
}
