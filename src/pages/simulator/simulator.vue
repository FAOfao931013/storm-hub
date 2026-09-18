<template>
  <view class="container">
    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>

    <view v-else-if="error" class="error">
      <text class="error-text">{{ error }}</text>
      <button class="retry-btn" @tap="retryLoad">重试</button>
    </view>

    <view v-else-if="hero" class="simulator">
      <!-- Fixed 5 scheme tabs -->
      <view class="scheme-tabs">
        <view 
          v-for="slotIndex in slots" 
          :key="slotIndex"
          class="scheme-tab"
          :class="{ 'scheme-tab-active': currentSlot === slotIndex }"
          @tap="switchToSlot(slotIndex)"
        >
          <text class="scheme-tab-text">{{ getSlotDisplayName(slotIndex) }}</text>
        </view>
      </view>

      <!-- Rename input -->
      <view class="rename-section">
        <input 
          class="rename-input" 
          v-model="currentSlotName" 
          @blur="updateCurrentSlotName"
          placeholder="方案名称"
          :maxlength="20"
        />
      </view>

      <!-- Hero info -->
      <view class="hero-info">
        <image 
          class="hero-portrait" 
          :src="heroIcon" 
          mode="aspectFill"
        />
        <view class="hero-text">
          <text class="hero-name-cn">{{ displayName }}</text>
          <text class="hero-name-en">{{ hero.name }}</text>
        </view>
        <view class="talent-shorthand">
          <text class="shorthand-text">{{ talentShorthand }}</text>
        </view>
      </view>

      <!-- Talent tiers -->
      <view class="talent-tiers">
        <view 
          v-for="level in talentLevels" 
          :key="level"
          class="tier-row"
          @tap="openTierDrawer(level)"
        >
          <view class="level-badge" :class="{ 'has-selection': selectedTalents[level] }">
            <text class="level-text">{{ level }}</text>
          </view>
          <view class="all-talents-row">
            <view 
              v-for="talent in getTalentsByLevel(level)" 
              :key="talent.name"
              class="talent-icon-wrapper"
              :class="{ 'talent-selected': isTalentSelectedAtLevel(talent, level) }"
            >
              <image 
                class="talent-icon-main"
                :src="getTalentIcon(talent.icon)"
                mode="aspectFill"
              />
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- Right drawer for talent selection -->
    <view 
      v-if="drawerVisible" 
      class="drawer-mask"
      @tap="closeDrawer"
    >
      <view class="drawer-content" @tap.stop>
        <view class="drawer-header">
          <text class="drawer-title">等级 {{ currentLevel }} 天赋</text>
          <view class="drawer-close" @tap="closeDrawer">
            <text>✕</text>
          </view>
        </view>
        <scroll-view class="drawer-body" scroll-y>
          <view 
            v-for="talent in currentLevelTalents" 
            :key="talent.name"
            class="drawer-talent-item"
            :class="{ 'selected': isSelected(talent) }"
            @tap="selectTalent(talent)"
          >
            <image 
              class="drawer-talent-icon"
              :src="getTalentIcon(talent.icon)"
              mode="aspectFill"
            />
            <view class="drawer-talent-info">
              <text class="drawer-talent-name">{{ talent.title }}</text>
              <text class="drawer-talent-desc">{{ talent.description }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- Right drawer for talent selection -->
    <view 
      v-if="drawerVisible" 
      class="drawer-mask"
      @tap="closeDrawer"
    >
      <view class="drawer-content" @tap.stop>
        <view class="drawer-header">
          <text class="drawer-title">等级 {{ currentLevel }} 天赋</text>
          <view class="drawer-close" @tap="closeDrawer">
            <text>✕</text>
          </view>
        </view>
        <scroll-view class="drawer-body" scroll-y>
          <view 
            v-for="talent in currentLevelTalents" 
            :key="talent.name"
            class="drawer-talent-item"
            :class="{ 'selected': isSelected(talent) }"
            @tap="selectTalent(talent)"
          >
            <image 
              class="drawer-talent-icon"
              :src="getTalentIcon(talent.icon)"
              mode="aspectFill"
            />
            <view class="drawer-talent-info">
              <text class="drawer-talent-name">{{ talent.title }}</text>
              <text class="drawer-talent-desc">{{ talent.description }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- Floating Save button -->
    <view v-if="hero" class="floating-save-btn" @tap="saveCurrentSlot">
      <text class="floating-save-text">保存</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import type { Hero, Talent } from '@/types/hero'
import {
  fetchHeroDetail,
  getHeroIconUrl,
  getTalentIconUrl,
  getHeroDisplayName
} from '@/api/heroes'
import {
  getHeroTalentBuilds,
  getSlotBuild,
  saveToSlot,
  renameSlot,
  convertSelectedTalentsToBuildSelection,
  getDefaultSlotName,
  type TalentBuild
} from '@/utils/talentBuilds'

const hero = ref<Hero | null>(null)
const talents = ref<Talent[]>([])
const selectedTalents = ref<Record<number, Talent>>({})
const loading = ref(false)
const error = ref('')
const currentHeroShortName = ref('')
const drawerVisible = ref(false)
const currentLevel = ref<number>(1)

// Slot-based build management
const currentSlot = ref<number>(0) // Active slot index (0-4)
const slotBuilds = ref<{ [key: number]: TalentBuild | null }>({})
const currentSlotName = ref<string>('')

const talentLevels = [1, 4, 7, 10, 13, 16, 20]

// Fixed 5 slots
const slots = [0, 1, 2, 3, 4]

const displayName = computed(() => {
  if (!hero.value) return ''
  return getHeroDisplayName(hero.value)
})

const heroIcon = computed(() => {
  if (!hero.value) return ''
  return getHeroIconUrl(hero.value.short_name)
})

// Generate talent shorthand like "4-4-1-2-3-1-3"
const talentShorthand = computed(() => {
  const parts: string[] = []
  
  for (const level of talentLevels) {
    const selected = selectedTalents.value[level]
    if (selected) {
      const levelTalents = getTalentsByLevel(level)
      const index = levelTalents.findIndex(t => t.name === selected.name)
      parts.push(String(index + 1)) // 1-based index
    } else {
      parts.push('-')
    }
  }
  
  return parts.join('-')
})

const currentLevelTalents = computed(() => {
  return getTalentsByLevel(currentLevel.value)
})

const getTalentsByLevel = (level: number) => {
  return talents.value
    .filter(t => t.level === level)
    .sort((a, b) => a.sort - b.sort)
}

const getTalentIcon = (icon: string) => {
  return getTalentIconUrl(icon)
}

const isSelected = (talent: Talent) => {
  const selected = selectedTalents.value[currentLevel.value]
  return selected?.name === talent.name
}

const isTalentSelectedAtLevel = (talent: Talent, level: number) => {
  const selected = selectedTalents.value[level]
  return selected?.name === talent.name
}

const openTierDrawer = (level: number) => {
  currentLevel.value = level
  drawerVisible.value = true
}

const closeDrawer = () => {
  drawerVisible.value = false
}

const selectTalent = (talent: Talent) => {
  selectedTalents.value[currentLevel.value] = talent
  closeDrawer()
}

const loadHeroData = async (heroShortName: string) => {
  loading.value = true
  error.value = ''
  currentHeroShortName.value = heroShortName

  try {
    const detail = await fetchHeroDetail(heroShortName)
    hero.value = detail.hero
    talents.value = detail.talents
    
    // Load all slot builds
    loadSlotBuilds()
    
    // Initialize to slot 0
    switchToSlot(0)
  } catch (err: any) {
    error.value = err.message || '加载失败'
    uni.showToast({
      title: error.value,
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

const loadSlotBuilds = () => {
  const heroBuilds = getHeroTalentBuilds(currentHeroShortName.value)
  slotBuilds.value = {}
  for (let i = 0; i < 5; i++) {
    slotBuilds.value[i] = heroBuilds[i] || null
  }
}

const getSlotDisplayName = (slotIndex: number): string => {
  const build = slotBuilds.value[slotIndex]
  if (build && build.name) {
    // Truncate long names
    return build.name.length > 6 ? build.name.substring(0, 6) + '...' : build.name
  }
  return getDefaultSlotName(slotIndex)
}

const switchToSlot = (slotIndex: number) => {
  currentSlot.value = slotIndex
  const build = slotBuilds.value[slotIndex]
  
  if (build) {
    // Apply slot's talent selections
    selectedTalents.value = {}
    for (const levelStr in build.selections) {
      const level = Number(levelStr)
      const talentName = build.selections[level]
      const talent = talents.value.find(t => t.level === level && t.name === talentName)
      if (talent) {
        selectedTalents.value[level] = talent
      }
    }
    currentSlotName.value = build.name
  } else {
    // Empty slot - clear selections
    selectedTalents.value = {}
    currentSlotName.value = getDefaultSlotName(slotIndex)
  }
}

const saveCurrentSlot = () => {
  const selections = convertSelectedTalentsToBuildSelection(selectedTalents.value)
  
  try {
    saveToSlot(
      currentHeroShortName.value,
      currentSlot.value,
      currentSlotName.value,
      selections
    )
    
    // Reload slots
    loadSlotBuilds()
    
    uni.showToast({
      title: '已保存',
      icon: 'success',
      duration: 1500
    })
  } catch (error: any) {
    uni.showToast({
      title: error.message || '保存失败',
      icon: 'none'
    })
  }
}

const updateCurrentSlotName = () => {
  const trimmedName = currentSlotName.value.trim()
  if (!trimmedName) {
    currentSlotName.value = getDefaultSlotName(currentSlot.value)
    return
  }
  
  // If slot has a saved build, rename it
  if (slotBuilds.value[currentSlot.value]) {
    try {
      renameSlot(currentHeroShortName.value, currentSlot.value, trimmedName)
      loadSlotBuilds()
      uni.showToast({
        title: '已重命名',
        icon: 'success',
        duration: 1500
      })
    } catch (error) {
      console.error('Failed to rename slot:', error)
    }
  }
}

const retryLoad = () => {
  if (currentHeroShortName.value) {
    loadHeroData(currentHeroShortName.value)
  }
}

onLoad((options: any) => {
  const heroShortName = options.hero
  if (heroShortName) {
    loadHeroData(heroShortName)
  } else {
    error.value = '缺少英雄参数'
  }
})
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
}

.loading,
.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  color: #fff;
}

.error-text {
  color: #f44336;
  font-size: 28rpx;
  margin-bottom: 20rpx;
}

.retry-btn {
  background: #4a90e2;
  color: #fff;
  border: none;
  padding: 16rpx 48rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.simulator {
  padding-bottom: 120rpx; /* Space for floating button */
}

/* Scheme tabs */
.scheme-tabs {
  display: flex;
  padding: 16rpx 32rpx;
  gap: 12rpx;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 2rpx solid rgba(255, 255, 255, 0.1);
}

.scheme-tab {
  flex: 1;
  padding: 16rpx 8rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.scheme-tab:active {
  transform: scale(0.95);
}

.scheme-tab-active {
  background: rgba(74, 144, 226, 0.3);
  border-color: rgba(74, 144, 226, 0.6);
  box-shadow: 0 0 8rpx rgba(74, 144, 226, 0.3);
}

.scheme-tab-text {
  font-size: 22rpx;
  color: #fff;
  font-weight: bold;
  text-align: center;
  word-break: break-all;
}

/* Rename section */
.rename-section {
  padding: 16rpx 32rpx;
  background: rgba(255, 255, 255, 0.05);
}

.rename-input {
  width: 100%;
  padding: 16rpx 20rpx;
  background: rgba(255, 255, 255, 0.1);
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  border-radius: 8rpx;
  color: #fff;
  font-size: 26rpx;
  text-align: center;
}

.hero-info {
  display: flex;
  align-items: center;
  padding: 32rpx;
  gap: 24rpx;
  background: rgba(255, 255, 255, 0.05);
}

.hero-portrait {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  border: 3rpx solid #4a90e2;
}

.hero-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.hero-name-cn {
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
}

.hero-name-en {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.6);
}

.talent-shorthand {
  background: rgba(74, 144, 226, 0.2);
  padding: 12rpx 20rpx;
  border-radius: 8rpx;
  border: 1rpx solid #4a90e2;
}

.shorthand-text {
  font-size: 24rpx;
  color: #4a90e2;
  font-family: monospace;
  font-weight: bold;
}

/* Floating save button */
.floating-save-btn {
  position: fixed;
  bottom: 40rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 300rpx;
  padding: 24rpx;
  background: linear-gradient(135deg, #4a90e2 0%, #3a7bc8 100%);
  border-radius: 50rpx;
  box-shadow: 0 8rpx 24rpx rgba(74, 144, 226, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  transition: all 0.3s;
}

.floating-save-btn:active {
  transform: translateX(-50%) scale(0.95);
  box-shadow: 0 4rpx 12rpx rgba(74, 144, 226, 0.3);
}

.floating-save-text {
  font-size: 32rpx;
  color: #fff;
  font-weight: bold;
}

.talent-tiers {
  padding: 24rpx 32rpx;
}

.tier-row {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 24rpx;
  padding: 20rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s;
}

.tier-row:active {
  background: rgba(74, 144, 226, 0.2);
  border-color: #4a90e2;
}

.level-badge {
  width: 80rpx;
  height: 80rpx;
  /* Outer darker border shadow */
  background: linear-gradient(135deg, #1a1a2e 0%, #2a2a4e 100%);
  clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  transition: all 0.3s;
  /* Multi-layer depth shadows */
  box-shadow: 
    0 4rpx 12rpx rgba(0, 0, 0, 0.6),
    0 2rpx 6rpx rgba(0, 0, 0, 0.4),
    inset 0 -2rpx 4rpx rgba(0, 0, 0, 0.5);
}

/* Inner bevel/highlight ring + core gradient */
.level-badge::before {
  content: '';
  position: absolute;
  inset: 3rpx;
  clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);
  /* Core diagonal gradient: purple-blue with top-to-bottom shading */
  background: 
    linear-gradient(135deg, 
      #6b5fb5 0%,
      #5a4ea0 15%,
      #4a3d8b 30%,
      #3a5f9e 50%,
      #2a4d82 70%,
      #1a3a66 85%,
      #0f2847 100%
    );
  box-shadow: 
    inset 0 2rpx 4rpx rgba(255, 255, 255, 0.15),
    inset 0 -2rpx 6rpx rgba(0, 0, 0, 0.4);
  pointer-events: none;
}

/* Top diagonal specular highlight (glass/metal facet) */
.level-badge::after {
  content: '';
  position: absolute;
  top: 8rpx;
  left: 12rpx;
  right: 28rpx;
  height: 24rpx;
  clip-path: polygon(0% 0%, 100% 0%, 85% 100%, 15% 100%);
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.35) 0%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  pointer-events: none;
  transition: all 0.3s;
}

/* Selected state: subtle cool accent, still layered */
.level-badge.has-selection {
  background: linear-gradient(135deg, #2a3a4a 0%, #3a4a5a 100%);
  box-shadow: 
    0 4rpx 12rpx rgba(100, 140, 180, 0.3),
    0 2rpx 6rpx rgba(80, 120, 160, 0.2),
    0 0 16rpx rgba(120, 160, 200, 0.15),
    inset 0 -2rpx 4rpx rgba(0, 0, 0, 0.4);
}

.level-badge.has-selection::before {
  background: 
    linear-gradient(135deg, 
      #7a8fb5 0%,
      #6a7fa5 15%,
      #5a6f95 30%,
      #4a5f85 50%,
      #3a4f75 70%,
      #2a3f65 85%,
      #1a2f55 100%
    );
  box-shadow: 
    inset 0 2rpx 4rpx rgba(180, 200, 220, 0.2),
    inset 0 -2rpx 6rpx rgba(0, 0, 0, 0.3),
    inset 0 0 0 1rpx rgba(140, 180, 220, 0.3);
}

.level-badge.has-selection::after {
  background: linear-gradient(135deg, 
    rgba(220, 235, 255, 0.4) 0%,
    rgba(180, 210, 240, 0.25) 50%,
    rgba(140, 185, 220, 0.1) 100%
  );
}

.level-text {
  font-size: 34rpx;
  font-weight: 700;
  color: #fff;
  text-shadow: 
    0 2rpx 4rpx rgba(0, 0, 0, 0.6),
    0 1rpx 2rpx rgba(0, 0, 0, 0.8),
    0 0 8rpx rgba(255, 255, 255, 0.15);
  letter-spacing: 0rpx;
  position: relative;
  z-index: 1;
}

.all-talents-row {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
}

.talent-icon-wrapper {
  position: relative;
}

.talent-icon-main {
  width: 64rpx;
  height: 64rpx;
  border-radius: 8rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  opacity: 0.4;
  transition: all 0.3s;
}

.talent-icon-wrapper.talent-selected .talent-icon-main {
  opacity: 1;
  border: 2rpx solid rgba(160, 180, 210, 0.7);
  box-shadow: 
    0 0 8rpx rgba(140, 160, 200, 0.25),
    0 0 16rpx rgba(120, 150, 190, 0.15),
    inset 0 1rpx 2rpx rgba(180, 200, 230, 0.2);
}

/* Drawer styles */
.drawer-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.drawer-content {
  width: 600rpx;
  height: 100%;
  background: #1a1a2e;
  display: flex;
  flex-direction: column;
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.drawer-header {
  padding: 32rpx;
  border-bottom: 2rpx solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.drawer-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
}

.drawer-close {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 36rpx;
}

.drawer-body {
  flex: 1;
  padding: 24rpx;
}

.drawer-talent-item {
  display: flex;
  gap: 16rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s;
}

.drawer-talent-item.selected {
  background: rgba(100, 130, 170, 0.15);
  border-color: rgba(140, 170, 210, 0.6);
  box-shadow: 0 0 10rpx rgba(120, 150, 190, 0.2), inset 0 1rpx 2rpx rgba(160, 190, 220, 0.15);
}

.drawer-talent-item:active {
  transform: scale(0.98);
}

.drawer-talent-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
}

.drawer-talent-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.drawer-talent-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #fff;
}

.drawer-talent-desc {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
}
</style>
