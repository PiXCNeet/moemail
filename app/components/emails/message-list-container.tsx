"use client"

import { useEffect, useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { mailtm } from "@/app/lib/mailtm"
import { cn } from "@/lib/utils"
import { Mail, MailOpen, Loader2 } from "lucide-react"

export function MessageList({ email, onMessageSelect, selectedMessageId, refreshTrigger }: any) {
  const t = useTranslations("emails.messages")
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMessages = useCallback(async () => {
    // 核心修改：从本地获取静态存储的 Token
    const token = localStorage.getItem('mailtm_token')
    if (!token) return

    try {
      const data = await mailtm.getMessages(token)
      setMessages(data || [])
    } catch (error) {
      console.error("Mail.tm fetch error:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 轮询逻辑：每 10 秒自动检查新邮件
  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 10000)
    return () => clearInterval(interval)
  }, [fetchMessages, refreshTrigger, email?.id])

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {t("loading") || "Loading messages..."}
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground opacity-50">
          <Mail className="h-12 w-12 mb-2" />
          <p>{t("noMessages") || "No messages found"}</p>
        </div>
      ) : (
        <div className="divide-y divide-primary/10">
          {messages.map((msg) => (
            <div
              key={msg.id}
              onClick={() => onMessageSelect(msg.id)}
              className={cn(
                "p-4 cursor-pointer hover:bg-primary/5 transition-all relative",
                selectedMessageId === msg.id && "bg-primary/10",
                !msg.seen && "bg-primary/5 font-semibold"
              )}
            >
              {!msg.seen && (
                <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full" />
              )}
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs text-primary truncate max-w-[70%]">
                  {msg.from.address}
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-sm truncate pr-4">{msg.subject || "(No Subject)"}</div>
              <div className="text-xs text-muted-foreground truncate opacity-70 mt-1">
                {msg.intro}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
