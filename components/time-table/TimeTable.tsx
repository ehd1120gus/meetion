"use client";

import React from "react";
import { TimeTableProps } from "./types";
import { useTimeSlots } from "./hooks/useTimeSlots";
import { useSlotRefs } from "./hooks/useSlotRefs";
import { useDragInteraction } from "./hooks/useDragInteraction";
import TimeColumn from "./TimeColumn";

export default function TimeTable({ meetingId, dateId }: TimeTableProps) {
  // 커스텀 훅 사용
  const { timeSlots, setTimeSlots, toggleSlot } = useTimeSlots(
    meetingId,
    dateId
  );
  const { slotRefs, setSlotRef } = useSlotRefs(timeSlots);
  const {
    timeTableRef,
    getSlotClassName,
    getSlotStyle,
    handleMouseDown,
    handleMouseEnter,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchEnd,
  } = useDragInteraction({
    timeSlots,
    setTimeSlots,
    toggleSlot,
    slotRefs,
  });

  // 왼쪽 열과 오른쪽 열 시간 정의
  const leftHours = [9, 10, 11, 12, 13, 14, 15];
  const rightHours = [16, 17, 18, 19, 20, 21, 22];

  return (
    <div className="w-full">
      <div ref={timeTableRef} className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 gap-8">
          {/* 왼쪽 열 (9시~15시) */}
          <TimeColumn
            hours={leftHours}
            timeSlots={timeSlots}
            getSlotClassName={getSlotClassName}
            getSlotStyle={getSlotStyle}
            setSlotRef={setSlotRef}
            handleMouseDown={handleMouseDown}
            handleMouseEnter={handleMouseEnter}
            handleMouseMove={handleMouseMove}
            handleMouseUp={handleMouseUp}
            handleTouchStart={handleTouchStart}
            handleTouchEnd={handleTouchEnd}
          />

          {/* 오른쪽 열 (16시~22시) */}
          <TimeColumn
            hours={rightHours}
            timeSlots={timeSlots}
            getSlotClassName={getSlotClassName}
            getSlotStyle={getSlotStyle}
            setSlotRef={setSlotRef}
            handleMouseDown={handleMouseDown}
            handleMouseEnter={handleMouseEnter}
            handleMouseMove={handleMouseMove}
            handleMouseUp={handleMouseUp}
            handleTouchStart={handleTouchStart}
            handleTouchEnd={handleTouchEnd}
          />
        </div>
      </div>
    </div>
  );
}
