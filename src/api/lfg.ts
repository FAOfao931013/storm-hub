const API_BASE = 'https://api.fao13578.cn/api'

export interface LfgPost {
  id: number
  mode: string
  party_size: number
  note: string | null
  owner_battlenet_id: string
  owner_nickname: string | null
  participant_count: number
  status: string
  created_at: string
}

export interface LfgPostDetail {
  post: {
    id: number
    mode: string
    party_size: number
    note: string | null
    owner_battlenet_id: string
    status: string
    created_at: string
  }
  participants: Array<{
    battlenet_id: string
    nickname: string | null
    joined_at: string
  }>
}

export async function listLfgPosts(limit = 50, offset = 0): Promise<LfgPost[]> {
  try {
    const response = await uni.request({
      url: `${API_BASE}/lfg?limit=${limit}&offset=${offset}`,
      method: 'GET',
    })

    if (response.statusCode === 200 && response.data) {
      const data = response.data as { posts: LfgPost[] }
      return data.posts
    }

    return []
  } catch (error) {
    console.error('List LFG posts failed:', error)
    return []
  }
}

export async function getLfgPost(id: number): Promise<LfgPostDetail | null> {
  try {
    const response = await uni.request({
      url: `${API_BASE}/lfg/${id}`,
      method: 'GET',
    })

    if (response.statusCode === 200 && response.data) {
      return response.data as LfgPostDetail
    }

    return null
  } catch (error) {
    console.error('Get LFG post failed:', error)
    return null
  }
}

export async function createLfgPost(
  token: string,
  data: {
    mode: string
    party_size: number
    note: string
    battlenet_id: string
    email?: string
  }
): Promise<number | null> {
  try {
    const response = await uni.request({
      url: `${API_BASE}/lfg`,
      method: 'POST',
      data,
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.statusCode === 200 && response.data) {
      const result = response.data as { id: number; ok: boolean }
      return result.id
    }

    return null
  } catch (error) {
    console.error('Create LFG post failed:', error)
    return null
  }
}

export async function joinLfgPost(
  token: string,
  id: number,
  data: {
    battlenet_id: string
    email?: string
  }
): Promise<boolean> {
  try {
    const response = await uni.request({
      url: `${API_BASE}/lfg/${id}/join`,
      method: 'POST',
      data,
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    return response.statusCode === 200
  } catch (error) {
    console.error('Join LFG post failed:', error)
    return false
  }
}

export async function closeLfgPost(token: string, id: number): Promise<boolean> {
  try {
    const response = await uni.request({
      url: `${API_BASE}/lfg/${id}/close`,
      method: 'POST',
      header: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response.statusCode === 200
  } catch (error) {
    console.error('Close LFG post failed:', error)
    return false
  }
}
