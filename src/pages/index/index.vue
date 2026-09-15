<template>
  <view class="container">
    <!-- Search bar -->
    <view class="search-bar">
      <input 
        class="search-input"
        v-model="searchQuery"
        placeholder="搜索英雄名称..."
        @input="onSearch"
        :confirmType="'search'"
      />
    </view>

    <!-- Role filters -->
    <scroll-view class="filter-bar" scroll-x>
      <view class="filter-chips">
        <view 
          v-for="role in roles" 
          :key="role"
          class="filter-chip"
          :class="{ active: selectedRole === role }"
          @tap="onFilterRole(role)"
        >
          {{ role }}
        </view>
      </view>
    </scroll-view>

    <!-- Hero list -->
    <scroll-view 
      class="hero-list"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view v-if="loading && !refreshing" class="loading">
        <text>加载中...</text>
      </view>

      <view v-else-if="error" class="error">
        <text class="error-text">{{ error }}</text>
        <button class="retry-btn" @tap="loadHeroes">重试</button>
      </view>

      <view v-else-if="filteredHeroes.length === 0" class="empty">
        <text>未找到英雄</text>
      </view>

      <view v-else class="hero-grid">
        <HeroCard
          v-for="hero in filteredHeroes"
          :key="hero.short_name"
          :hero="hero"
          :isFav="favorites.includes(hero.short_name)"
          @tap="goToDetail"
          @toggle-favorite="onToggleFavorite"
        />
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Hero } from '@/types/hero'
import { fetchHeroes, clearHeroesCache, getChineseName } from '@/api/heroes'
import { getFavorites, toggleFavorite } from '@/utils/storage'
import HeroCard from '@/components/HeroCard.vue'

const heroes = ref<Hero[]>([])
const favorites = ref<string[]>([])
const searchQuery = ref('')
const selectedRole = ref('全部')
const loading = ref(false)
const refreshing = ref(false)
const error = ref('')

const roles = ['全部', 'Tank', 'Bruiser', 'Healer', 'Support', 'Melee Assassin', 'Ranged Assassin']

const filteredHeroes = computed(() => {
  let result = heroes.value

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(hero => {
      const chineseName = getChineseName(hero.translations).toLowerCase()
      const enName = hero.name.toLowerCase()
      
      // Search in all translation strings
      const allTranslations = Array.isArray(hero.translations) 
        ? hero.translations.join(' ').toLowerCase()
        : ''
      
      return chineseName.includes(query) || 
             enName.includes(query) || 
             allTranslations.includes(query)
    })
  }

  // Filter by role
  if (selectedRole.value !== '全部') {
    result = result.filter(hero => {
      const role = hero.new_role || hero.role
      return role === selectedRole.value
    })
  }

  return result
})

const loadHeroes = async () => {
  loading.value = true
  error.value = ''
  
  try {
    heroes.value = await fetchHeroes()
    favorites.value = getFavorites()
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
  refreshing.value = true
  clearHeroesCache()
  
  try {
    await loadHeroes()
  } finally {
    refreshing.value = false
  }
}

const onSearch = () => {
  // Reactive computed property will handle filtering
}

const onFilterRole = (role: string) => {
  selectedRole.value = role
}

const goToDetail = (hero: Hero) => {
  uni.navigateTo({
    url: `/pages/detail/detail?hero=${encodeURIComponent(hero.short_name)}`
  })
}

const onToggleFavorite = (hero: Hero) => {
  const isFav = toggleFavorite(hero.short_name)
  favorites.value = getFavorites()
  
  uni.showToast({
    title: isFav ? '已收藏' : '已取消收藏',
    icon: 'success',
    duration: 1500
  })
}

onMounted(() => {
  loadHeroes()
})
</script>

<style scoped>
.container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.search-bar {
  padding: 20rpx;
  background: #fff;
}

.search-input {
  width: 100%;
  height: 64rpx;
  background: #f5f5f5;
  border-radius: 32rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
}

.filter-bar {
  background: #fff;
  padding: 16rpx 0;
  white-space: nowrap;
  border-bottom: 1rpx solid #e0e0e0;
}

.filter-chips {
  display: inline-flex;
  padding: 0 20rpx;
  gap: 16rpx;
}

.filter-chip {
  display: inline-block;
  padding: 12rpx 24rpx;
  background: #f5f5f5;
  border-radius: 32rpx;
  font-size: 24rpx;
  color: #666;
  white-space: nowrap;
}

.filter-chip.active {
  background: #1976d2;
  color: #fff;
}

.hero-list {
  flex: 1;
  padding: 20rpx;
}

.loading,
.error,
.empty {
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

.hero-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}
</style>
