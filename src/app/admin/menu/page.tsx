"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function MenuPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to categories page
    router.replace("/admin/categories");
  }, [router]);

  return (
    <div className="flex items-center justify-center p-20">
      <Loader2 className="h-8 w-8 animate-spin text-gold" />
    </div>
  );
}
