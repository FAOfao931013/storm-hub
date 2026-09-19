<template>
  <view class="detail-page">
    <view v-if="loading" class="loading-state">
      <text class="loading-text">加载中...</text>
    </view>

    <view v-else-if="detail" class="content">
      <view class="post-info">
        <view class="info-row">
          <text class="info-label">模式</text>
          <text class="info-value">{{ detail.post.mode }}</text>
        </view>

        <view class="info-row">
          <text class="info-label">队伍人数</text>
          <text class="info-value">{{ detail.participants.length + 1 }}/{{ detail.post.party_size }}</text>
        </view>

        <view class="info-row">
          <text class="info-label">状态</text>
          <text :class="['info-value', detail.post.status === 'open' ? 'status-open' : 'status-closed']">
            {{ detail.post.status === 'open' ? '招募中' : '已关闭' }}
          </text>
        </view>

        <view v-if="detail.post.note" class="info-row-full">
          <text class="info-label">备注</text>
          <text class="info-value-block">{{ detail.post.note }}</text>
        </view>
      </view>

      <view class="participants-section">
        <text class="section-title">队伍成员</text>

        <view class="participant-card owner-card">
          <view class="participant-info">
            <text class="participant-icon">👑</text>
            <view class="participant-details">
              <text class="participant-battlenet">{{ detail.post.owner_battlenet_id }}</text>
              <text class="participant-role">队长</text>
            </view>
          </view>
        </view>

        <view v-for="participant in detail.participants" :key="participant.battlenet_id" class="participant-card">
          <view class="participant-info">
            <text class="participant-icon">👤</text>
            <view class="participant-details">
              <text class="participant-battlenet">{{ participant.battlenet_id }}</text>
              <text v-if="participant.nickname" class="participant-nickname">{{ participant.nickname }}</text>
            </view>
          </view>
        </view>

        <view v-if="detail.participants.length === 0 && detail.post.status === 'open'" class="empty-participants">
          <text class="empty-text">还没有人加入</text>
        </view>
      </view>

      <view v-if="isLoggedIn && detail.post.status === 'open'" class="action-section">
        <view class="action-btn primary-btn" @tap="handleJoin">
          <text class="btn-text">加入队伍</text>
        </view>
      </view>

      <view v-else-if="!isLoggedIn" class="action-section">
        <view class="action-btn disabled-btn">
          <text class="btn-text">请先登录</text>
        </view>
      </view>
    </view>

    <view v-else class="error-state">
      <text class="error-icon">❌</text>
      <text class="error-text">加载失败</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getLfgPost, joinLfgPost, type LfgPostDetail } from '@/api/lfg'
import { isLoggedIn as checkLoggedIn, getAuthToken } from '@/utils/storage'

const isLoggedIn = ref(false)
const loading = ref(true)
const detail = ref<LfgPostDetail | null>(null)
const postId = ref(0)

const loadDetail = async () => {
  loading.value = true
  detail.value = await getLfgPost(postId.value)
  loading.value = false
}

const handleJoin = () => {
  const token = getAuthToken()
  if (!token) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  uni.showModal({
    title: '战网ID',
    editable: true,
    placeholderText: '必填，如：PlayerName#1234',
    success: (idRes) => {
      if (!idRes.confirm || !idRes.content) {
        uni.showToast({ title: '战网ID不能为空', icon: 'none' })
        return
      }

      const battlenetId = idRes.content

      uni.showModal({
        title: '邮箱（可选）',
        editable: true,
        placeholderText: '接收组队通知',
        success: async (emailRes) => {
          const email = emailRes.content || ''

          uni.showModal({
            title: '确认加入',
            content: `战网ID：${battlenetId}\n\n同意提供联系信息用于组队？`,
            success: async (confirmRes) => {
              if (confirmRes.confirm) {
                uni.showLoading({ title: '加入中...' })

                const success = await joinLfgPost(token, postId.value, {
                  battlenet_id: battlenetId,
                  email: email || undefined,
                })

                uni.hideLoading()

                if (success) {
                  uni.showToast({ title: '加入成功', icon: 'success' })
                  loadDetail()
                } else {
                  uni.showToast({ title: '加入失败', icon: 'error' })
                }
              }
            },
          })
        },
      })
    },
  })
}

onMounted(() => {
  isLoggedIn.value = checkLoggedIn()

  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = (currentPage as any).options || (currentPage as any).$route?.query

  if (options?.id) {
    postId.value = Number(options.id)
    loadDetail()
  } else {
    uni.showToast({ title: '参数错误', icon: 'error' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
})
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1e1432 0%, #2a1f47 100%);
  padding: 24rpx;
}

.loading-state,
.error-state {
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #8e8398;
}

.error-icon {
  font-size: 100rpx;
}

.error-text {
  font-size: 32rpx;
  color: #8e8398;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.post-info {
  padding: 32rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.info-row:last-child {
  border-bottom: none;
}

.info-row-full {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding: 20rpx 0;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.info-label {
  font-size: 28rpx;
  color: #8e8398;
}

.info-value {
  font-size: 30rpx;
  color: #ffffff;
  font-weight: 500;
}

.info-value-block {
  font-size: 28rpx;
  color: #d1d0d5;
  line-height: 1.6;
  padding: 16rpx;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8rpx;
}

.status-open {
  color: #4caf50;
}

.status-closed {
  color: #f44336;
}

.participants-section {
  padding: 32rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 24rpx;
}

.participant-card {
  padding: 24rpx;
  margin-bottom: 16rpx;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12rpx;
}

.participant-card:last-child {
  margin-bottom: 0;
}

.owner-card {
  background: rgba(150, 130, 255, 0.1);
  border: 1px solid rgba(150, 130, 255, 0.2);
}

.participant-info {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.participant-icon {
  font-size: 40rpx;
}

.participant-details {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.participant-battlenet {
  font-size: 30rpx;
  color: #ffffff;
  font-weight: 500;
}

.participant-nickname,
.participant-role {
  font-size: 24rpx;
  color: #8e8398;
}

.empty-participants {
  padding: 40rpx;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: #8e8398;
}

.action-section {
  padding: 24rpx 0;
}

.action-btn {
  padding: 28rpx;
  border-radius: 12rpx;
  text-align: center;
}

.primary-btn {
  background: linear-gradient(135deg, #9682ff 0%, #7b61ff 100%);
  box-shadow: 0 4rpx 16rpx rgba(150, 130, 255, 0.3);
}

.primary-btn:active {
  opacity: 0.8;
}

.disabled-btn {
  background: rgba(255, 255, 255, 0.1);
}

.btn-text {
  font-size: 32rpx;
  color: #ffffff;
  font-weight: 600;
}
</style>
