<template>
  <view class="about-page">
    <view class="content">
      <view class="header">
        <text class="app-name">风暴枢纽</text>
        <text class="app-subtitle">Storm Hub</text>
        <text class="version">版本 1.0.0 (UI Redesign)</text>
      </view>
      
      <view class="section">
        <view class="section-title">应用介绍</view>
        <text class="section-text">风暴枢纽是一款风暴英雄(Heroes of the Storm)英雄查询工具,提供英雄资料、技能、天赋等详细信息。</text>
        <text class="section-text">现在还支持组队功能,帮助玩家快速找到队友一起开黑！</text>
      </view>

      <view class="section">
        <view class="section-title">数据来源</view>
        <text class="section-text">• Heroes Profile API - 英雄数据与天赋信息</text>
        <text class="section-text">• heroes-talents (GitHub) - 能力JSON数据</text>
        <text class="section-text">• HeroesToolChest - 英雄阵营数据</text>
        <text class="section-text">• Tencent COS - 图标资源</text>
        <text class="section-text">• jsDelivr CDN - 中文本地化数据</text>
      </view>

      <view class="section">
        <view class="section-title">UI设计</view>
        <text class="section-text">• 深色太空主题视觉设计</text>
        <text class="section-text">• 圆形英雄头像网格布局</text>
        <text class="section-text">• 角色和阵营图标过滤系统</text>
        <text class="section-text">• 中文本地化支持</text>
      </view>

      <view class="section">
        <view class="section-title">组队功能说明</view>
        <text class="section-text">使用组队功能需要登录微信账号。发布或加入组队时,您可以选择提供战网ID和电子邮箱。</text>
        <text class="section-text">• 战网ID将显示给其他队员,用于游戏内添加好友</text>
        <text class="section-text">• 电子邮箱仅用于接收有人加入组队的通知,不会公开显示</text>
        <text class="section-text">• 您的联系信息仅用于组队目的,我们不会将其用于其他用途或分享给第三方</text>
      </view>

      <view class="section">
        <view class="section-title">免责声明</view>
        <text class="section-text">本应用为粉丝自制工具,不隶属于暴雪娱乐。风暴英雄及相关内容的版权归暴雪娱乐所有。</text>
        <text class="section-text">组队功能仅提供玩家间交流平台,请注意网络安全和个人信息保护。</text>
      </view>

      <view class="section">
        <view class="section-title">版本信息</view>
        <text class="section-text">版本: 1.0.0 (UI Redesign)</text>
        <text class="section-text">更新日期: 2026-09</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
// Static about page
</script>

<style scoped>
.about-page {
  min-height: 100vh;
  background: linear-gradient(180deg, 
    rgb(30, 20, 50) 0%,
    rgb(50, 30, 80) 50%,
    rgb(25, 15, 45) 100%
  );
}

.content {
  padding: 40rpx 32rpx 100rpx;
}

.header {
  text-align: center;
  padding: 40rpx 0 60rpx;
}

.app-name {
  display: block;
  font-size: 52rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 16rpx;
}

.app-subtitle {
  display: block;
  font-size: 32rpx;
  color: rgba(150, 130, 255, 0.9);
  margin-bottom: 20rpx;
}

.version {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
}

.section {
  background: rgba(80, 60, 120, 0.3);
  border: 2rpx solid rgba(120, 100, 180, 0.3);
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: rgba(150, 130, 255, 0.95);
  margin-bottom: 20rpx;
}

.section-text {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.8;
  margin-bottom: 12rpx;
}
</style>
