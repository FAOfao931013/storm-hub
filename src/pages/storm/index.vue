<template>
  <view class="storm-page">
    <!-- Storm Canvas -->
    <canvas 
      canvas-id="stormCanvas"
      type="2d" 
      id="stormCanvas"
      class="storm-canvas"
    ></canvas>
    
    <!-- Storm Title -->
    <view class="storm-header">
      <text class="storm-title">风暴聚集</text>
    </view>
    
    <!-- Join Button -->
    <view class="join-container">
      <button class="join-btn" @tap="onJoin">
        <text class="join-text">加入</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Particle {
  angle: number        // Position around tornado (radians)
  height: number       // Height from ground (0-1)
  radius: number       // Distance from center at this height
  speed: number        // Rotation speed
  size: number         // Particle size
  opacity: number      // Particle opacity
  color: string        // Particle color
}

const targetIntensity = ref(1.0)
const displayedIntensity = ref(1.0)
const MAX_INTENSITY = 3.0
const INTENSITY_INCREMENT = 0.2

let canvas: any = null
let ctx: any = null
let animationFrame: number = 0
let particles: Particle[] = []
let canvasWidth = 375
let canvasHeight = 667
let lastTime = 0

// Tornado parameters
const baseTornadoHeight = 280
const baseTornadoWidth = 60
const baseRotationSpeed = 0.02

const initCanvas = async () => {
  try {
    const query = uni.createSelectorQuery()
    query.select('#stormCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (res && res[0]) {
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
          animate()
        }
      })
  } catch (error) {
    console.error('Failed to initialize canvas:', error)
  }
}

const initParticles = () => {
  particles = []
  const baseCount = 60
  
  for (let i = 0; i < baseCount; i++) {
    particles.push(createParticle())
  }
}

const createParticle = (): Particle => {
  const height = Math.random()
  const radius = Math.random() * 30 + 10
  
  return {
    angle: Math.random() * Math.PI * 2,
    height: height,
    radius: radius,
    speed: 0.8 + Math.random() * 0.4,
    size: 2 + Math.random() * 3,
    opacity: 0.3 + Math.random() * 0.4,
    color: Math.random() > 0.7 ? 'rgba(150, 120, 180, ' : 'rgba(100, 80, 120, '
  }
}

const animate = () => {
  if (!ctx || !canvas) return
  
  const now = Date.now()
  const deltaTime = Math.min((now - lastTime) / 1000, 0.1) // Cap at 0.1s
  lastTime = now
  
  // Lerp displayed intensity toward target (smooth transition over ~0.6s)
  const lerpSpeed = 1.8 // Higher = faster transition
  displayedIntensity.value += (targetIntensity.value - displayedIntensity.value) * lerpSpeed * deltaTime
  
  // Clear canvas with dark background
  ctx.fillStyle = 'rgba(25, 15, 45, 1)'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)
  
  // Draw subtle background mist
  drawBackgroundMist()
  
  // Draw tornado
  drawTornado()
  
  animationFrame = requestAnimationFrame(animate)
}

const drawBackgroundMist = () => {
  const intensity = displayedIntensity.value
  const mistCount = Math.floor(8 * intensity)
  
  for (let i = 0; i < mistCount; i++) {
    const x = (Math.sin(Date.now() * 0.0003 + i) * 0.5 + 0.5) * canvasWidth
    const y = (Math.cos(Date.now() * 0.0002 + i) * 0.5 + 0.5) * canvasHeight
    const size = 40 + Math.random() * 60
    
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size)
    gradient.addColorStop(0, `rgba(60, 40, 90, ${0.05 * intensity})`)
    gradient.addColorStop(1, 'rgba(60, 40, 90, 0)')
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }
}

const drawTornado = () => {
  const intensity = displayedIntensity.value
  const centerX = canvasWidth / 2
  const groundY = canvasHeight * 0.75
  
  // Scale tornado dimensions with intensity
  const tornadoHeight = baseTornadoHeight * intensity
  const tornadoTopWidth = baseTornadoWidth * intensity * 1.5
  const tornadoBottomWidth = baseTornadoWidth * intensity * 0.4
  const rotationSpeed = baseRotationSpeed * intensity
  
  // Update and draw particles in tornado shape
  particles.forEach((particle, index) => {
    // Update particle angle (rotation)
    particle.angle += rotationSpeed * particle.speed
    
    // Gradually move particles upward and reset at top
    particle.height += 0.003 * intensity * particle.speed
    if (particle.height > 1) {
      particle.height = 0
      particle.angle = Math.random() * Math.PI * 2
    }
    
    // Calculate position in tornado funnel
    // Wider at top, narrower at bottom
    const heightRatio = particle.height
    const radiusAtHeight = tornadoBottomWidth + (tornadoTopWidth - tornadoBottomWidth) * heightRatio
    const actualRadius = radiusAtHeight * (particle.radius / 30) // Normalize radius
    
    const x = centerX + Math.cos(particle.angle) * actualRadius
    const y = groundY - heightRatio * tornadoHeight
    
    // Draw particle
    const particleOpacity = particle.opacity * (0.6 + heightRatio * 0.4) // More visible higher up
    ctx.fillStyle = particle.color + particleOpacity + ')'
    ctx.beginPath()
    ctx.arc(x, y, particle.size * intensity * 0.8, 0, Math.PI * 2)
    ctx.fill()
  })
  
  // Optional subtle glow at base of tornado
  const glowGradient = ctx.createRadialGradient(
    centerX, groundY, 0,
    centerX, groundY, tornadoBottomWidth * 3
  )
  glowGradient.addColorStop(0, `rgba(100, 80, 150, ${0.15 * intensity})`)
  glowGradient.addColorStop(1, 'rgba(100, 80, 150, 0)')
  ctx.fillStyle = glowGradient
  ctx.beginPath()
  ctx.arc(centerX, groundY, tornadoBottomWidth * 3, 0, Math.PI * 2)
  ctx.fill()
  
  // Subtle lightning only at high intensity (optional, very subtle)
  if (intensity > 2.5 && Math.random() < 0.008) {
    drawSubtleLightning(centerX, groundY - tornadoHeight)
  }
}

const drawSubtleLightning = (x: number, y: number) => {
  ctx.strokeStyle = `rgba(150, 180, 255, 0.2)`
  ctx.lineWidth = 1
  ctx.lineCap = 'round'
  
  ctx.beginPath()
  ctx.moveTo(x, y)
  
  let currentX = x
  let currentY = y
  
  for (let i = 0; i < 3; i++) {
    currentX += (Math.random() - 0.5) * 30
    currentY += 20
    ctx.lineTo(currentX, currentY)
  }
  
  ctx.stroke()
}

const onJoin = () => {
  if (targetIntensity.value < MAX_INTENSITY) {
    targetIntensity.value = Math.min(MAX_INTENSITY, targetIntensity.value + INTENSITY_INCREMENT)
    
    // Add more particles for denser effect
    const newParticleCount = Math.floor(15 * targetIntensity.value)
    for (let i = 0; i < newParticleCount; i++) {
      particles.push(createParticle())
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
      duration: 800
    })
  } else {
    uni.showToast({
      title: '风暴已达最强！',
      icon: 'none',
      duration: 1000
    })
  }
}

onMounted(() => {
  initCanvas()
})

onUnmounted(() => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
})
</script>

<style scoped>
.storm-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(180deg, 
    rgb(25, 15, 45) 0%,
    rgb(40, 25, 70) 50%,
    rgb(30, 20, 50) 100%
  );
}

.storm-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
}

.storm-header {
  position: absolute;
  top: 80rpx;
  left: 0;
  right: 0;
  text-align: center;
  z-index: 10;
}

.storm-title {
  display: block;
  font-size: 64rpx;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 
    0 0 20rpx rgba(100, 150, 200, 0.4),
    0 0 40rpx rgba(100, 130, 200, 0.2);
}

.join-container {
  position: absolute;
  bottom: 150rpx;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  z-index: 10;
}

.join-btn {
  width: 300rpx;
  height: 100rpx;
  background: linear-gradient(135deg, 
    rgba(100, 150, 255, 0.8) 0%,
    rgba(120, 100, 255, 0.8) 100%
  );
  border: 3rpx solid rgba(150, 200, 255, 0.6);
  border-radius: 50rpx;
  box-shadow: 
    0 0 30rpx rgba(100, 150, 255, 0.5),
    0 8rpx 24rpx rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.join-btn::after {
  border: none;
}

.join-btn:active {
  transform: scale(0.95);
  box-shadow: 
    0 0 40rpx rgba(100, 150, 255, 0.8),
    0 4rpx 12rpx rgba(0, 0, 0, 0.3);
}

.join-text {
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
}
</style>
