import { USER_AGENT, WECHAT_APPID, WECHAT_SECRET } from './config.ts'

interface WeChatSessionResponse {
  openid?: string
  session_key?: string
  unionid?: string
  errcode?: number
  errmsg?: string
}

export async function exchangeCodeForSession(code: string): Promise<{
  openid: string
  sessionKey: string
} | null> {
  if (!WECHAT_APPID || !WECHAT_SECRET) {
    console.error('WeChat credentials not configured')
    return null
  }

  const url = new URL('https://api.weixin.qq.com/sns/jscode2session')
  url.searchParams.set('appid', WECHAT_APPID)
  url.searchParams.set('secret', WECHAT_SECRET)
  url.searchParams.set('js_code', code)
  url.searchParams.set('grant_type', 'authorization_code')

  try {
    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': USER_AGENT },
    })

    if (!response.ok) {
      console.error('WeChat API request failed:', response.status)
      return null
    }

    const data = (await response.json()) as WeChatSessionResponse

    if (data.errcode) {
      console.error('WeChat API error:', data.errcode, data.errmsg)
      return null
    }

    if (!data.openid || !data.session_key) {
      console.error('WeChat API returned incomplete data')
      return null
    }

    return {
      openid: data.openid,
      sessionKey: data.session_key,
    }
  } catch (error) {
    console.error('Failed to exchange code for session:', error)
    return null
  }
}
