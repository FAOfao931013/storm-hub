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
      <text class="storm-subtitle">Storm Gathering</text>
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
  x: number
  y: number
  vx: number
  vy: number
  opacity: number
  size: number
  type: 'rain' | 'mist'
}

const intensity = ref(1.0)
const MAX_INTENSITY = 3.0
const INTENSITY_INCREMENT = 0.15

let canvas: any = null
let ctx: any = null
let animationFrame: number = 0
let particles: Particle[] = []
let lastLightning = 0
let canvasWidth = 375
let canvasHeight = 667

// Lightning flash state
let lightningOpacity = 0
let lightningDecay = 0

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
          animate()
        }
      })
  } catch (error) {
    console.error('Failed to initialize canvas:', error)
  }
}

const initParticles = () => {
  particles = []
  const baseCount = 50
  const count = Math.floor(baseCount * intensity.value)
  
  for (let i = 0; i < count; i++) {
    particles.push(createParticle())
  }
}

const createParticle = (): Particle => {
  const type = Math.random() > 0.7 ? 'mist' : 'rain'
  
  if (type === 'rain') {
    return {
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight - canvasHeight,
      vx: -1 - Math.random() * 2,
      vy: 8 + Math.random() * 8 * intensity.value,
      opacity: 0.3 + Math.random() * 0.4,
      size: 1 + Math.random() * 2,
      type: 'rain'
    }
  } else {
    return {
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      vx: -0.5 + Math.random() * 1,
      vy: -0.3 - Math.random() * 0.5,
      opacity: 0.1 + Math.random() * 0.2,
      size: 20 + Math.random() * 40,
      type: 'mist'
    }
  }
}

const animate = () => {
  if (!ctx || !canvas) return
  
  // Clear canvas with dark background
  ctx.fillStyle = 'rgba(25, 15, 45, 1)'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)
  
  // Draw lightning flash overlay
  if (lightningOpacity > 0) {
    ctx.fillStyle = `rgba(150, 200, 255, ${lightningOpacity * 0.3})`
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    lightningOpacity = Math.max(0, lightningOpacity - lightningDecay)
  }
  
  // Update and draw particles
  particles.forEach((particle, index) => {
    // Update position
    particle.x += particle.vx * intensity.value
    particle.y += particle.vy * intensity.value
    
    // Reset particle if out of bounds
    if (particle.type === 'rain') {
      if (particle.y > canvasHeight + 10) {
        particles[index] = createParticle()
      }
    } else {
      if (particle.y < -particle.size || particle.x < -particle.size || particle.x > canvasWidth + particle.size) {
        particles[index] = createParticle()
      }
    }
    
    // Draw particle
    if (particle.type === 'rain') {
      ctx.strokeStyle = `rgba(100, 200, 255, ${particle.opacity})`
      ctx.lineWidth = particle.size
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(particle.x, particle.y)
      ctx.lineTo(particle.x + particle.vx * 3, particle.y + particle.vy * 0.5)
      ctx.stroke()
    } else {
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size
      )
      gradient.addColorStop(0, `rgba(80, 60, 120, ${particle.opacity})`)
      gradient.addColorStop(1, 'rgba(80, 60, 120, 0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fill()
    }
  })
  
  // Random lightning
  const now = Date.now()
  if (now - lastLightning > 2000) {
    const chance = 0.01 * intensity.value
    if (Math.random() < chance) {
      lastLightning = now
      lightningOpacity = 0.8 + Math.random() * 0.2
      lightningDecay = 0.05 + Math.random() * 0.05
      
      // Draw lightning bolt
      drawLightning()
    }
  }
  
  animationFrame = requestAnimationFrame(animate)
}

const drawLightning = () => {
  if (!ctx) return
  
  ctx.strokeStyle = `rgba(200, 220, 255, ${lightningOpacity})`
  ctx.lineWidth = 2 + Math.random() * 3
  ctx.lineCap = 'round'
  ctx.lineJoin = 'miter'
  
  ctx.beginPath()
  let x = canvasWidth * (0.3 + Math.random() * 0.4)
  let y = 0
  ctx.moveTo(x, y)
  
  // Draw zigzag lightning
  const segments = 5 + Math.floor(Math.random() * 8)
  for (let i = 0; i < segments; i++) {
    x += (Math.random() - 0.5) * 40 * intensity.value
    y += canvasHeight / segments
    ctx.lineTo(x, y)
  }
  
  ctx.stroke()
  
  // Add glow
  ctx.strokeStyle = `rgba(150, 200, 255, ${lightningOpacity * 0.5})`
  ctx.lineWidth = 6 + Math.random() * 4
  ctx.stroke()
}

const onJoin = () => {
  if (intensity.value < MAX_INTENSITY) {
    intensity.value = Math.min(MAX_INTENSITY, intensity.value + INTENSITY_INCREMENT)
    
    // Add more particles on join
    const newCount = Math.floor(20 * intensity.value)
    for (let i = 0; i < newCount; i++) {
      particles.push(createParticle())
    }
    
    // Trigger lightning
    lightningOpacity = 1.0
    lightningDecay = 0.08
    
    // Visual feedback
    uni.vibrateShort({ type: 'light' })
    
    uni.showToast({
      title: `风暴强度 ${intensity.value.toFixed(1)}`,
      icon: 'none',
      duration: 1000
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
  top: 100rpx;
  left: 0;
  right: 0;
  text-align: center;
  z-index: 10;
}

.storm-title {
  display: block;
  font-size: 72rpx;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 
    0 0 20rpx rgba(100, 200, 255, 0.5),
    0 0 40rpx rgba(100, 150, 255, 0.3);
  margin-bottom: 20rpx;
}

.storm-subtitle {
  display: block;
  font-size: 28rpx;
  color: rgba(150, 180, 255, 0.8);
  letter-spacing: 4rpx;
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
