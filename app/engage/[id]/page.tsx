"use client";

import { useState } from "react";
import { useParams } from "next/navigation"; // 추가
import DateTimeCarousel from "@/components/date-time-carousel";

export default function MeetingPage() {
  // params 대신 useParams 훅 사용
  const params = useParams();
  const meetingId = params.id as string;

  const [selectedDateId, setSelectedDateId] = useState<string | null>(null);
  const [selectedFormattedDate, setSelectedFormattedDate] = useState<
    string | null
  >(null);

  const handleDateSelect = (dateId: string, formattedDate: string) => {
    setSelectedDateId(dateId);
    setSelectedFormattedDate(formattedDate);
  };

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold mb-6">미팅 설정</h1>

      {/* 날짜와 시간표가 함께 움직이는 캐러셀 */}
      <DateTimeCarousel meetingId={meetingId} onDateSelect={handleDateSelect} />

      {/* 이제 별도의 TimeTable 컴포넌트는 필요 없음 */}
    </div>
  );
}
