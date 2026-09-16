<template>
  <view class="favorites-page">
    <scroll-view class="content" scroll-y>
      <view v-if="favoriteHeroes.length === 0" class="empty">
        <text class="empty-icon">⭐</text>
        <text class="empty-text">还没有收藏的英雄</text>
        <text class="empty-hint">在英雄列表中点击星标收藏</text>
      </view>

      <view v-else class="hero-grid">
        <view
          v-for="hero in favoriteHeroes"
          :key="hero.short_name"
          class="hero-item"
          @tap="goToDetail(hero)"
        >
          <view class="hero-avatar-wrapper">
            <image
              class="hero-avatar"
              :src="getHeroIcon(hero)"
              mode="aspectFill"
            />
            <view class="hero-ring"></view>
            
            <!-- Favorite star -->
            <view class="favorite-star" @tap.stop="onToggleFavorite(hero)">
              <text class="star-icon">★</text>
            </view>
          </view>
          <text class="hero-name">{{ getHeroDisplayName(hero) }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import type { Hero } from '@/types/hero'
import { fetchHeroes, getHeroIconUrl, getChineseName } from '@/api/heroes'
import { getFavorites, toggleFavorite } from '@/utils/storage'

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

const getHeroIcon = (hero: Hero): string => {
  return getHeroIconUrl(hero.short_name)
}

const getHeroDisplayName = (hero: Hero): string => {
  const chineseName = getChineseName(hero.translations)
  return chineseName || hero.name
}

const goToDetail = (hero: Hero) => {
  if (!hero || !hero.short_name) {
    console.error('Invalid hero object:', hero)
    return
  }
  
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
.favorites-page {
  min-height: 100vh;
  background: linear-gradient(180deg, 
    rgb(30, 20, 50) 0%,
    rgb(50, 30, 80) 50%,
    rgb(25, 15, 45) 100%
  );
}

.content {
  height: 100vh;
  padding: 30rpx 20rpx 100rpx;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 60rpx;
  text-align: center;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 40rpx;
}

.empty-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 20rpx;
}

.empty-hint {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.6);
}

.hero-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30rpx 20rpx;
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

.favorite-star {
  position: absolute;
  top: 5rpx;
  right: 5rpx;
  width: 45rpx;
  height: 45rpx;
  border-radius: 50%;
  background: rgba(255, 215, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
}

.star-icon {
  font-size: 28rpx;
  color: #fff;
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
</style>
