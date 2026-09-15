<template>
  <view class="container">
    <scroll-view 
      class="content"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view v-if="loading && !hero" class="loading">
        <text>加载中...</text>
      </view>

      <view v-else-if="error" class="error">
        <text class="error-text">{{ error }}</text>
        <button class="retry-btn" @tap="loadHeroData">重试</button>
      </view>

      <view v-else-if="hero">
        <!-- Hero header -->
        <view class="hero-header">
          <image 
            class="hero-portrait" 
            :src="heroIcon" 
            mode="aspectFill"
            @error="onImageError"
          />
          <view class="hero-header-info">
            <view class="hero-name-cn">{{ displayName }}</view>
            <view class="hero-name-en">{{ hero.name }}</view>
            <view class="hero-meta">
              <text class="role-tag">{{ hero.new_role || hero.role }}</text>
              <text class="type-tag">{{ hero.type }}</text>
            </view>
          </view>
          <view class="favorite-btn" @tap="onToggleFavorite">
            <text class="star">{{ isFavorite ? '★' : '☆' }}</text>
          </view>
        </view>

        <!-- Abilities section -->
        <view v-if="abilities.length > 0" class="section">
          <view class="section-title">技能</view>
          <view class="abilities">
            <view 
              v-for="ability in abilities" 
              :key="ability.name"
              class="ability-item"
            >
              <image 
                v-if="ability.icon"
                class="ability-icon" 
                :src="getAbilityIcon(ability.icon)"
                mode="aspectFill"
              />
              <view class="ability-info">
                <view class="ability-header">
                  <text class="ability-name">{{ ability.title }}</text>
                  <text v-if="ability.hotkey" class="ability-hotkey">{{ ability.hotkey }}</text>
                </view>
                <view v-if="ability.cooldown || ability.mana_cost" class="ability-stats">
                  <text v-if="ability.cooldown" class="stat">冷却: {{ ability.cooldown }}s</text>
                  <text v-if="ability.mana_cost" class="stat">法力: {{ ability.mana_cost }}</text>
                </view>
                <text class="ability-desc">{{ ability.description }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- Talents section -->
        <view v-if="talents.length > 0" class="section">
          <view class="section-title">天赋</view>
          <view v-for="level in talentLevels" :key="level" class="talent-tier">
            <view class="tier-header">等级 {{ level }}</view>
            <view class="talents">
              <view 
                v-for="talent in getTalentsByLevel(level)" 
                :key="talent.name"
                class="talent-item"
              >
                <image 
                  v-if="talent.icon"
                  class="talent-icon" 
                  :src="getTalentIcon(talent.icon)"
                  mode="aspectFill"
                />
                <view class="talent-info">
                  <text class="talent-name">{{ talent.title }}</text>
                  <text class="talent-desc">{{ talent.description }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <view v-if="abilities.length === 0 && talents.length === 0" class="empty">
          <text>暂无详细数据</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import type { Hero, Talent, Ability } from '@/types/hero'
import { fetchHeroes, fetchTalents, fetchAbilities, getHeroIconUrl, getTalentIconUrl, getAbilityIconUrl, getChineseName } from '@/api/heroes'
import { isFavorite as checkFavorite, toggleFavorite } from '@/utils/storage'

const hero = ref<Hero | null>(null)
const talents = ref<Talent[]>([])
const abilities = ref<Ability[]>([])
const isFavorite = ref(false)
const loading = ref(false)
const refreshing = ref(false)
const error = ref('')
const imageError = ref(false)

const displayName = computed(() => {
  if (!hero.value) return ''
  const chineseName = getChineseName(hero.value.translations)
  return chineseName || hero.value.name
})

const heroIcon = computed(() => {
  if (!hero.value) return ''
  if (imageError.value) {
    return '/static/hero-placeholder.png'
  }
  return getHeroIconUrl(hero.value.short_name)
})

const talentLevels = computed(() => {
  const levels = [...new Set(talents.value.map(t => t.level))].sort((a, b) => a - b)
  return levels
})

const getTalentsByLevel = (level: number) => {
  return talents.value
    .filter(t => t.level === level)
    .sort((a, b) => a.sort - b.sort)
}

const getTalentIcon = (icon: string) => {
  return getTalentIconUrl(icon)
}

const getAbilityIcon = (icon: string) => {
  return getAbilityIconUrl(icon)
}

const loadHeroData = async (heroShortName: string) => {
  loading.value = true
  error.value = ''

  try {
    // Load hero basic info
    const allHeroes = await fetchHeroes()
    const foundHero = allHeroes.find(h => h.short_name === heroShortName)
    
    if (!foundHero) {
      throw new Error('英雄不存在')
    }
    
    hero.value = foundHero
    isFavorite.value = checkFavorite(heroShortName)

    // Load talents and abilities in parallel
    const [talentsData, abilitiesData] = await Promise.all([
      fetchTalents(foundHero.name).catch(() => []),
      fetchAbilities(heroShortName).catch(() => [])
    ])

    talents.value = talentsData
    abilities.value = abilitiesData
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

const onRefresh = async () => {
  if (!hero.value) return
  
  refreshing.value = true
  try {
    await loadHeroData(hero.value.short_name)
  } finally {
    refreshing.value = false
  }
}

const onToggleFavorite = () => {
  if (!hero.value) return
  
  const newState = toggleFavorite(hero.value.short_name)
  isFavorite.value = newState
  
  uni.showToast({
    title: newState ? '已收藏' : '已取消收藏',
    icon: 'success',
    duration: 1500
  })
}

const onImageError = () => {
  imageError.value = true
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
  height: 100vh;
  background: #f5f5f5;
}

.content {
  height: 100%;
}

.loading,
.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.error-text {
  color: #f44336;
  font-size: 28rpx;
  margin-bottom: 20rpx;
}

.retry-btn {
  background: #1976d2;
  color: #fff;
  border: none;
  padding: 16rpx 48rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.hero-header {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 32rpx;
  display: flex;
  align-items: center;
}

.hero-portrait {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  border: 4rpx solid #fff;
  margin-right: 24rpx;
}

.hero-header-info {
  flex: 1;
}

.hero-name-cn {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 8rpx;
}

.hero-name-en {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 12rpx;
}

.hero-meta {
  display: flex;
  gap: 8rpx;
}

.role-tag,
.type-tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.favorite-btn {
  width: 64rpx;
  height: 64rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.star {
  color: #FFD700;
  font-size: 40rpx;
}

.section {
  background: #fff;
  margin-top: 20rpx;
  padding: 32rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
}

.abilities {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.ability-item {
  display: flex;
  gap: 16rpx;
}

.ability-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 8rpx;
  background: #f5f5f5;
  flex-shrink: 0;
}

.ability-info {
  flex: 1;
}

.ability-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.ability-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.ability-hotkey {
  font-size: 20rpx;
  color: #999;
  background: #f5f5f5;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
}

.ability-stats {
  display: flex;
  gap: 16rpx;
  margin-bottom: 8rpx;
}

.stat {
  font-size: 22rpx;
  color: #1976d2;
}

.ability-desc {
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
}

.talent-tier {
  margin-bottom: 32rpx;
}

.tier-header {
  font-size: 26rpx;
  font-weight: bold;
  color: #1976d2;
  padding: 12rpx 16rpx;
  background: #e3f2fd;
  border-radius: 8rpx;
  margin-bottom: 16rpx;
}

.talents {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.talent-item {
  display: flex;
  gap: 16rpx;
  padding: 16rpx;
  background: #f9f9f9;
  border-radius: 8rpx;
}

.talent-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 8rpx;
  background: #fff;
  flex-shrink: 0;
}

.talent-info {
  flex: 1;
}

.talent-name {
  display: block;
  font-size: 26rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.talent-desc {
  display: block;
  font-size: 22rpx;
  color: #666;
  line-height: 1.5;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  color: #999;
}
</style>
