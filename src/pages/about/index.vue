<template>
  <view class="about-page">
    <view class="content">
      <text class="title">关于</text>
      <text class="app-name">风暴枢纽</text>
      <text class="version">版本 1.0.0</text>
      <text class="description">Heroes of the Storm 数据查询工具</text>
    </view>
  </view>
</template>

<script setup lang="ts">
</script>

<style scoped>
.about-page {
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
  margin-bottom: 40rpx;
}

.app-name {
  font-size: 40rpx;
  font-weight: bold;
  color: rgba(150, 130, 255, 0.9);
  display: block;
  margin-bottom: 20rpx;
}

.version {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
  display: block;
  margin-bottom: 40rpx;
}

.description {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
}
</style>
