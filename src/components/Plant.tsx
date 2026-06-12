'use client'

import { motion } from 'framer-motion'

// ─── Leaf path: round Flora-inspired shape, pointing UP from (0,0) ───────────
const LEAF = 'M0,0 C-5,-8 -18,-18 -17,-36 C-16,-54 -6,-64 0,-66 C6,-64 16,-54 17,-36 C18,-18 5,-8 0,0'

// ─── Health-based color palette ───────────────────────────────────────────────
const bandColors = {
  thriving:   { leaf: '#22c55e', leafMid: '#4ade80', vein: '#15803d', stem: '#16a34a' },
  okay:       { leaf: '#84cc16', leafMid: '#bef264', vein: '#4d7c0f', stem: '#4d7c0f' },
  struggling: { leaf: '#eab308', leafMid: '#fde047', vein: '#a16207', stem: '#92400e' },
  critical:   { leaf: '#9ca3af', leafMid: '#d1d5db', vein: '#6b7280', stem: '#6b7280' },
}

// Session always uses thriving greens — the plant responds to the commitment
const sessionColors = { leaf: '#22c55e', leafMid: '#86efac', vein: '#15803d', stem: '#16a34a' }

type Band = 'thriving' | 'okay' | 'struggling' | 'critical'

function getBand(health: number): Band {
  if (health >= 80) return 'thriving'
  if (health >= 50) return 'okay'
  if (health >= 20) return 'struggling'
  return 'critical'
}

// ─── Leaf component ───────────────────────────────────────────────────────────
// Outer <g> handles SVG position. Inner motion.g handles animated rotation.
// originY:1 = rotate around bounding-box bottom (the leaf base at y=0).
interface LeafProps {
  x: number
  y: number
  angle: number       // degrees: 0=up, +ve=clockwise
  fill: string
  vein: string
  scale?: number      // 0 = hidden, 1 = full size
  isAway?: boolean
}

function Leaf({ x, y, angle, fill, vein, scale = 1, isAway = false }: LeafProps) {
  return (
    <g transform={`translate(${x},${y})`}>
      <motion.g
        animate={{
          rotate: angle,
          scaleX: scale,
          scaleY: scale,
          opacity: scale > 0.05 ? 1 : 0,
        }}
        transition={
          isAway
            ? { type: 'spring', stiffness: 180, damping: 18 }
            : { type: 'spring', stiffness: 45, damping: 14 }
        }
        style={{ originX: 0.5, originY: 1 }}
      >
        <path d={LEAF} fill={fill} />
        <line x1="0" y1="0" x2="0" y2="-63" stroke={vein} strokeWidth="2" strokeLinecap="round" />
      </motion.g>
    </g>
  )
}

// ─── Pot ──────────────────────────────────────────────────────────────────────
function Pot({ body = '#c17f3a', rim = '#d4924a', soil = '#5c3d1e', inner = '#4a2f14' }) {
  return (
    <>
      <path d="M58,196 L48,238 Q48,244 56,244 H164 Q172,244 172,238 L162,196 Z" fill={body} />
      <rect x="44" y="186" width="132" height="16" rx="8" fill={rim} />
      <ellipse cx="110" cy="196" rx="56" ry="10" fill={soil} />
      <ellipse cx="110" cy="195" rx="48" ry="6" fill={inner} />
    </>
  )
}

// ─── Main Plant component ─────────────────────────────────────────────────────
export interface PlantProps {
  health: number
  sessionProgress?: number   // 0–1 during active session; undefined otherwise
  isAway?: boolean           // tabbed away during an active session
}

export default function Plant({ health, sessionProgress, isAway = false }: PlantProps) {
  const band = getBand(health)
  const inSession = sessionProgress !== undefined

  // Vitality: drives plant size/fullness
  // Outside session: health/100
  // During session: grows from health/100 toward 1.0 as session progresses
  const baseVitality = health / 100
  const vitality = inSession
    ? baseVitality + Math.min(sessionProgress, 1) * (1 - baseVitality)
    : baseVitality

  // Colors: session always uses thriving greens to show the plant responding
  const colors = inSession ? sessionColors : bandColors[band]

  // Stem height: 60px (dead seedling) → 155px (full bloom)
  const stemHeight = 60 + vitality * 95
  const stemX = 110
  const soilY = 190
  const stemTopY = soilY - stemHeight

  // Leaf spread angle: how far leaves fan upward/outward
  // Away = droops past horizontal; healthy = wide proud spread
  const spread = isAway
    ? 118
    : inSession
      ? 35 + vitality * 35   // 35° (seedling) → 70° (full bloom) — eager, reaching
      : 28 + vitality * 42   // 28° (wilted) → 70° (thriving)

  // Leaf scale thresholds — each pair grows in as vitality rises
  function ls(threshold: number): number {
    if (vitality < threshold) return 0
    return Math.min(1.1, (vitality - threshold) / 0.18)
  }

  // Leaf positions: proportional to stem so they move up as plant grows
  const lowerY  = stemTopY + stemHeight * 0.73
  const midY    = stemTopY + stemHeight * 0.50
  const upperY  = stemTopY + stemHeight * 0.28
  const crownY  = stemTopY + stemHeight * 0.08

  // Idle sway only when thriving, not in session, not away
  const sway = !inSession && !isAway && band === 'thriving'

  return (
    <motion.svg
      width="220" height="255" viewBox="0 0 220 255"
      animate={sway ? { rotate: [0, 1.5, -1.5, 0.8, -0.8, 0] } : { rotate: 0 }}
      transition={sway
        ? { duration: 5, repeat: Infinity, ease: 'easeInOut' }
        : { duration: 0.8 }}
      style={{ originX: '50%', originY: '100%' }}
    >
      <Pot
        body={isAway || band === 'critical' ? '#8b4513' : '#c17f3a'}
        rim={isAway || band === 'critical' ? '#9b5523' : '#d4924a'}
      />

      {/* Stem — animates height with vitality */}
      <motion.path
        animate={{ d: `M${stemX},${soilY} C${stemX - 4},${soilY - stemHeight * 0.45} ${stemX + 4},${soilY - stemHeight * 0.72} ${stemX},${stemTopY}` }}
        transition={{ type: 'spring', stiffness: 45, damping: 14 }}
        stroke={colors.stem}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />

      {/* Lower pair — appears early */}
      <Leaf x={stemX} y={lowerY}  angle={-spread}      fill={colors.leaf}    vein={colors.vein} scale={ls(0.08)} isAway={isAway} />
      <Leaf x={stemX} y={lowerY}  angle={spread}       fill={colors.leaf}    vein={colors.vein} scale={ls(0.08)} isAway={isAway} />

      {/* Mid pair */}
      <Leaf x={stemX} y={midY}    angle={-(spread*0.95)} fill={colors.leaf}  vein={colors.vein} scale={ls(0.28)} isAway={isAway} />
      <Leaf x={stemX} y={midY}    angle={spread*0.95}    fill={colors.leaf}  vein={colors.vein} scale={ls(0.28)} isAway={isAway} />

      {/* Upper pair — lighter color */}
      <Leaf x={stemX} y={upperY}  angle={-(spread*0.88)} fill={colors.leafMid} vein={colors.vein} scale={ls(0.50)} isAway={isAway} />
      <Leaf x={stemX} y={upperY}  angle={spread*0.88}    fill={colors.leafMid} vein={colors.vein} scale={ls(0.50)} isAway={isAway} />

      {/* Crown — appears last */}
      <Leaf x={stemX} y={crownY}  angle={-15}            fill={colors.leafMid} vein={colors.vein} scale={ls(0.72)} isAway={isAway} />
      <Leaf x={stemX} y={crownY}  angle={15}             fill={colors.leafMid} vein={colors.vein} scale={ls(0.72)} isAway={isAway} />
    </motion.svg>
  )
}
