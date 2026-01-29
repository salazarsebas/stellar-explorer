"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  const t = useTranslations("errors");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground mt-2">{t("notFound")}</p>
      <Button asChild className="mt-6">
        <Link href="/">
          <Home className="mr-2 size-4" />
          {useTranslations("common")("home")}
        </Link>
      </Button>
    </div>
  );
}
