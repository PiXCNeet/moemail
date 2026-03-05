"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import { Mail, Calendar, RefreshCw, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useThrottle } from "@/hooks/use-throttle"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

interface Message {
  id: string
  from_address?: string
  subject: string
  received_at?: number
  isRead?: boolean
}

interface MessageListProps {
  email: {
    id: string
    address: string
    token?: string // 确保从父组件传来了 token
  }
  messageType: 'received' | 'sent'
  onMessageSelect: (messageId: string | null, messageType?: 'received' | 'sent') => void
  selectedMessageId?: string | null
  refreshTrigger?: number
}

export function MessageList({ email, messageType, onMessageSelect, selectedMessageId, refreshTrigger }: MessageListProps) {
  const t = useTranslations("emails.messages")
  const tList = useTranslations("emails.list")
  const tCommon = useTranslations("common.actions")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [total, setTotal] = useState(0)
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null)
  const { toast } = useToast()
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // ✅ 核心：适配 Mail.tm 的获取逻辑
  const fetchMessages = async () => {
    // 静态版从 localStorage 获取 token
    const token = email.token || localStorage.getItem('mailtm_token');
    if (!token) return;

    try {
      const response = await fetch(`https://api.mail.tm/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      const rawMessages = data['hydra:member'] || []

      // 映射字段以适配原 UI
      const formattedMessages: Message[] = rawMessages.map((m: any) => ({
        id: m.id,
        from_address: m.from.address,
        subject: m.subject,
        received_at: new Date(m.createdAt).getTime(),
        isRead: m.seen
      }))

      setMessages(formattedMessages)
      setTotal(data['hydra:totalItems'] || formattedMessages.length)
    } catch (error) {
      console.error("Mail.tm fetch error:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // ✅ 核心：适配 Mail.tm 的删除逻辑
  const handleDelete = async (message: Message) => {
    const token = localStorage.getItem('mailtm_token');
    if (!token) return;

    try {
      const response = await fetch(`https://api.mail.tm/messages/${message.id}`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.status === 204) {
        setMessages(prev => prev.filter(e => e.id !== message.id))
        setTotal(prev => prev - 1)
        toast({ title: tList("success"), description: tList("deleteSuccess") })
        if (selectedMessageId === message.id) onMessageSelect(null)
      }
    } catch {
      toast({ title: tList("error"), description: tList("deleteFailed"), variant: "destructive" })
    } finally {
      setMessageToDelete(null)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchMessages()
  }

  // 轮询逻辑
  useEffect(() => {
    fetchMessages()
    pollIntervalRef.current = setInterval(fetchMessages, 10000)
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [email.id, refreshTrigger])

  return (
    <>
      <div className="h-full flex flex-col">
        <div className="p-2 flex justify-between items-center border-b border-primary/20">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            className={cn("h-8 w-8", refreshing && "animate-spin")}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <span className="text-xs text-gray-500">
            {total > 0 ? `${total} ${t("messageCount")}` : t("noMessages")}
          </span>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">{t("loading")}</div>
          ) : messages.length > 0 ? (
            <div className="divide-y divide-primary/10">
              {messages.map(message => (
                <div
                  key={message.id}
                  onClick={() => onMessageSelect(message.id, messageType)}
                  className={cn(
                    "p-3 hover:bg-primary/5 cursor-pointer group relative",
                    selectedMessageId === message.id && "bg-primary/10",
                    !message.isRead && "font-bold border-l-4 border-l-primary" // 未读提示
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Mail className={cn("w-4 h-4 mt-1", message.isRead ? "text-primary/40" : "text-primary")} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{message.subject}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 font-normal">
                        <span className="truncate">{message.from_address}</span>
                        <span className="flex items-center gap-1 shrink-0">
                          <Calendar className="w-3 h-3" />
                          {new Date(message.received_at || 0).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    {/* 删除按钮 */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        setMessageToDelete(message)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center flex flex-col items-center gap-2">
               <Mail className="h-10 w-10 text-primary/20" />
               <p className="text-sm text-gray-500">{t("noMessages")}</p>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!messageToDelete} onOpenChange={() => setMessageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tList("deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tList("deleteDescription", { email: messageToDelete?.subject || "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={() => messageToDelete && handleDelete(messageToDelete)}
            >
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
