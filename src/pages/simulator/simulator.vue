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
      <!-- Build name header -->
      <view class="build-header">
        <text class="build-name">未命名天赋</text>
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
          <view class="level-badge">
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
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import type { Hero, Talent } from '@/types/hero'
import { 
  fetchHeroes, 
  fetchTalents, 
  getHeroIconUrl, 
  getTalentIconUrl,
  getChineseName 
} from '@/api/heroes'
import { fetchZhcnHeroData, mergeZhcnTalents } from '@/utils/zhcn'

const hero = ref<Hero | null>(null)
const talents = ref<Talent[]>([])
const selectedTalents = ref<Record<number, Talent>>({})
const loading = ref(false)
const error = ref('')
const currentHeroShortName = ref('')
const drawerVisible = ref(false)
const currentLevel = ref<number>(1)

const talentLevels = [1, 4, 7, 10, 13, 16, 20]

const displayName = computed(() => {
  if (!hero.value) return ''
  const chineseName = getChineseName(hero.value.translations)
  return chineseName || hero.value.name
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
    const allHeroes = await fetchHeroes()
    const foundHero = allHeroes.find(h => h.short_name === heroShortName)
    
    if (!foundHero) {
      throw new Error('英雄不存在')
    }
    
    hero.value = foundHero

    const [talentsData, zhcnData] = await Promise.allSettled([
      fetchTalents(foundHero.name),
      fetchZhcnHeroData(heroShortName)
    ])

    const talentsEn = talentsData.status === 'fulfilled' ? talentsData.value : []
    const zhcn = zhcnData.status === 'fulfilled' ? zhcnData.value : null
    
    talents.value = mergeZhcnTalents(talentsEn, zhcn)

    if (talentsData.status === 'rejected') {
      console.warn('Talents fetch failed:', talentsData.reason)
    }
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
  padding-bottom: 40rpx;
}

.build-header {
  padding: 32rpx;
  text-align: center;
  border-bottom: 2rpx solid rgba(255, 255, 255, 0.1);
}

.build-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
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
  background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
  clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.level-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
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
  border: 3rpx solid #00ffff;
  box-shadow: 0 0 12rpx rgba(0, 255, 255, 0.6), 0 0 24rpx rgba(0, 255, 255, 0.3);
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
  background: rgba(74, 144, 226, 0.2);
  border-color: #00ffff;
  box-shadow: 0 0 12rpx rgba(0, 255, 255, 0.3);
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
