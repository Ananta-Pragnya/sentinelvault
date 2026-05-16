"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("sv_token");
    router.replace(token ? "/dashboard" : "/onboarding");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-sentinel-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
