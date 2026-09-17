<template>
  <view class="storm-page" :style="{ height: pageHeight + 'px' }">
    <view class="canvas-wrap">
      <canvas canvas-id="stormCanvas" type="2d" id="stormCanvas" class="storm-canvas"></canvas>
    </view>

    <view class="join-container">
      <view class="join-btn" @tap="onJoin">
        <text class="join-text">加入</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, getCurrentInstance, onUnmounted } from 'vue'
import { onReady } from '@dcloudio/uni-app'

type ParticleKind = 'dust' | 'wispy' | 'spark'

interface Particle {
  kind: ParticleKind
  angle: number
  height: number
  radiusFactor: number
  spin: number
  size: number
  opacity: number
  streak: number
  lift: number
  turb: number
  turbSpeed: number
}

const targetIntensity = ref(1.0)
const displayedIntensity = ref(1.0)
const MAX_INTENSITY = 3.0
const INTENSITY_INCREMENT = 0.2

let canvas: any = null
let ctx: any = null
let animationFrame: number = 0
let animating = false
let particles: Particle[] = []
let canvasWidth = 375
let canvasHeight = 667
let lastTime = 0
const instance = getCurrentInstance()
const pageHeight = uni.getSystemInfoSync().windowHeight

const requestFrame = (callback: () => void): number => {
  if (canvas && typeof canvas.requestAnimationFrame === 'function') {
    return canvas.requestAnimationFrame(callback)
  }
  const g = globalThis as any
  if (g && typeof g.requestAnimationFrame === 'function') {
    return g.requestAnimationFrame(callback)
  }
  return setTimeout(callback, 16) as unknown as number
}

const cancelFrame = (id: number) => {
  if (!id) return
  if (canvas && typeof canvas.cancelAnimationFrame === 'function') {
    canvas.cancelAnimationFrame(id)
    return
  }
  const g = globalThis as any
  if (g && typeof g.cancelAnimationFrame === 'function') {
    g.cancelAnimationFrame(id)
    return
  }
  clearTimeout(id)
}

const baseTornadoHeight = 300
const baseTornadoWidth = 70
const baseRotationSpeed = 2.4

const initCanvas = async () => {
  try {
    const query = uni.createSelectorQuery().in(instance?.proxy as any)
    query
      .select('#stormCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (res && res[0] && res[0].node) {
          canvas = res[0].node
          ctx = canvas.getContext('2d')

          // Get actual display size
          const dpr = uni.getSystemInfoSync().pixelRatio || 2
          canvasWidth = res[0].width
          canvasHeight = res[0].height

          // Scale canvas for retina
          canvas.width = canvasWidth * dpr
          canvas.height = canvasHeight * dpr
          ctx.scale(dpr, dpr)

          // Initialize particles
          initParticles()

          // Start animation
          lastTime = Date.now()
          animating = true
          animate()
        }
      })
  } catch (error) {
    console.error('Failed to initialize canvas:', error)
  }
}

const initParticles = () => {
  particles = []
  for (let i = 0; i < 90; i++) {
    particles.push(createParticle())
  }
}

const createParticle = (kind?: ParticleKind): Particle => {
  const roll = Math.random()
  const resolved: ParticleKind = kind || (roll > 0.82 ? 'spark' : roll > 0.45 ? 'wispy' : 'dust')
  const isWispy = resolved === 'wispy'
  const isSpark = resolved === 'spark'

  return {
    kind: resolved,
    angle: Math.random() * Math.PI * 2,
    height: Math.random(),
    radiusFactor: 0.45 + Math.random() * 0.9,
    spin: (isWispy ? 0.7 : 1) * (0.75 + Math.random() * 0.7),
    size: isSpark ? 1.2 + Math.random() : isWispy ? 1.1 + Math.random() * 1.4 : 0.8 + Math.random() * 1.2,
    opacity: isSpark ? 0.45 + Math.random() * 0.4 : 0.18 + Math.random() * 0.35,
    streak: isWispy ? 18 + Math.random() * 28 : isSpark ? 10 + Math.random() * 14 : 6 + Math.random() * 10,
    lift: 0.08 + Math.random() * 0.16,
    turb: Math.random() * Math.PI * 2,
    turbSpeed: 1.2 + Math.random() * 2.4,
  }
}

const animate = () => {
  if (!animating || !ctx || !canvas) return

  const now = Date.now()
  const deltaTime = Math.min((now - lastTime) / 1000, 0.1) // Cap at 0.1s
  lastTime = now

  // Lerp displayed intensity toward target (smooth transition over ~0.6s)
  const lerpSpeed = 1.8 // Higher = faster transition
  displayedIntensity.value += (targetIntensity.value - displayedIntensity.value) * lerpSpeed * deltaTime

  // Clear canvas with dark background
  ctx.fillStyle = 'rgba(18, 12, 36, 1)'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  drawWindGusts(now)
  drawTornado(deltaTime)

  animationFrame = requestFrame(animate)
}

const particleColor = (kind: ParticleKind, alpha: number) => {
  if (kind === 'spark') return `rgba(230, 236, 255, ${alpha})`
  if (kind === 'wispy') return `rgba(176, 196, 230, ${alpha})`
  return `rgba(198, 208, 228, ${alpha})`
}

const drawWindGusts = (now: number) => {
  const intensity = displayedIntensity.value
  const gustCount = 10 + Math.floor(intensity * 4)
  ctx.lineCap = 'round'

  for (let i = 0; i < gustCount; i++) {
    const t = now * (0.00035 + i * 0.00004) * (0.8 + intensity * 0.35)
    const y = ((i * 97 + t * 40) % (canvasHeight + 80)) - 40
    const wave = Math.sin(t * 2.2 + i) * (18 + intensity * 10)
    const length = canvasWidth * (0.35 + (i % 5) * 0.08)
    const startX = ((t * 120 + i * 80) % (canvasWidth + length)) - length * 0.3

    ctx.strokeStyle = `rgba(190, 205, 230, ${0.035 + (i % 3) * 0.02 * intensity})`
    ctx.lineWidth = 1 + (i % 3) * 0.6
    ctx.beginPath()
    ctx.moveTo(startX, y)
    ctx.bezierCurveTo(
      startX + length * 0.35,
      y - wave,
      startX + length * 0.7,
      y + wave * 0.6,
      startX + length,
      y + wave * 0.15
    )
    ctx.stroke()
  }
}

const drawSpiralRibbons = (
  centerX: number,
  groundY: number,
  tornadoHeight: number,
  topWidth: number,
  bottomWidth: number,
  intensity: number,
  time: number
) => {
  const ribbonCount = 5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (let r = 0; r < ribbonCount; r++) {
    const phase = time * (0.9 + r * 0.12) * intensity + r * ((Math.PI * 2) / ribbonCount)
    ctx.beginPath()

    for (let s = 0; s <= 28; s++) {
      const h = s / 28
      const angle = phase + h * Math.PI * 2 * 3.2
      const radius = (bottomWidth + (topWidth - bottomWidth) * h) * (0.55 + r * 0.12)
      const x = centerX + Math.cos(angle) * radius
      const y = groundY - h * tornadoHeight
      if (s === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }

    ctx.strokeStyle = `rgba(186, 204, 235, ${0.07 + r * 0.018 * intensity})`
    ctx.lineWidth = 1.1 + intensity * 0.35
    ctx.stroke()
  }
}

const drawTornado = (deltaTime: number) => {
  const intensity = displayedIntensity.value
  const centerX = canvasWidth / 2
  const groundY = canvasHeight * 0.78
  const tornadoHeight = baseTornadoHeight * (0.85 + intensity * 0.22)
  const tornadoTopWidth = baseTornadoWidth * (1.15 + intensity * 0.55)
  const tornadoBottomWidth = baseTornadoWidth * (0.22 + intensity * 0.08)
  const rotationSpeed = baseRotationSpeed * (0.55 + intensity * 0.55)
  const time = Date.now() / 1000

  const coreGlow = ctx.createRadialGradient(
    centerX,
    groundY - tornadoHeight * 0.35,
    8,
    centerX,
    groundY - tornadoHeight * 0.2,
    tornadoTopWidth * 1.1
  )
  coreGlow.addColorStop(0, `rgba(150, 170, 220, ${0.07 * intensity})`)
  coreGlow.addColorStop(1, 'rgba(150, 170, 220, 0)')
  ctx.fillStyle = coreGlow
  ctx.beginPath()
  ctx.arc(centerX, groundY - tornadoHeight * 0.28, tornadoTopWidth * 0.75, 0, Math.PI * 2)
  ctx.fill()

  drawSpiralRibbons(centerX, groundY, tornadoHeight, tornadoTopWidth, tornadoBottomWidth, intensity, time)

  particles.forEach((particle) => {
    const shear = 1.15 + particle.height * 0.85
    particle.angle += rotationSpeed * particle.spin * shear * deltaTime
    particle.height += particle.lift * (0.35 + intensity * 0.4) * deltaTime
    particle.turb += particle.turbSpeed * deltaTime

    if (particle.height > 1.05) {
      particle.height = -0.05
      particle.angle = Math.random() * Math.PI * 2
      particle.radiusFactor = 0.45 + Math.random() * 0.9
    }

    const h = Math.max(0, Math.min(1, particle.height))
    const funnel = tornadoBottomWidth + (tornadoTopWidth - tornadoBottomWidth) * Math.pow(h, 0.85)
    const wobble = Math.sin(particle.turb + particle.angle * 2.2) * funnel * 0.16
    const flung = Math.sin(particle.turb * 0.65) * funnel * 0.08 * intensity
    const radius = funnel * particle.radiusFactor + wobble + flung

    const x = centerX + Math.cos(particle.angle) * radius
    const y = groundY - h * tornadoHeight

    const tangentX = -Math.sin(particle.angle)
    const tangentY = -0.22 - h * 0.12
    const len = particle.streak * (0.7 + intensity * 0.45) * (0.7 + shear * 0.25)
    const fade = particle.opacity * (0.45 + h * 0.55) * (0.75 + intensity * 0.15)

    ctx.strokeStyle = particleColor(particle.kind, fade)
    ctx.lineWidth = particle.size * (particle.kind === 'wispy' ? 1.15 : 1) * (0.85 + intensity * 0.15)
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x - tangentX * len, y - tangentY * len * 0.35)
    ctx.lineTo(x + tangentX * len * 0.35, y + tangentY * len * 0.12)
    ctx.stroke()

    if (particle.kind === 'spark') {
      ctx.fillStyle = particleColor('spark', fade * 0.9)
      ctx.beginPath()
      ctx.arc(x, y, particle.size * 0.7, 0, Math.PI * 2)
      ctx.fill()
    }
  })

  const baseGlow = ctx.createRadialGradient(centerX, groundY, 0, centerX, groundY, tornadoBottomWidth * 5)
  baseGlow.addColorStop(0, `rgba(170, 190, 230, ${0.1 * intensity})`)
  baseGlow.addColorStop(1, 'rgba(170, 190, 230, 0)')
  ctx.fillStyle = baseGlow
  ctx.beginPath()
  ctx.arc(centerX, groundY, tornadoBottomWidth * 3.2, 0, Math.PI * 2)
  ctx.fill()
}

const onJoin = () => {
  if (targetIntensity.value < MAX_INTENSITY) {
    targetIntensity.value = Math.min(MAX_INTENSITY, targetIntensity.value + INTENSITY_INCREMENT)

    // Add more particles for denser effect
    const newParticleCount = Math.floor(18 * targetIntensity.value)
    for (let i = 0; i < newParticleCount; i++) {
      particles.push(createParticle(i % 3 === 0 ? 'wispy' : i % 5 === 0 ? 'spark' : 'dust'))
    }

    // Keep particle count reasonable
    if (particles.length > 200) {
      particles = particles.slice(-200)
    }

    // Visual feedback
    uni.vibrateShort({ type: 'light' })

    uni.showToast({
      title: `风暴强度 ${targetIntensity.value.toFixed(1)}`,
      icon: 'none',
      duration: 800,
    })
  } else {
    uni.showToast({
      title: '风暴已达最强！',
      icon: 'none',
      duration: 1000,
    })
  }
}

onReady(() => {
  initCanvas()
})

onUnmounted(() => {
  animating = false
  cancelFrame(animationFrame)
})
</script>

<style scoped>
.storm-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: hidden;
  background: linear-gradient(180deg, rgb(25, 15, 45) 0%, rgb(40, 25, 70) 50%, rgb(30, 20, 50) 100%);
}

.storm-header {
  flex-shrink: 0;
  padding: 48rpx 0 24rpx;
  text-align: center;
}

.storm-title {
  display: block;
  font-size: 64rpx;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.9);
}

.canvas-wrap {
  flex: 1;
  position: relative;
  width: 100%;
  min-height: 0;
}

.storm-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.join-container {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  padding: 24rpx 0 40rpx;
}

.join-btn {
  width: 300rpx;
  height: 88rpx;
  background: linear-gradient(135deg, rgba(100, 150, 255, 0.9) 0%, rgba(120, 100, 255, 0.9) 100%);
  border: 3rpx solid rgba(150, 200, 255, 0.6);
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.join-btn:active {
  opacity: 0.85;
}

.join-text {
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
}
</style>
