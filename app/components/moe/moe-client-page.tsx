'use client';

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { ThreeColumnLayout } from "@/components/emails/three-column-layout";
import { mailtm } from "@/app/lib/mailtm";
import { useToast } from "@/components/ui/use-toast";

export function MoeClientPage({ locale }: { locale: string }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initAccount = async () => {
      const token = localStorage.getItem('mailtm_token');
      if (!token) {
        try {
          const account = await mailtm.quickCreate();
          localStorage.setItem('mailtm_token', account.token);
          localStorage.setItem('mailtm_address', account.address);
          localStorage.setItem('mailtm_account_id', account.id);
          toast({ title: "Created", description: account.address });
        } catch (error) {
          toast({ variant: "destructive", title: "Init Failed" });
        }
      }
      setIsInitialized(true);
    };
    initAccount();
  }, [toast]);

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <Header />
      <main className="flex-1 relative">
        {isInitialized ? <ThreeColumnLayout /> : <div className="p-10 text-center">Loading...</div>}
      </main>
    </div>
  );
}
