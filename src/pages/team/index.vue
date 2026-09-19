<template>
  <view class="team-page">
    <view class="header">
      <text class="page-title">组队大厅</text>
      <view v-if="isLoggedIn" class="create-btn" @tap="showCreateModal">
        <text class="create-icon">+</text>
        <text class="create-text">发布</text>
      </view>
    </view>

    <view v-if="posts.length === 0 && !loading" class="empty-state">
      <text class="empty-icon">🏆</text>
      <text class="empty-title">暂无组队帖</text>
      <text v-if="isLoggedIn" class="empty-desc">发布第一个组队邀请吧！</text>
      <text v-else class="empty-desc">请先登录</text>
    </view>

    <scroll-view
      v-else
      class="posts-list"
      scroll-y
      @scrolltolower="loadMore"
      lower-threshold="100"
    >
      <view v-for="post in posts" :key="post.id" class="post-card" @tap="viewPostDetail(post.id)">
        <view class="post-header">
          <text class="post-mode">{{ post.mode }}</text>
          <view class="post-slots">
            <text class="slots-text">{{ post.participant_count + 1 }}/{{ post.party_size }}</text>
          </view>
        </view>

        <view v-if="post.note" class="post-note">
          <text class="note-text">{{ post.note }}</text>
        </view>

        <view class="post-footer">
          <view class="post-owner">
            <text class="owner-icon">👤</text>
            <text class="owner-name">{{ post.owner_nickname || post.owner_battlenet_id }}</text>
          </view>
          <text class="post-time">{{ formatTime(post.created_at) }}</text>
        </view>
      </view>

      <view v-if="loading" class="loading-more">
        <text class="loading-text">加载中...</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { listLfgPosts, createLfgPost, type LfgPost } from '@/api/lfg'
import { isLoggedIn as checkLoggedIn, getAuthToken } from '@/utils/storage'

const isLoggedIn = ref(false)
const posts = ref<LfgPost[]>([])
const loading = ref(false)
const offset = ref(0)
const hasMore = ref(true)

const modes = ['快速匹配', '排位赛', '乱斗', '自定义']

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

const loadPosts = async (refresh = false) => {
  if (loading.value) return
  if (!refresh && !hasMore.value) return

  loading.value = true

  if (refresh) {
    offset.value = 0
    hasMore.value = true
  }

  const newPosts = await listLfgPosts(20, offset.value)

  if (refresh) {
    posts.value = newPosts
  } else {
    posts.value = [...posts.value, ...newPosts]
  }

  if (newPosts.length < 20) {
    hasMore.value = false
  } else {
    offset.value += 20
  }

  loading.value = false
}

const loadMore = () => {
  loadPosts(false)
}

const viewPostDetail = (id: number) => {
  uni.navigateTo({
    url: `/pages/team/detail?id=${id}`,
  })
}

const showCreateModal = () => {
  const token = getAuthToken()
  if (!token) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  let selectedMode = modes[0]
  let partySize = 5
  let note = ''
  let battlenetId = ''
  let email = ''
  let consentChecked = false

  uni.showModal({
    title: '发布组队',
    editable: false,
    content: '请使用自定义对话框',
    success: () => {
      uni.showActionSheet({
        itemList: modes,
        success: (modeRes) => {
          selectedMode = modes[modeRes.tapIndex]

          uni.showActionSheet({
            itemList: ['2人', '3人', '4人', '5人'],
            success: (sizeRes) => {
              partySize = sizeRes.tapIndex + 2

              uni.showModal({
                title: '战网ID',
                editable: true,
                placeholderText: '必填，如：PlayerName#1234',
                success: (idRes) => {
                  if (!idRes.confirm || !idRes.content) {
                    uni.showToast({ title: '战网ID不能为空', icon: 'none' })
                    return
                  }
                  battlenetId = idRes.content

                  uni.showModal({
                    title: '备注（可选）',
                    editable: true,
                    placeholderText: '说点什么...',
                    success: (noteRes) => {
                      note = noteRes.content || ''

                      uni.showModal({
                        title: '邮箱（可选）',
                        editable: true,
                        placeholderText: '接收组队通知',
                        success: async (emailRes) => {
                          email = emailRes.content || ''

                          uni.showModal({
                            title: '确认发布',
                            content: `模式：${selectedMode}\n人数：${partySize}人\n战网ID：${battlenetId}\n\n同意提供联系信息用于组队？`,
                            success: async (confirmRes) => {
                              if (confirmRes.confirm) {
                                uni.showLoading({ title: '发布中...' })

                                const postId = await createLfgPost(token, {
                                  mode: selectedMode,
                                  party_size: partySize,
                                  note,
                                  battlenet_id: battlenetId,
                                  email: email || undefined,
                                })

                                uni.hideLoading()

                                if (postId) {
                                  uni.showToast({ title: '发布成功', icon: 'success' })
                                  loadPosts(true)
                                } else {
                                  uni.showToast({ title: '发布失败', icon: 'error' })
                                }
                              }
                            },
                          })
                        },
                      })
                    },
                  })
                },
              })
            },
          })
        },
      })
    },
  })
}

onMounted(() => {
  isLoggedIn.value = checkLoggedIn()
  loadPosts(true)
})
</script>

<style scoped>
.team-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1e1432 0%, #2a1f47 100%);
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 24rpx 16rpx;
}

.page-title {
  font-size: 40rpx;
  font-weight: 600;
  color: #ffffff;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 28rpx;
  background: linear-gradient(135deg, #9682ff 0%, #7b61ff 100%);
  border-radius: 32rpx;
  box-shadow: 0 4rpx 12rpx rgba(150, 130, 255, 0.3);
}

.create-icon {
  font-size: 32rpx;
  color: #ffffff;
  font-weight: 600;
}

.create-text {
  font-size: 28rpx;
  color: #ffffff;
  font-weight: 500;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
  padding: 80rpx 40rpx;
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

.posts-list {
  flex: 1;
  padding: 8rpx 24rpx 24rpx;
}

.post-card {
  margin-bottom: 24rpx;
  padding: 32rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.post-mode {
  font-size: 32rpx;
  font-weight: 600;
  color: #ffffff;
}

.post-slots {
  padding: 8rpx 20rpx;
  background: rgba(150, 130, 255, 0.2);
  border-radius: 20rpx;
}

.slots-text {
  font-size: 24rpx;
  color: #9682ff;
  font-weight: 600;
}

.post-note {
  margin-bottom: 16rpx;
  padding: 16rpx;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8rpx;
}

.note-text {
  font-size: 28rpx;
  color: #d1d0d5;
  line-height: 1.5;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.post-owner {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.owner-icon {
  font-size: 28rpx;
}

.owner-name {
  font-size: 26rpx;
  color: #8e8398;
}

.post-time {
  font-size: 24rpx;
  color: #8e8398;
}

.loading-more {
  padding: 32rpx;
  text-align: center;
}

.loading-text {
  font-size: 26rpx;
  color: #8e8398;
}
</style>
