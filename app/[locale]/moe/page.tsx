'use client';

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { ThreeColumnLayout } from "@/components/emails/three-column-layout";
import { mailtm } from "@/app/lib/mailtm";
import { useToast } from "@/components/ui/use-toast";

/**
 * 补全点 1：静态导出必须定义 generateStaticParams
 * 否则 Next.js 构建时不知道如何处理 [locale] 动态路由
 */
export async function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'zh' },
    { locale: 'zh-CN' }
  ];
}

/**
 * 补全点 2：显式声明为强制静态模式
 */
export const dynamic = "force-static";

interface PageProps {
  params: {
    locale: string;
  };
}

export default function MoePage({ params }: PageProps) {
  // 静态导出下 params 直接访问，不需要 await
  const locale = params.locale; 
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initAccount = async () => {
      // 检查本地存储
      const token = localStorage.getItem('mailtm_token');
      
      if (!token) {
        try {
          toast({ 
            title: "正在生成临时邮箱...", 
            description: "连接至 Mail.tm 服务" 
          });
          
          const account = await mailtm.quickCreate();
          
          /**
           * 补全点 3：完整持久化
           * 确保 ID、Token 和 Address 全部存入本地，供 ThreeColumnLayout 调用
           */
          localStorage.setItem('mailtm_token', account.token);
          localStorage.setItem('mailtm_address', account.address);
          if (account.id) {
            localStorage.setItem('mailtm_account_id', account.id);
          }
          
          toast({ 
            title: "创建成功", 
            description: `您的邮箱: ${account.address}` 
          });
        } catch (error) {
          console.error("Mail.tm Initialization Error:", error);
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

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 h-screen overflow-hidden">
      <div className="container mx-auto h-full px-4 lg:px-8 max-w-[1600px] flex flex-col">
        {/* 导航栏 */}
        <Header />
        
        <main className="flex-1 min-h-0 relative">
          {/* 核心逻辑提示：
            此时 ThreeColumnLayout 被加载，它内部的所有子组件（EmailList, MessageList）
            必须改为从 localStorage 读取 token 直接请求 mail.tm API，
            而不是请求你原来的 /api/emails 后端路由。
          */}
          {isInitialized ? (
            <ThreeColumnLayout />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground animate-pulse">Initializing Secure Mailbox...</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
