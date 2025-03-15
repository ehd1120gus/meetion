"use client";

import { useState } from "react";
import { useParams } from "next/navigation"; // 추가
import DaySelector from "@/components/day-selector";
import TimeTable from "@/components/time-table";

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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">미팅 시간 선택</h1>

      <DaySelector meetingId={meetingId} onDateSelect={handleDateSelect} />

      {selectedDateId && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">
            {selectedFormattedDate && `${selectedFormattedDate} 시간 선택`}
          </h2>
          <TimeTable meetingId={meetingId} dateId={selectedDateId} />
        </div>
      )}
    </div>
  );
}
