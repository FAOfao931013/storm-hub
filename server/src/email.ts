import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { SMTP_HOST, SMTP_PASS, SMTP_PORT, SMTP_SECURE, SMTP_USER } from './config.ts'

let transporter: Transporter | null = null

function getTransporter(): Transporter | null {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('SMTP credentials not configured, email sending disabled')
    return null
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })
  }

  return transporter
}

export async function sendLfgJoinNotification(params: {
  posterEmail: string
  mode: string
  note: string
  joinerBattlenetId: string
  lfgPostId: number
}): Promise<boolean> {
  const transport = getTransporter()
  if (!transport) {
    console.warn('Email not sent: SMTP not configured')
    return false
  }

  const { posterEmail, mode, note, joinerBattlenetId, lfgPostId } = params

  const subject = '【风暴枢纽】有人加入了你的组队'
  const noteSnippet = note ? `\n备注：${note.slice(0, 100)}${note.length > 100 ? '...' : ''}` : ''
  
  const text = `你好！

有玩家加入了你的组队帖子：

模式：${mode}${noteSnippet}
加入者战网ID：${joinerBattlenetId}

组队帖ID：#${lfgPostId}

请登录风暴枢纽小程序查看详情。

---
风暴枢纽 Storm Hub
`

  try {
    await transport.sendMail({
      from: SMTP_USER,
      to: posterEmail,
      subject,
      text,
    })
    console.log(`Email sent to ${posterEmail} for LFG post #${lfgPostId}`)
    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}
