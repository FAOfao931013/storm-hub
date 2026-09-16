<template>
  <view class="hero-list-page">
    <!-- Header with Title and Search -->
    <view class="header">
      <text class="page-title">英雄</text>
      <view class="search-box">
        <input
          class="search-input"
          type="text"
          placeholder="搜索英雄..."
          v-model="searchQuery"
          @input="onSearchInput"
        />
      </view>
    </view>

    <!-- Filter Bar -->
    <view class="filter-bar">
      <!-- Role Filters -->
      <view class="filter-group">
        <view
          v-for="role in roles"
          :key="role"
          class="filter-icon"
          :class="{ active: selectedRole === role }"
          @tap="toggleRole(role)"
        >
          <image
            class="filter-icon-img"
            :src="getRoleIcon(role)"
            mode="aspectFit"
          />
        </view>
      </view>

      <!-- Divider -->
      <view class="filter-divider"></view>

      <!-- Franchise Filters -->
      <view class="filter-group">
        <view
          v-for="franchise in franchises"
          :key="franchise"
          class="filter-icon"
          :class="{ active: selectedFranchise === franchise }"
          @tap="toggleFranchise(franchise)"
        >
          <image
            class="filter-icon-img"
            :src="getFranchiseIcon(franchise)"
            mode="aspectFit"
          />
        </view>
      </view>
    </view>

    <!-- Hero Grid -->
    <view class="hero-grid" v-if="!loading && !error">
      <view
        v-for="hero in filteredHeroes"
        :key="hero.short_name"
        class="hero-item"
        @tap="onHeroTap(hero)"
      >
        <view class="hero-avatar-wrapper">
          <image
            class="hero-avatar"
            :src="getHeroIcon(hero)"
            mode="aspectFill"
            @error="() => onHeroImageError(hero)"
          />
          <view class="hero-ring"></view>
          
          <!-- Bottom-left: Franchise badge -->
          <view class="badge badge-franchise">
            <image
              class="badge-icon"
              :src="getFranchiseIcon(hero._franchise)"
              mode="aspectFit"
            />
          </view>
          
          <!-- Bottom-right: Role badge -->
          <view class="badge badge-role">
            <image
              class="badge-icon"
              :src="getRoleIcon(hero.new_role || hero.role)"
              mode="aspectFit"
            />
          </view>
        </view>
        <text class="hero-name">{{ getHeroDisplayName(hero) }}</text>
      </view>
    </view>

    <!-- Loading indicator -->
    <view v-if="loading" class="loading">
      <text class="loading-text">加载中...</text>
    </view>

    <!-- Error state -->
    <view v-if="error" class="error">
      <text class="error-text">{{ error }}</text>
      <button class="retry-btn" @tap="loadHeroes">重试</button>
    </view>

    <!-- Empty state -->
    <view v-if="!loading && !error && filteredHeroes.length === 0" class="empty">
      <text class="empty-text">未找到英雄</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Hero } from '@/types/hero'
import { fetchHeroes, getChineseName, getHeroIconUrl } from '@/api/heroes'
import { getFranchise, getAllFranchises, getRoleIconPath, getFranchiseIconPath, type FranchiseType } from '@/data/franchise'

const loading = ref(true)
const error = ref('')
const heroes = ref<(Hero & { _franchise?: FranchiseType; _imageError?: boolean })[]>([])
const searchQuery = ref('')
const selectedRole = ref<string | null>(null)
const selectedFranchise = ref<FranchiseType | null>(null)

const roles = ['Tank', 'Bruiser', 'Melee Assassin', 'Ranged Assassin', 'Healer', 'Support']
const franchises = getAllFranchises()

// Computed filtered heroes
const filteredHeroes = computed(() => {
  return heroes.value.filter(hero => {
    // Role filter
    if (selectedRole.value) {
      const heroRole = hero.new_role || hero.role
      if (heroRole !== selectedRole.value) {
        return false
      }
    }
    
    // Franchise filter
    if (selectedFranchise.value && hero._franchise !== selectedFranchise.value) {
      return false
    }
    
    // Search filter - match Chinese name and English name
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      const name = (hero.name || '').toLowerCase()
      const chineseName = getChineseName(hero.translations).toLowerCase()
      
      // Also search in translations array
      const matchInTranslations = hero.translations.some(t => 
        t.toLowerCase().includes(query)
      )
      
      if (!name.includes(query) && !chineseName.includes(query) && !matchInTranslations) {
        return false
      }
    }
    
    return true
  })
})

// Load heroes from API
async function loadHeroes() {
  loading.value = true
  error.value = ''
  
  try {
    const data = await fetchHeroes()
    
    // Enhance heroes with franchise data
    heroes.value = data.map(hero => ({
      ...hero,
      _franchise: getFranchise(hero.short_name || hero.attribute_id),
      _imageError: false
    }))
    
  } catch (err: any) {
    console.error('Error fetching heroes:', err)
    error.value = err.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function getRoleIcon(role: string) {
  return getRoleIconPath(role)
}

function getFranchiseIcon(franchise: string | undefined) {
  return getFranchiseIconPath(franchise || 'Nexus')
}

function getHeroIcon(hero: Hero & { _imageError?: boolean }): string {
  if (hero._imageError) {
    return '/static/hero-placeholder.png'
  }
  return getHeroIconUrl(hero.short_name)
}

function onHeroImageError(hero: Hero & { _imageError?: boolean }) {
  hero._imageError = true
}

function getHeroDisplayName(hero: Hero): string {
  const chineseName = getChineseName(hero.translations)
  return chineseName || hero.name
}

function toggleRole(role: string) {
  selectedRole.value = selectedRole.value === role ? null : role
}

function toggleFranchise(franchise: FranchiseType) {
  selectedFranchise.value = selectedFranchise.value === franchise ? null : franchise
}

function onSearchInput() {
  // Debounce handled by v-model
}

function onHeroTap(hero: Hero) {
  // Navigate to detail page
  if (!hero || !hero.short_name) {
    console.error('Invalid hero object:', hero)
    return
  }
  
  uni.navigateTo({
    url: `/pages/detail/detail?hero=${encodeURIComponent(hero.short_name)}`
  })
}

onMounted(() => {
  loadHeroes()
})
</script>

<style scoped>
.hero-list-page {
  min-height: 100vh;
  background: linear-gradient(180deg, 
    rgb(30, 20, 50) 0%,
    rgb(50, 30, 80) 30%,
    rgb(40, 25, 70) 60%,
    rgb(25, 15, 45) 100%
  );
  padding-bottom: 100rpx;
}

.header {
  padding: 40rpx 30rpx 20rpx;
}

.page-title {
  font-size: 60rpx;
  font-weight: bold;
  color: #fff;
  display: block;
  margin-bottom: 30rpx;
}

.search-box {
  margin-bottom: 20rpx;
}

.search-input {
  width: 100%;
  height: 80rpx;
  background: rgba(80, 60, 120, 0.5);
  border: 2rpx solid rgba(120, 100, 180, 0.4);
  border-radius: 40rpx;
  padding: 0 30rpx;
  color: #fff;
  font-size: 28rpx;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

/* Filter Bar */
.filter-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 20rpx 30rpx;
  gap: 20rpx;
  overflow-x: auto;
  white-space: nowrap;
}

.filter-group {
  display: flex;
  flex-direction: row;
  gap: 20rpx;
}

.filter-icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: rgba(80, 60, 120, 0.5);
  border: 3rpx solid rgba(120, 100, 180, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  flex-shrink: 0;
}

.filter-icon.active {
  background: rgba(120, 100, 255, 0.4);
  border-color: rgb(150, 130, 255);
  box-shadow: 0 0 20rpx rgba(150, 130, 255, 0.6);
}

.filter-icon-img {
  width: 36rpx;
  height: 36rpx;
  opacity: 0.7;
}

.filter-icon.active .filter-icon-img {
  opacity: 1;
}

.filter-divider {
  width: 3rpx;
  height: 50rpx;
  background: rgba(120, 100, 180, 0.4);
  flex-shrink: 0;
}

/* Hero Grid */
.hero-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30rpx 20rpx;
  padding: 30rpx 20rpx;
}

.hero-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15rpx;
}

.hero-avatar-wrapper {
  position: relative;
  width: 140rpx;
  height: 140rpx;
}

.hero-avatar {
  position: absolute;
  top: 8rpx;
  left: 8rpx;
  width: 124rpx;
  height: 124rpx;
  border-radius: 50%;
  z-index: 2;
  background: rgba(50, 30, 80, 0.8);
}

.hero-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(100, 200, 255, 0.6);
  box-shadow: 
    0 0 15rpx rgba(100, 200, 255, 0.4),
    inset 0 0 15rpx rgba(100, 200, 255, 0.2);
  z-index: 1;
}

.badge {
  position: absolute;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
}

.badge-franchise {
  bottom: 0;
  left: 0;
  background: rgba(200, 150, 50, 0.9);
}

.badge-role {
  bottom: 0;
  right: 0;
  background: rgba(150, 130, 255, 0.9);
}

.badge-icon {
  width: 24rpx;
  height: 24rpx;
}

.hero-name {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  max-width: 140rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Loading, Error and Empty States */
.loading,
.error,
.empty {
  padding: 80rpx;
  text-align: center;
}

.loading-text,
.empty-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.6);
}

.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30rpx;
}

.error-text {
  font-size: 28rpx;
  color: rgba(255, 100, 100, 0.9);
}

.retry-btn {
  background: rgba(150, 130, 255, 0.8);
  color: #fff;
  border: none;
  border-radius: 40rpx;
  padding: 20rpx 60rpx;
  font-size: 28rpx;
}
</style>
