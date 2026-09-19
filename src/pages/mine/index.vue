<template>
  <view class="mine-page">
    <view class="user-section">
      <view v-if="isLoggedIn" class="user-info">
        <text class="user-icon">👤</text>
        <view class="user-details">
          <text class="user-nickname">{{ userInfo?.nickname || '未设置昵称' }}</text>
          <text class="user-id">{{ maskedOpenId }}</text>
        </view>
      </view>
      <view v-else class="login-prompt">
        <text class="login-icon">👋</text>
        <text class="login-text">登录后可使用组队功能</text>
      </view>
    </view>

    <view class="menu-list">
      <view v-if="!isLoggedIn" class="menu-item" @tap="handleLogin">
        <view class="menu-item-left">
          <text class="menu-icon">🔑</text>
          <text class="menu-label">微信登录</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>

      <view v-if="isLoggedIn" class="menu-item" @tap="handleEditNickname">
        <view class="menu-item-left">
          <text class="menu-icon">✏️</text>
          <text class="menu-label">修改昵称</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
      
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

      <view v-if="isLoggedIn" class="menu-item" @tap="handleLogout">
        <view class="menu-item-left">
          <text class="menu-icon">🚪</text>
          <text class="menu-label">退出登录</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { loginWithWeChat } from '@/api/auth'
import { updateNickname } from '@/api/auth'
import {
  getAuthToken,
  getUserInfo,
  isLoggedIn as checkLoggedIn,
  removeAuthToken,
  removeUserInfo,
  saveAuthToken,
  saveUserInfo,
  type StoredUserInfo,
} from '@/utils/storage'

const isLoggedIn = ref(false)
const userInfo = ref<StoredUserInfo | null>(null)

const maskedOpenId = computed(() => {
  if (!userInfo.value?.openid) return ''
  const id = userInfo.value.openid
  return id.slice(0, 6) + '***' + id.slice(-4)
})

const navigateTo = (url: string) => {
  uni.navigateTo({ url })
}

const handleLogin = () => {
  uni.showLoading({ title: '登录中...' })

  uni.login({
    provider: 'weixin',
    success: async (loginRes) => {
      const code = loginRes.code
      const result = await loginWithWeChat(code)

      uni.hideLoading()

      if (result) {
        saveAuthToken(result.token)
        saveUserInfo(result.user)
        isLoggedIn.value = true
        userInfo.value = result.user

        uni.showToast({
          title: '登录成功',
          icon: 'success',
        })
      } else {
        uni.showToast({
          title: '登录失败',
          icon: 'error',
        })
      }
    },
    fail: () => {
      uni.hideLoading()
      uni.showToast({
        title: '登录失败',
        icon: 'error',
      })
    },
  })
}

const handleEditNickname = () => {
  uni.showModal({
    title: '修改昵称',
    editable: true,
    placeholderText: '请输入昵称',
    success: async (res) => {
      if (res.confirm && res.content) {
        const token = getAuthToken()
        if (!token) return

        uni.showLoading({ title: '保存中...' })
        const success = await updateNickname(token, res.content)
        uni.hideLoading()

        if (success) {
          if (userInfo.value) {
            userInfo.value.nickname = res.content
            saveUserInfo(userInfo.value)
          }

          uni.showToast({
            title: '修改成功',
            icon: 'success',
          })
        } else {
          uni.showToast({
            title: '修改失败',
            icon: 'error',
          })
        }
      }
    },
  })
}

const handleLogout = () => {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        removeAuthToken()
        removeUserInfo()
        isLoggedIn.value = false
        userInfo.value = null

        uni.showToast({
          title: '已退出登录',
          icon: 'success',
        })
      }
    },
  })
}

onMounted(() => {
  isLoggedIn.value = checkLoggedIn()
  userInfo.value = getUserInfo()
})
</script>

<style scoped>
.mine-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1e1432 0%, #2a1f47 100%);
  padding: 24rpx;
}

.user-section {
  margin-bottom: 32rpx;
  padding: 40rpx 28rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.user-icon {
  font-size: 80rpx;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.user-nickname {
  font-size: 36rpx;
  font-weight: 600;
  color: #ffffff;
}

.user-id {
  font-size: 24rpx;
  color: #8e8398;
}

.login-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 0;
}

.login-icon {
  font-size: 80rpx;
}

.login-text {
  font-size: 28rpx;
  color: #8e8398;
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
