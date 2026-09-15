<template>
  <view class="hero-card" @tap="onTap">
    <view class="hero-avatar">
      <image 
        class="hero-image" 
        :src="heroIcon" 
        mode="aspectFill"
        @error="onImageError"
      />
      <view v-if="showFavorite" class="favorite-icon" @tap.stop="onToggleFavorite">
        <text class="star">{{ isFav ? '★' : '☆' }}</text>
      </view>
    </view>
    <view class="hero-info">
      <view class="hero-name-cn">{{ displayName }}</view>
      <view class="hero-name-en">{{ hero.name }}</view>
      <view class="hero-meta">
        <text class="role-tag">{{ hero.new_role || hero.role }}</text>
        <text class="type-tag">{{ hero.type }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Hero } from '@/types/hero'
import { getHeroIconUrl, getChineseName } from '@/api/heroes'

interface Props {
  hero: Hero
  isFav?: boolean
  showFavorite?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isFav: false,
  showFavorite: true
})

const emit = defineEmits<{
  select: [hero: Hero]
  toggleFavorite: [hero: Hero]
}>()

const imageError = ref(false)

const displayName = computed(() => {
  const chineseName = getChineseName(props.hero.translations)
  return chineseName || props.hero.name
})

const heroIcon = computed(() => {
  if (imageError.value) {
    return '/static/hero-placeholder.png'
  }
  return getHeroIconUrl(props.hero.short_name)
})

const onTap = () => {
  emit('select', props.hero)
}

const onToggleFavorite = () => {
  emit('toggleFavorite', props.hero)
}

const onImageError = () => {
  imageError.value = true
}
</script>

<style scoped>
.hero-card {
  background: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.hero-avatar {
  position: relative;
  width: 100%;
  height: 200rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.hero-image {
  width: 100%;
  height: 100%;
}

.favorite-icon {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  width: 48rpx;
  height: 48rpx;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.star {
  color: #FFD700;
  font-size: 32rpx;
}

.hero-info {
  padding: 16rpx;
}

.hero-name-cn {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.hero-name-en {
  font-size: 24rpx;
  color: #999;
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
  background: #f0f0f0;
  color: #666;
}

.role-tag {
  background: #e3f2fd;
  color: #1976d2;
}
</style>
