"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react" // 移除了 Share2
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useTheme } from "next-themes"
import { useToast } from "@/components/ui/use-toast"

interface Message {
  id: string
  from_address?: string
  to_address?: string
  subject: string
  content: string // 对应 Mail.tm 的 text
  html?: string   // 对应 Mail.tm 的 html[0]
  received_at?: number
}

interface MessageViewProps {
  emailId: string // 静态版中此 ID 可选，主要是 messageId
  messageId: string
  messageType?: 'received' | 'sent'
  onClose: () => void
}

type ViewMode = "html" | "text"

export function MessageView({ messageId, messageType = 'received' }: MessageViewProps) {
  const t = useTranslations("emails.messageView")
  const tList = useTranslations("emails.list")
  const [message, setMessage] = useState<Message | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("html")
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { theme } = useTheme()
  const { toast } = useToast()

  useEffect(() => {
    const fetchMessage = async () => {
      const token = localStorage.getItem('mailtm_token');
      if (!token || !messageId) return;

      try {
        setLoading(true)
        setError(null)
        
        // ✅ 核心修改：直接请求 Mail.tm
        const response = await fetch(`https://api.mail.tm/messages/${messageId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })
        
        if (!response.ok) throw new Error(t("loadError"))
        
        const data = await response.json()
        
        // ✅ 数据清洗：适配 Mail.tm 的字段
        const formattedMsg: Message = {
          id: data.id,
          from_address: data.from.address,
          to_address: data.to[0]?.address,
          subject: data.subject,
          content: data.text,
          html: data.html && data.html.length > 0 ? data.html[0] : undefined,
          received_at: new Date(data.createdAt).getTime()
        }

        setMessage(formattedMsg)
        if (!formattedMsg.html) setViewMode("text")

      } catch (err) {
        setError(t("networkError"))
        console.error("Fetch failed:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchMessage()
  }, [messageId, t])

  // Iframe 内容更新逻辑保持原样，它能很好地处理 CSS 隔离
  const updateIframeContent = () => {
    if (viewMode === "html" && message?.html && iframeRef.current) {
      const iframe = iframeRef.current
      const doc = iframe.contentDocument || iframe.contentWindow?.document
      if (doc) {
        doc.open()
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <base target="_blank">
              <style>
                html, body {
                  margin: 0; padding: 20px;
                  color: ${theme === 'dark' ? '#e5e7eb' : '#1f2937'};
                  background: ${theme === 'dark' ? '#09090b' : '#fff'};
                  font-family: sans-serif;
                }
                img { max-width: 100%; height: auto; }
              </style>
            </head>
            <body>${message.html}</body>
          </html>
        `)
        doc.close()
      }
    }
  }

  useEffect(() => {
    updateIframeContent()
  }, [message?.html, viewMode, theme])

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
      <p className="text-sm text-destructive mb-4">{error}</p>
      <button onClick={() => window.location.reload()} className="text-xs text-primary underline">
        {t("retry")}
      </button>
    </div>
  )

  if (!message) return null

  return (
    <div className="h-full flex flex-col bg-background">
      {/* 头部信息 */}
      <div className="p-4 space-y-3 border-b border-primary/20">
        <h3 className="text-base font-bold">{message.subject}</h3>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>{t("from")}: {message.from_address}</p>
          <p>{t("time")}: {new Date(message.received_at || 0).toLocaleString()}</p>
        </div>
      </div>
      
      {/* 格式切换 */}
      {message.html && (
        <div className="border-b border-primary/20 p-2 bg-muted/30">
          <RadioGroup
            value={viewMode}
            onValueChange={(v) => setViewMode(v as ViewMode)}
            className="flex items-center gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="html" id="html" />
              <Label htmlFor="html" className="text-xs cursor-pointer">{t("htmlFormat")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="text" id="text" />
              <Label htmlFor="text" className="text-xs cursor-pointer">{t("textFormat")}</Label>
            </div>
          </RadioGroup>
        </div>
      )}
      
      {/* 正文内容 */}
      <div className="flex-1 overflow-auto relative bg-white dark:bg-zinc-950">
        {viewMode === "html" && message.html ? (
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            sandbox="allow-same-origin allow-popups"
          />
        ) : (
          <div className="p-6 text-sm whitespace-pre-wrap font-mono leading-relaxed">
            {message.content}
          </div>
        )}
      </div>
    </div>
  )
}
