<template>
  <view class="team-page">
    <view class="empty-state">
      <text class="empty-icon">🏆</text>
      <text class="empty-title">组队功能</text>
      <text class="empty-desc">敬请期待</text>
    </view>
  </view>
</template>

<script setup lang="ts">
</script>

<style scoped>
.team-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1e1432 0%, #2a1f47 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 20rpx;
}

.empty-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #ffffff;
}

.empty-desc {
  font-size: 28rpx;
  color: #8e8398;
}
</style>
