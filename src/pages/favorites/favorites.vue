<template>
  <view class="container">
    <scroll-view class="content" scroll-y>
      <view v-if="favoriteHeroes.length === 0" class="empty">
        <text class="empty-icon">⭐</text>
        <text class="empty-text">还没有收藏的英雄</text>
        <text class="empty-hint">在英雄列表中点击星标收藏</text>
      </view>

      <view v-else class="hero-grid">
        <HeroCard
          v-for="hero in favoriteHeroes"
          :key="hero.short_name"
          :hero="hero"
          :isFav="true"
          @tap="goToDetail"
          @toggle-favorite="onToggleFavorite"
        />
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import type { Hero } from '@/types/hero'
import { fetchHeroes } from '@/api/heroes'
import { getFavorites, toggleFavorite } from '@/utils/storage'
import HeroCard from '@/components/HeroCard.vue'

const favoriteHeroes = ref<Hero[]>([])
const loading = ref(false)

const loadFavorites = async () => {
  loading.value = true
  
  try {
    const favorites = getFavorites()
    
    if (favorites.length === 0) {
      favoriteHeroes.value = []
      return
    }

    const allHeroes = await fetchHeroes()
    favoriteHeroes.value = allHeroes.filter(hero => 
      favorites.includes(hero.short_name)
    )
  } catch (error: any) {
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

const goToDetail = (hero: Hero) => {
  uni.navigateTo({
    url: `/pages/detail/detail?hero=${encodeURIComponent(hero.short_name)}`
  })
}

const onToggleFavorite = (hero: Hero) => {
  toggleFavorite(hero.short_name)
  
  uni.showToast({
    title: '已取消收藏',
    icon: 'success',
    duration: 1500
  })
  
  // Reload favorites
  loadFavorites()
}

// Reload favorites when page is shown
onShow(() => {
  loadFavorites()
})
</script>

<style scoped>
.container {
  height: 100vh;
  background: #f5f5f5;
}

.content {
  height: 100%;
  padding: 20rpx;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 32rpx;
  opacity: 0.3;
}

.empty-text {
  font-size: 32rpx;
  color: #999;
  margin-bottom: 16rpx;
}

.empty-hint {
  font-size: 24rpx;
  color: #ccc;
}

.hero-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}
</style>
