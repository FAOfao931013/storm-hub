<template>
  <view class="mine-page">
    <view class="menu-list">
      <view class="menu-item" @tap="navigateTo('/pages/favorites/index')">
        <view class="menu-item-left">
          <text class="menu-icon">⭐</text>
          <text class="menu-label">收藏</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
      
      <view class="menu-item" @tap="navigateTo('/pages/about/index')">
        <view class="menu-item-left">
          <text class="menu-icon">📄</text>
          <text class="menu-label">声明</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const navigateTo = (url: string) => {
  uni.navigateTo({ url })
}
</script>

<style scoped>
.mine-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1e1432 0%, #2a1f47 100%);
  padding: 24rpx;
}

.menu-list {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 28rpx;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  transition: background 0.2s;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:active {
  background: rgba(255, 255, 255, 0.08);
}

.menu-item-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.menu-icon {
  font-size: 40rpx;
}

.menu-label {
  font-size: 32rpx;
  color: #ffffff;
  font-weight: 500;
}

.menu-arrow {
  font-size: 56rpx;
  color: #8e8398;
  font-weight: 300;
}
</style>
