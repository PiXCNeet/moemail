"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import { Loader2, AlertCircle } from "lucide-react" 
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useTheme } from "next-themes"
import { useToast } from "@/components/ui/use-toast"

interface Message {
  id: string
  from_address?: string
  to_address?: string
  subject: string
  content: string 
  html?: string   
  received_at?: number
}

interface MessageViewProps {
  emailId: string 
  messageId: string
  messageType?: 'received' | 'sent'
  onClose: () => void
}

type ViewMode = "html" | "text"

export function MessageView({ messageId, messageType = 'received' }: MessageViewProps) {
  const t = useTranslations("emails.messageView")
  const [message, setMessage] = useState<Message | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("html")
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    const fetchMessage = async () => {
      const token = localStorage.getItem('mailtm_token');
      // 预防性检查
      if (!token || !messageId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`https://api.mail.tm/messages/${messageId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })
        
        if (!response.ok) {
          if (response.status === 404) throw new Error("Message not found");
          throw new Error("Failed to load message");
        }
        
        const data = await response.json()
        
        // 适配 Mail.tm 的嵌套对象结构
        const formattedMsg: Message = {
          id: data.id,
          from_address: data.from?.address || "Unknown",
          to_address: data.to?.[0]?.address || "",
          subject: data.subject || "(No Subject)",
          content: data.text || "",
          html: data.html && data.html.length > 0 ? data.html[0] : undefined,
          received_at: new Date(data.createdAt).getTime()
        }

        setMessage(formattedMsg)
        // 如果没有 HTML 内容，自动切换到文本模式
        if (!formattedMsg.html) setViewMode("text")

      } catch (err: any) {
        setError(err.message || "Network Error")
        console.error("Mail.tm fetch detail failed:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchMessage()
  }, [messageId])

  // Iframe 注入逻辑：处理 CSS 变量以匹配 UI 主题
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
                  margin: 0; padding: 24px;
                  color: ${theme === 'dark' ? '#f4f4f5' : '#18181b'};
                  background: transparent;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  line-height: 1.5;
                }
                img { max-width: 100%; height: auto; border-radius: 4px; }
                a { color: #3b82f6; }
                pre { white-space: pre-wrap; word-break: break-all; }
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
    <div className="flex flex-col items-center justify-center h-full gap-2">
      <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
      <span className="text-xs text-muted-foreground">Opening envelope...</span>
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <AlertCircle className="w-10 h-10 text-destructive/50 mb-4" />
      <p className="text-sm font-medium text-destructive mb-2">{error}</p>
      <button 
        onClick={() => window.location.reload()} 
        className="text-xs bg-secondary px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors"
      >
        Retry Connection
      </button>
    </div>
  )

  if (!message) return null

  return (
    <div className="h-full flex flex-col bg-background animate-in fade-in duration-300">
      {/* 邮件元数据 */}
      <div className="p-4 space-y-3 border-b border-primary/10">
        <h3 className="text-lg font-extrabold tracking-tight">{message.subject}</h3>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-medium">From:</span>
            <span className="px-2 py-0.5 bg-primary/10 rounded-full text-primary">{message.from_address}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{new Date(message.received_at || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      {/* 视图切换器 */}
      {message.html && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-b border-primary/5">
          <RadioGroup
            value={viewMode}
            onValueChange={(v) => setViewMode(v as ViewMode)}
            className="flex items-center gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="html" id="html" className="size-3" />
              <Label htmlFor="html" className="text-[10px] uppercase font-bold cursor-pointer opacity-70">Rich Text</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="text" id="text" className="size-3" />
              <Label htmlFor="text" className="text-[10px] uppercase font-bold cursor-pointer opacity-70">Raw Text</Label>
            </div>
          </RadioGroup>
        </div>
      )}
      
      {/* 邮件内容区 */}
      <div className="flex-1 overflow-auto relative">
        {viewMode === "html" && message.html ? (
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            sandbox="allow-same-origin allow-popups allow-scripts"
          />
        ) : (
          <div className="p-6 text-sm whitespace-pre-wrap font-mono leading-relaxed selection:bg-primary/30">
            {message.content}
          </div>
        )}
      </div>
    </div>
  )
}
