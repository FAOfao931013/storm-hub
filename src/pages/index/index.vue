<template>
  <view class="hero-list-page">
    <!-- Header with Title and Search -->
    <view class="header">
      <text class="page-title">英雄</text>
      <view class="search-box">
        <input
          class="search-input"
          type="text"
          placeholder="搜索英雄..."
          v-model="searchQuery"
          @input="onSearchInput"
        />
      </view>
    </view>

    <!-- Filter Bar -->
    <view class="filter-bar">
      <!-- Role Filters -->
      <view class="filter-group">
        <view
          v-for="role in roles"
          :key="role"
          class="filter-icon"
          :class="{ active: selectedRole === role }"
          @tap="toggleRole(role)"
        >
          <image
            class="filter-icon-img"
            :src="getRoleIcon(role)"
            mode="aspectFit"
          />
        </view>
      </view>

      <!-- Divider -->
      <view class="filter-divider"></view>

      <!-- Franchise Filters -->
      <view class="filter-group">
        <view
          v-for="franchise in franchises"
          :key="franchise"
          class="filter-icon"
          :class="{ active: selectedFranchise === franchise }"
          @tap="toggleFranchise(franchise)"
        >
          <image
            class="filter-icon-img"
            :src="getFranchiseIcon(franchise)"
            mode="aspectFit"
          />
        </view>
      </view>
    </view>

    <!-- Hero Grid -->
    <view class="hero-grid">
      <view
        v-for="hero in filteredHeroes"
        :key="hero.short_name"
        class="hero-item"
        @tap="onHeroTap(hero)"
      >
        <view class="hero-avatar-wrapper">
          <image
            class="hero-avatar"
            :src="getHeroIcon(hero)"
            mode="aspectFill"
            @error="onHeroImageError(hero)"
          />
          <view class="hero-ring"></view>
          
          <!-- Bottom-left: Franchise badge -->
          <view class="badge badge-franchise">
            <image
              class="badge-icon"
              :src="getFranchiseIcon(hero.franchise)"
              mode="aspectFit"
            />
          </view>
          
          <!-- Bottom-right: Role badge -->
          <view class="badge badge-role">
            <image
              class="badge-icon"
              :src="getRoleIcon(hero.new_role)"
              mode="aspectFit"
            />
          </view>
        </view>
        <text class="hero-name">{{ getHeroName(hero) }}</text>
      </view>
    </view>

    <!-- Loading indicator -->
    <view v-if="loading" class="loading">
      <text class="loading-text">加载中...</text>
    </view>

    <!-- Empty state -->
    <view v-if="!loading && filteredHeroes.length === 0" class="empty">
      <text class="empty-text">未找到英雄</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface Hero {
  short_name: string;
  name: string;
  attribute_id: string;
  new_role?: string;
  role?: string;
  franchise?: string;
  icon?: string;
  _iconError?: boolean;
}

type RoleType = 'Tank' | 'Bruiser' | 'Melee Assassin' | 'Ranged Assassin' | 'Healer' | 'Support';
type FranchiseType = 'Warcraft' | 'Starcraft' | 'Diablo' | 'Overwatch' | 'Nexus';

const loading = ref(true);
const heroes = ref<Hero[]>([]);
const searchQuery = ref('');
const selectedRole = ref<RoleType | null>(null);
const selectedFranchise = ref<FranchiseType | null>(null);

const roles: RoleType[] = ['Tank', 'Bruiser', 'Melee Assassin', 'Ranged Assassin', 'Healer', 'Support'];
const franchises: FranchiseType[] = ['Warcraft', 'Starcraft', 'Diablo', 'Overwatch', 'Nexus'];

// Franchise map - loaded from data
const franchiseMapUrl = 'https://cdn.jsdelivr.net/gh/FAOfao931013/storm-hub@main/data/zhcn/franchise.json';

// Computed filtered heroes
const filteredHeroes = computed(() => {
  return heroes.value.filter(hero => {
    // Role filter
    if (selectedRole.value && hero.new_role !== selectedRole.value) {
      return false;
    }
    
    // Franchise filter
    if (selectedFranchise.value && hero.franchise !== selectedFranchise.value) {
      return false;
    }
    
    // Search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      const name = (hero.name || '').toLowerCase();
      const shortName = (hero.short_name || '').toLowerCase();
      if (!name.includes(query) && !shortName.includes(query)) {
        return false;
      }
    }
    
    return true;
  });
});

// Fetch heroes from Heroes Profile API
async function fetchHeroes() {
  try {
    loading.value = true;
    
    // Fetch franchise map
    const franchiseMapResponse: any = await new Promise((resolve, reject) => {
      uni.request({
        url: franchiseMapUrl,
        method: 'GET',
        success: (res) => resolve(res),
        fail: (err) => reject(err)
      });
    });
    
    const franchiseMap = franchiseMapResponse.data as Record<string, string>;
    
    // Fetch heroes
    const response: any = await new Promise((resolve, reject) => {
      uni.request({
        url: 'https://www.heroesprofile.com/api/Heroes/',
        method: 'GET',
        success: (res) => resolve(res),
        fail: (err) => reject(err)
      });
    });
    
    const heroData = response.data as Hero[];
    
    // Enhance heroes with franchise data
    heroes.value = (Array.isArray(heroData) ? heroData : []).map(hero => ({
      ...hero,
      franchise: franchiseMap[hero.short_name] || 
                franchiseMap[hero.attribute_id] || 
                'Nexus'
    }));
    
  } catch (error) {
    console.error('Error fetching heroes:', error);
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
}

function getRoleIcon(role: string | undefined) {
  if (!role) return '';
  const roleMap: Record<string, string> = {
    'Tank': '/static/icons/roles/tank.svg',
    'Bruiser': '/static/icons/roles/bruiser.svg',
    'Melee Assassin': '/static/icons/roles/melee-assassin.svg',
    'Ranged Assassin': '/static/icons/roles/ranged-assassin.svg',
    'Healer': '/static/icons/roles/healer.svg',
    'Support': '/static/icons/roles/support.svg'
  };
  return roleMap[role] || '';
}

function getFranchiseIcon(franchise: string | undefined) {
  if (!franchise) return '';
  const franchiseMap: Record<string, string> = {
    'Warcraft': '/static/icons/franchises/warcraft.svg',
    'Starcraft': '/static/icons/franchises/starcraft.svg',
    'Diablo': '/static/icons/franchises/diablo.svg',
    'Overwatch': '/static/icons/franchises/overwatch.svg',
    'Nexus': '/static/icons/franchises/nexus.svg'
  };
  return franchiseMap[franchise] || '';
}

function getHeroIcon(hero: Hero): string {
  if (hero._iconError) {
    return '/static/icons/franchises/nexus.svg';
  }
  const shortName = hero.short_name || hero.attribute_id;
  return `https://raw.githubusercontent.com/HeroesToolChest/heroes-images/main/heroes/${shortName.toLowerCase()}.png`;
}

function onHeroImageError(hero: Hero) {
  hero._iconError = true;
}

function getHeroName(hero: Hero): string {
  return hero.name || hero.short_name;
}

function toggleRole(role: RoleType) {
  selectedRole.value = selectedRole.value === role ? null : role;
}

function toggleFranchise(franchise: FranchiseType) {
  selectedFranchise.value = selectedFranchise.value === franchise ? null : franchise;
}

function onSearchInput() {
  // Debounce handled by v-model
}

function onHeroTap(hero: Hero) {
  // Navigate to hero detail page (to be implemented)
  uni.showToast({
    title: hero.name,
    icon: 'none'
  });
}

onMounted(() => {
  fetchHeroes();
});
</script>

<style scoped>
.hero-list-page {
  min-height: 100vh;
  background: linear-gradient(180deg, 
    rgb(30, 20, 50) 0%,
    rgb(50, 30, 80) 30%,
    rgb(40, 25, 70) 60%,
    rgb(25, 15, 45) 100%
  );
  padding-bottom: 100rpx;
}

.header {
  padding: 40rpx 30rpx 20rpx;
}

.page-title {
  font-size: 60rpx;
  font-weight: bold;
  color: #fff;
  display: block;
  margin-bottom: 30rpx;
}

.search-box {
  margin-bottom: 20rpx;
}

.search-input {
  width: 100%;
  height: 80rpx;
  background: rgba(80, 60, 120, 0.5);
  border: 2rpx solid rgba(120, 100, 180, 0.4);
  border-radius: 40rpx;
  padding: 0 30rpx;
  color: #fff;
  font-size: 28rpx;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

/* Filter Bar */
.filter-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 20rpx 30rpx;
  gap: 20rpx;
  overflow-x: auto;
  white-space: nowrap;
}

.filter-group {
  display: flex;
  flex-direction: row;
  gap: 20rpx;
}

.filter-icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: rgba(80, 60, 120, 0.5);
  border: 3rpx solid rgba(120, 100, 180, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  flex-shrink: 0;
}

.filter-icon.active {
  background: rgba(120, 100, 255, 0.4);
  border-color: rgb(150, 130, 255);
  box-shadow: 0 0 20rpx rgba(150, 130, 255, 0.6);
}

.filter-icon-img {
  width: 36rpx;
  height: 36rpx;
  opacity: 0.7;
}

.filter-icon.active .filter-icon-img {
  opacity: 1;
}

.filter-divider {
  width: 3rpx;
  height: 50rpx;
  background: rgba(120, 100, 180, 0.4);
  flex-shrink: 0;
}

/* Hero Grid */
.hero-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30rpx 20rpx;
  padding: 30rpx 20rpx;
}

.hero-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15rpx;
}

.hero-avatar-wrapper {
  position: relative;
  width: 140rpx;
  height: 140rpx;
}

.hero-avatar {
  position: absolute;
  top: 8rpx;
  left: 8rpx;
  width: 124rpx;
  height: 124rpx;
  border-radius: 50%;
  z-index: 2;
  background: rgba(50, 30, 80, 0.8);
}

.hero-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(100, 200, 255, 0.6);
  box-shadow: 
    0 0 15rpx rgba(100, 200, 255, 0.4),
    inset 0 0 15rpx rgba(100, 200, 255, 0.2);
  z-index: 1;
}

.badge {
  position: absolute;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
}

.badge-franchise {
  bottom: 0;
  left: 0;
  background: rgba(200, 150, 50, 0.9);
}

.badge-role {
  bottom: 0;
  right: 0;
  background: rgba(150, 130, 255, 0.9);
}

.badge-icon {
  width: 24rpx;
  height: 24rpx;
}

.hero-name {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  max-width: 140rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Loading and Empty States */
.loading,
.empty {
  padding: 80rpx;
  text-align: center;
}

.loading-text,
.empty-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.6);
}
</style>
