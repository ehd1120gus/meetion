import { useState, useCallback, useEffect } from "react";
import { TimeSlot } from "../types";
import { getAvailableTimes } from "@/lib/firebase/db";

export function useTimeSlots(meetingId?: string, dateId?: string) {
  // 시간 슬롯 생성 (9시부터 22시, 30분 간격)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(() => {
    const slots: TimeSlot[] = [];
    for (let hour = 9; hour <= 22; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const time = `${hour.toString().padStart(2, "0")}:${min
          .toString()
          .padStart(2, "0")}`;
        const ampm = hour < 12 ? "오전" : "오후";
        const displayHour = hour <= 12 ? hour : hour - 12;
        const display = `${ampm} ${displayHour}:${min
          .toString()
          .padStart(2, "0")}`;

        slots.push({
          id: `slot-${time}`,
          time,
          display,
          isSelected: false,
        });
      }
    }
    return slots;
  });

  // 슬롯 토글 함수
  const toggleSlot = useCallback((index: number) => {
    setTimeSlots((prev) => {
      const newTimeSlots = [...prev];
      newTimeSlots[index].isSelected = !newTimeSlots[index].isSelected;
      return newTimeSlots;
    });
  }, []);

  // Firebase에서 시간대 가져오기
  useEffect(() => {
    async function loadTimes() {
      if (!meetingId || !dateId) return;

      try {
        const availableTimes = await getAvailableTimes(meetingId, dateId);

        if (availableTimes.length > 0) {
          setTimeSlots((prev) => {
            return prev.map((slot) => {
              const matchingTime = availableTimes.find(
                (t) => t.time === slot.time
              );
              return {
                ...slot,
                isSelected: matchingTime?.isSelected || false,
                isAvailable: !!matchingTime,
              };
            });
          });
        }
      } catch (err) {
        console.error("Failed to load available times:", err);
      }
    }

    loadTimes();
  }, [meetingId, dateId]);

  return { timeSlots, setTimeSlots, toggleSlot };
}
