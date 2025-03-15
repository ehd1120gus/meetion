"use client";

import { redirect } from "next/navigation";

export default function EngageRedirect() {
  // 기본 ID로 리디렉션하거나 다른 페이지로 이동
  redirect("/engage/default-meeting-id");
}
