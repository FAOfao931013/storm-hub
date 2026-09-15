<template>
  <view class="favorites-page">
    <view class="content">
      <text class="title">收藏</text>
      <text class="description">此功能即将推出...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
</script>

<style scoped>
.favorites-page {
  min-height: 100vh;
  background: linear-gradient(180deg, 
    rgb(30, 20, 50) 0%,
    rgb(50, 30, 80) 50%,
    rgb(25, 15, 45) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
}

.content {
  text-align: center;
  padding: 60rpx;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #fff;
  display: block;
  margin-bottom: 30rpx;
}

.description {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.6);
}
</style>
