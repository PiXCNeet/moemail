"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
// 移除 Next-Auth 和 UserRole 引用
import { Mail, RefreshCw, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Email {
  id: string
  address: string
  createdAt?: number
  expiresAt?: number
}

interface EmailListProps {
  onEmailSelect: (email: Email | null) => void
  selectedEmailId?: string
}

export function EmailList({ onEmailSelect, selectedEmailId }: EmailListProps) {
  const t = useTranslations("emails.list")
  const tCommon = useTranslations("common.actions")
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [emailToDelete, setEmailToDelete] = useState<Email | null>(null)
  const { toast } = useToast()

  // 补全：从 localStorage 加载当前活跃邮箱
  const fetchEmails = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('mailtm_token')
      const address = localStorage.getItem('mailtm_address')
      const id = localStorage.getItem('mailtm_account_id')

      if (token && address && id) {
        const currentEmail: Email = {
          id,
          address,
          expiresAt: Date.now() + 3600000 // 模拟过期时间
        }
        setEmails([currentEmail])
        
        // 自动选中当前邮箱
        if (!selectedEmailId) {
          onEmailSelect(currentEmail)
        }
      } else {
        setEmails([])
      }
    } catch (error) {
      console.error("Failed to load local email:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchEmails()
  }

  // 关键：移除对 session 的依赖，改为组件加载时运行
  useEffect(() => {
    fetchEmails()
  }, [])

  const handleDelete = async (email: Email) => {
    try {
      // 静态版删除逻辑：直接清空本地存储
      localStorage.removeItem('mailtm_token')
      localStorage.removeItem('mailtm_address')
      localStorage.removeItem('mailtm_account_id')
      
      setEmails([])
      onEmailSelect(null)

      toast({
        title: t("success"),
        description: t("deleteSuccess")
      })
    } catch {
      toast({
        title: t("error"),
        description: t("deleteFailed"),
        variant: "destructive"
      })
    } finally {
      setEmailToDelete(null)
    }
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="p-2 flex justify-between items-center border-b border-primary/20">
          <div className="flex items-center gap-2">
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
              {t("emailCount", { count: emails.length, max: 1 })}
            </span>
          </div>
          {/* 这里可以放 CreateDialog，但它也需要修改成调用 mailtm.quickCreate */}
        </div>
        
        <div className="flex-1 overflow-auto p-2">
          {loading ? (
            <div className="text-center text-sm text-gray-500 py-4">{t("loading")}</div>
          ) : emails.length > 0 ? (
            <div className="space-y-1">
              {emails.map(email => (
                <div
                  key={email.id}
                  className={cn("flex items-center gap-2 p-2 rounded cursor-pointer text-sm group",
                    "hover:bg-primary/5",
                    selectedEmailId === email.id && "bg-primary/10"
                  )}
                  onClick={() => onEmailSelect(email)}
                >
                  <Mail className="h-4 w-4 text-primary/60" />
                  <div className="truncate flex-1">
                    <div className="font-medium truncate">{email.address}</div>
                    <div className="text-xs text-gray-500">
                      {t("permanent")}
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEmailToDelete(email)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-sm text-gray-500 py-10">
              {t("noEmails")}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!emailToDelete} onOpenChange={() => setEmailToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDescription", { email: emailToDelete?.address || "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => emailToDelete && handleDelete(emailToDelete)}
            >
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
