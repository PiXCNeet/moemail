// 移除 'use client'
import { MoeClientPage } from "@/components/moe/moe-client-page";

export async function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'zh' },
    { locale: 'zh-CN' }
  ];
}

export const dynamic = "force-static";

export default function Page({ params }: { params: { locale: string } }) {
  // 这里 params 是服务端获取的，直接传给客户端组件
  return <MoeClientPage locale={params.locale} />;
}
