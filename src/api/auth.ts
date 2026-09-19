const API_BASE = 'https://api.fao13578.cn/api'

export interface LoginResponse {
  token: string
  user: {
    openid: string
    nickname: string | null
  }
}

export interface UserInfo {
  openid: string
  nickname: string | null
}

export async function loginWithWeChat(code: string): Promise<LoginResponse | null> {
  try {
    const response = await uni.request({
      url: `${API_BASE}/auth/wechat`,
      method: 'POST',
      data: { code },
      header: {
        'Content-Type': 'application/json',
      },
    })

    if (response.statusCode === 200 && response.data) {
      return response.data as LoginResponse
    }

    return null
  } catch (error) {
    console.error('Login failed:', error)
    return null
  }
}

export async function getCurrentUser(token: string): Promise<UserInfo | null> {
  try {
    const response = await uni.request({
      url: `${API_BASE}/auth/me`,
      method: 'GET',
      header: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.statusCode === 200 && response.data) {
      return response.data as UserInfo
    }

    return null
  } catch (error) {
    console.error('Get user failed:', error)
    return null
  }
}

export async function updateNickname(token: string, nickname: string): Promise<boolean> {
  try {
    const response = await uni.request({
      url: `${API_BASE}/auth/nickname`,
      method: 'POST',
      data: { nickname },
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    return response.statusCode === 200
  } catch (error) {
    console.error('Update nickname failed:', error)
    return false
  }
}
