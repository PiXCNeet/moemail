'use client'; // 必须声明为客户端组件

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { ThreeColumnLayout } from "@/components/emails/three-column-layout";
// 移除 NoPermissionDialog, auth, redirect, checkPermission 等服务端引用
import type { Locale } from "@/i18n/config";
import { mailtm } from "@/app/lib/mailtm";
import { useToast } from "@/components/ui/use-toast";

// 静态导出不支持 export const runtime = "edge"
export default function MoePage({
  params,
}: {
  params: { locale: string } // 静态模式下 params 不再是 Promise
}) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initAccount = async () => {
      // 检查本地存储是否有 Mail.tm 的 Token
      const token = localStorage.getItem('mailtm_token');
      
      if (!token) {
        try {
          toast({ title: "正在生成临时邮箱...", description: "连接至 Mail.tm 服务" });
          const account = await mailtm.quickCreate();
          // 保存到本地，模拟 Session
          localStorage.setItem('mailtm_token', account.token);
          localStorage.setItem('mailtm_address', account.address);
          localStorage.setItem('mailtm_account_id', account.id);
          
          toast({ title: "创建成功", description: `您的邮箱: ${account.address}` });
        } catch (error) {
          toast({ 
            variant: "destructive", 
            title: "创建失败", 
            description: "请检查网络或 Mail.tm 服务状态" 
          });
        }
      }
      setIsInitialized(true);
    };

    initAccount();
  }, [toast]);

  // 静态导出时，Header 和 Layout 会直接渲染，内部逻辑通过 useEffect 补全数据
  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 h-screen overflow-hidden">
      <div className="container mx-auto h-full px-4 lg:px-8 max-w-[1600px] flex flex-col">
        <Header />
        <main className="flex-1 min-h-0 relative">
          {/* 注意：原来的 ThreeColumnLayout 内部可能还在调用 /api 接口。
              你需要确保 ThreeColumnLayout 组件内部也改为从 localStorage 读取 token 并请求 Mail.tm。
          */}
          {isInitialized ? (
            <ThreeColumnLayout />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
