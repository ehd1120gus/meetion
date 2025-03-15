"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { getAvailableDates } from "@/lib/firebase/db";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

type DateItem = {
  id: string;
  date: Date;
  formattedDate: string;
  displayDate: string;
  isAvailable: boolean;
};

interface DaySelectorProps {
  meetingId: string;
  onDateSelect: (dateId: string, formattedDate: string) => void;
}

export default function DaySelector({
  meetingId,
  onDateSelect,
}: DaySelectorProps) {
  const [dates, setDates] = useState<DateItem[]>([]);
  const [selectedDateId, setSelectedDateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDates() {
      try {
        setIsLoading(true);
        const availableDates = await getAvailableDates(meetingId);
        setDates(availableDates);

        // 첫 번째 날짜 자동 선택 (있는 경우)
        if (availableDates.length > 0) {
          setSelectedDateId(availableDates[0].id);
          onDateSelect(availableDates[0].id, availableDates[0].formattedDate);
        }
      } catch (err) {
        console.error("Failed to load dates:", err);
        setError("날짜를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    }

    loadDates();
  }, [meetingId, onDateSelect]);

  const handleDateSelect = (dateId: string, formattedDate: string) => {
    setSelectedDateId(dateId);
    onDateSelect(dateId, formattedDate);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">날짜를 불러오는 중...</div>
    );
  }

  if (error) {
    return <div className="text-red-500 py-8">{error}</div>;
  }

  if (dates.length === 0) {
    return <div className="py-8">선택 가능한 날짜가 없습니다.</div>;
  }

  return (
    <div className="w-full py-6">
      <h2 className="text-xl font-semibold mb-4">날짜 선택</h2>
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {dates.map((date) => (
            <CarouselItem
              key={date.id}
              className="pl-2 md:pl-4 basis-1/3 md:basis-1/4 lg:basis-1/5"
            >
              <div
                className={`
                  flex flex-col items-center justify-center p-3 h-24 rounded-lg cursor-pointer
                  transition-all duration-200 ease-in-out border-2
                  ${
                    selectedDateId === date.id
                      ? "bg-lime-400 border-lime-500 text-black"
                      : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                  }
                `}
                onClick={() => handleDateSelect(date.id, date.formattedDate)}
              >
                <span className="font-medium text-sm mb-1">
                  {format(date.date, "M월", { locale: ko })}
                </span>
                <span className="text-xl font-bold">
                  {format(date.date, "d", { locale: ko })}
                </span>
                <span className="text-sm mt-1">
                  {format(date.date, "E", { locale: ko })}요일
                </span>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-0" />
        <CarouselNext className="right-0" />
      </Carousel>
    </div>
  );
}
