<template>
  <view class="container">
    <view class="content">
      <view class="title">关于风暴枢纽</view>
      
      <view class="section">
        <view class="section-title">应用介绍</view>
        <text class="section-text">风暴枢纽是一款风暴英雄(Heroes of the Storm)英雄查询工具,提供英雄资料、技能、天赋等详细信息。</text>
      </view>

      <view class="section">
        <view class="section-title">数据来源</view>
        <text class="section-text">• Heroes Profile API - 英雄数据与天赋信息</text>
        <text class="section-text">• heroes-talents (GitHub) - 图标资源</text>
        <text class="section-text">• jsDelivr CDN - 图片加速</text>
      </view>

      <view class="section">
        <view class="section-title">免责声明</view>
        <text class="section-text">本应用为粉丝自制工具,不隶属于暴雪娱乐。风暴英雄及相关内容的版权归暴雪娱乐所有。</text>
      </view>

      <view class="section">
        <view class="section-title">版本信息</view>
        <text class="section-text">版本: 1.0.0 (MVP)</text>
        <text class="section-text">更新日期: 2026-09</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
// Static about page
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #f5f5f5;
}

.content {
  padding: 32rpx;
}

.title {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 32rpx;
  text-align: center;
}

.section {
  background: #fff;
  border-radius: 12rpx;
  padding: 32rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.section-text {
  display: block;
  font-size: 26rpx;
  color: #666;
  line-height: 1.8;
  margin-bottom: 12rpx;
}
</style>
