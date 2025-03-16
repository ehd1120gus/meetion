"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { getAvailableTimes } from "@/lib/firebase/db";

type TimeSlot = {
  id: string;
  time: string; // 예: "09:00"
  display: string; // 예: "오전 9:00"
  isSelected: boolean;
};

interface TimeTableProps {
  meetingId?: string; // Firebase ID
  dateId?: string; // 선택된 날짜 ID
}

// 슬롯 컴포넌트 추출하여 재사용성 높이기
interface TimeSlotItemProps {
  index: number;
  slot: TimeSlot;
  onSetRef: (index: number, el: HTMLDivElement | null) => void;
  className: string;
  style: React.CSSProperties;
  onMouseDown: (index: number, e: React.MouseEvent) => void;
  onMouseEnter: (index: number, e: React.MouseEvent) => void;
  onMouseMove: (index: number, e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onTouchStart: (index: number, e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

// 슬롯 아이템 컴포넌트
const TimeSlotItem = ({
  index,
  slot,
  onSetRef,
  className,
  style,
  onMouseDown,
  onMouseEnter,
  onMouseMove,
  onMouseUp,
  onTouchStart,
  onTouchEnd,
}: TimeSlotItemProps) => (
  <div
    key={slot.id}
    ref={(el) => onSetRef(index, el)}
    data-index={index}
    className={className}
    style={style}
    onMouseDown={(e) => onMouseDown(index, e)}
    onMouseEnter={(e) => onMouseEnter(index, e)}
    onMouseMove={(e) => onMouseMove(index, e)}
    onMouseUp={(e) => onMouseUp(e)}
    onTouchStart={(e) => onTouchStart(index, e)}
    onTouchEnd={(e) => onTouchEnd(e)}
  >
    <span className="text-sm font-medium select-none">
      {slot.time.split(":")[1]}
    </span>
  </div>
);

// 시간 열 컴포넌트
interface TimeColumnProps {
  hours: number[];
  timeSlots: TimeSlot[];
  getSlotClassName: (index: number, isSelected: boolean) => string;
  getSlotStyle: (index: number, isSelected: boolean) => React.CSSProperties;
  setSlotRef: (index: number, el: HTMLDivElement | null) => void;
  handleMouseDown: (index: number, e: React.MouseEvent) => void;
  handleMouseEnter: (index: number, e: React.MouseEvent) => void;
  handleMouseMove: (index: number, e: React.MouseEvent) => void;
  handleMouseUp: (e: React.MouseEvent) => void;
  handleTouchStart: (index: number, e: React.TouchEvent) => void;
  handleTouchEnd: (e: React.TouchEvent) => void;
}

const TimeColumn = ({
  hours,
  timeSlots,
  getSlotClassName,
  getSlotStyle,
  setSlotRef,
  handleMouseDown,
  handleMouseEnter,
  handleMouseMove,
  handleMouseUp,
  handleTouchStart,
  handleTouchEnd,
}: TimeColumnProps) => (
  <div>
    {hours.map((hour) => {
      const hourString = hour.toString().padStart(2, "0");

      // 이 시간대의 슬롯 찾기
      const slot00Index = timeSlots.findIndex(
        (s) => s.time === `${hourString}:00`
      );
      const slot30Index = timeSlots.findIndex(
        (s) => s.time === `${hourString}:30`
      );

      // 이 시간대에 표시할 슬롯이 없으면 건너뜀
      if (slot00Index === -1 && slot30Index === -1) {
        return null;
      }

      return (
        <div key={`hour-${hour}`} className="mb-2">
          <div className="flex">
            {/* 시간 레이블 */}
            <div className="w-10 py-3 text-right pr-3 text-zinc-400 font-medium">
              {hour}
            </div>

            {/* 슬롯 영역 */}
            <div className="flex-1 space-y-2">
              {/* 00분 슬롯 */}
              {slot00Index !== -1 && (
                <TimeSlotItem
                  index={slot00Index}
                  slot={timeSlots[slot00Index]}
                  onSetRef={setSlotRef}
                  className={getSlotClassName(
                    slot00Index,
                    timeSlots[slot00Index].isSelected
                  )}
                  style={getSlotStyle(
                    slot00Index,
                    timeSlots[slot00Index].isSelected
                  )}
                  onMouseDown={handleMouseDown}
                  onMouseEnter={handleMouseEnter}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                />
              )}

              {/* 30분 슬롯 */}
              {slot30Index !== -1 && (
                <TimeSlotItem
                  index={slot30Index}
                  slot={timeSlots[slot30Index]}
                  onSetRef={setSlotRef}
                  className={getSlotClassName(
                    slot30Index,
                    timeSlots[slot30Index].isSelected
                  )}
                  style={getSlotStyle(
                    slot30Index,
                    timeSlots[slot30Index].isSelected
                  )}
                  onMouseDown={handleMouseDown}
                  onMouseEnter={handleMouseEnter}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                />
              )}
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

export default function TimeTable({ meetingId, dateId }: TimeTableProps) {
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

  // 드래그 관련 상태
  const [isDragging, setIsDragging] = useState(false);
  const [touchStarted, setTouchStarted] = useState(false);
  const [selectionMode, setSelectionMode] = useState<
    "select" | "deselect" | null
  >(null);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [originalTimeSlots, setOriginalTimeSlots] = useState<boolean[]>([]);
  const [dragDirection, setDragDirection] = useState<"up" | "down" | null>(
    null
  );
  const [relativeYPosition, setRelativeYPosition] = useState<number>(0);

  // Refs
  const timeTableRef = useRef<HTMLDivElement>(null);
  const lastPositionRef = useRef<number | null>(null);
  const prevRangeRef = useRef<{ start: number; end: number } | null>(null);
  const isTouchEventRef = useRef(false);
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 슬롯 토글 함수
  const toggleSlot = useCallback((index: number) => {
    setTimeSlots((prev) => {
      const newTimeSlots = [...prev];
      newTimeSlots[index].isSelected = !newTimeSlots[index].isSelected;
      return newTimeSlots;
    });
  }, []);

  // 드래그 방향 계산
  const updateDragDirection = useCallback((clientY: number) => {
    if (lastPositionRef.current === null) {
      lastPositionRef.current = clientY;
      return;
    }

    if (clientY < lastPositionRef.current) {
      setDragDirection("up");
    } else if (clientY > lastPositionRef.current) {
      setDragDirection("down");
    }

    lastPositionRef.current = clientY;
  }, []);

  // 마우스/터치 위치에 따른 상대적 Y 위치 계산 함수
  const calculateRelativeYPosition = useCallback(
    (clientY: number, index: number) => {
      const slotElement = slotRefs.current[index];
      if (!slotElement) return 0;

      const rect = slotElement.getBoundingClientRect();
      const slotMiddleY = rect.top + rect.height / 2;
      const relY = (clientY - slotMiddleY) / (rect.height / 2);
      return Math.max(-1, Math.min(1, relY));
    },
    []
  );

  // 슬롯 클래스 계산 함수
  const getSlotClassName = useCallback(
    (index: number, isSelected: boolean) => {
      const isInDragRange =
        dragStart !== null &&
        currentIndex !== null &&
        index >= Math.min(dragStart, currentIndex) &&
        index <= Math.max(dragStart, currentIndex);

      const isCurrentSlot = currentIndex === index;

      const effectClass =
        (isDragging || touchStarted) && currentIndex === index
          ? "elastic-effect"
          : "";

      return `w-full py-3 flex flex-col items-center justify-center 
      ${
        isSelected
          ? "bg-lime-400 text-black font-medium"
          : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
      }
      rounded-md cursor-pointer transition-all duration-100 ease-in-out ${effectClass}
      shadow-sm border-0`;
    },
    [isDragging, touchStarted, dragStart, currentIndex]
  );

  // 슬롯 스타일 계산 함수
  const getSlotStyle = useCallback(
    (index: number, isSelected: boolean): React.CSSProperties => {
      const isCurrentSlot = currentIndex === index;
      let style: React.CSSProperties = {};

      if ((isDragging || touchStarted) && isCurrentSlot) {
        const yScaleFactor = 0.95 + Math.abs(relativeYPosition) * 0.15;
        const xScaleFactor = 1.05 - Math.abs(relativeYPosition) * 0.15;

        style.transform = `scaleY(${yScaleFactor.toFixed(
          3
        )}) scaleX(${xScaleFactor.toFixed(3)})`;

        if (dragDirection === "up") {
          style.transform += " translateY(-2px)";
        } else if (dragDirection === "down") {
          style.transform += " translateY(2px)";
        }

        style.transition = "transform 80ms cubic-bezier(0.25, 0.1, 0.25, 1.5)";
      }

      return style;
    },
    [isDragging, touchStarted, currentIndex, relativeYPosition, dragDirection]
  );

  // 이벤트 핸들러들
  const handleMouseDown = useCallback(
    (index: number, e: React.MouseEvent) => {
      if (isTouchEventRef.current) return;

      const newMode = !timeSlots[index].isSelected ? "select" : "deselect";
      setOriginalTimeSlots(timeSlots.map((slot) => slot.isSelected));
      setSelectionMode(newMode);
      setIsDragging(true);
      setDragStart(index);
      setCurrentIndex(index);
      prevRangeRef.current = null;
      lastPositionRef.current = e.clientY;
    },
    [timeSlots]
  );

  const handleMouseEnter = useCallback(
    (index: number, e: React.MouseEvent) => {
      if (isTouchEventRef.current || !isDragging) return;

      setCurrentIndex(index);
      const relY = calculateRelativeYPosition(e.clientY, index);
      setRelativeYPosition(relY);
      updateDragDirection(e.clientY);
    },
    [isDragging, calculateRelativeYPosition, updateDragDirection]
  );

  const handleMouseMove = useCallback(
    (index: number, e: React.MouseEvent) => {
      if (isTouchEventRef.current || !isDragging || currentIndex !== index)
        return;

      const relY = calculateRelativeYPosition(e.clientY, index);
      setRelativeYPosition(relY);
      updateDragDirection(e.clientY);
    },
    [isDragging, currentIndex, calculateRelativeYPosition, updateDragDirection]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent | null = null) => {
      if (isTouchEventRef.current) return;

      if (
        isDragging &&
        dragStart !== null &&
        currentIndex !== null &&
        dragStart === currentIndex
      ) {
        toggleSlot(dragStart);
      }

      setIsDragging(false);
      setDragStart(null);
      setCurrentIndex(null);
      setSelectionMode(null);
      prevRangeRef.current = null;
      setDragDirection(null);
      lastPositionRef.current = null;
    },
    [isDragging, dragStart, currentIndex, toggleSlot]
  );

  const handleTouchStart = useCallback(
    (index: number, e: React.TouchEvent) => {
      isTouchEventRef.current = true;

      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }

      const newMode = !timeSlots[index].isSelected ? "select" : "deselect";
      setOriginalTimeSlots(timeSlots.map((slot) => slot.isSelected));
      setSelectionMode(newMode);
      setTouchStarted(true);
      setDragStart(index);
      setCurrentIndex(index);
      prevRangeRef.current = null;

      if (e.touches.length > 0) {
        lastPositionRef.current = e.touches[0].clientY;
      }
    },
    [timeSlots]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent | TouchEvent) => {
      if (
        touchStarted &&
        dragStart !== null &&
        currentIndex !== null &&
        dragStart === currentIndex
      ) {
        toggleSlot(dragStart);
      }

      setTouchStarted(false);
      setDragStart(null);
      setCurrentIndex(null);
      setSelectionMode(null);
      prevRangeRef.current = null;
      setDragDirection(null);
      lastPositionRef.current = null;

      touchTimeoutRef.current = setTimeout(() => {
        isTouchEventRef.current = false;
      }, 500);
    },
    [touchStarted, dragStart, currentIndex, toggleSlot]
  );

  // 드래그된 범위 계산 및 타임슬롯 상태 업데이트 useEffect 수정
  useEffect(() => {
    if (
      (isDragging || touchStarted) &&
      dragStart !== null &&
      currentIndex !== null &&
      selectionMode !== null
    ) {
      // 드래그 범위 계산 (시작과 현재 사이)
      const start = Math.min(dragStart, currentIndex);
      const end = Math.max(dragStart, currentIndex);

      // 이전에 처리한 범위와 동일하면 업데이트 건너뜀
      if (
        prevRangeRef.current?.start === start &&
        prevRangeRef.current?.end === end
      ) {
        return;
      }

      // 함수형 업데이트를 사용하여 무한 루프 방지
      setTimeSlots((prevSlots) => {
        // 새로운 타임슬롯 상태 생성
        const newTimeSlots = [...prevSlots];

        // 모든 슬롯을 원래 상태로 초기화
        newTimeSlots.forEach((slot, idx) => {
          // 드래그 범위 내의 슬롯만 선택 또는 해제 상태 적용
          if (idx >= start && idx <= end) {
            newTimeSlots[idx].isSelected = selectionMode === "select";
          } else {
            // 범위 밖의 슬롯은 드래그 시작 전 원본 상태로 복원
            newTimeSlots[idx].isSelected = originalTimeSlots[idx];
          }
        });

        return newTimeSlots;
      });

      prevRangeRef.current = { start, end };
    }
  }, [
    isDragging,
    touchStarted,
    dragStart,
    currentIndex,
    selectionMode,
    originalTimeSlots,
    // timeSlots 제거
  ]);

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

  // 전역 이벤트 리스너 등록
  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isDragging && !isTouchEventRef.current) {
        handleMouseUp(null);
      }
    };

    const touchMoveHandler = (e: TouchEvent) => {
      if (touchStarted) {
        e.preventDefault();

        const touch = e.touches[0];
        updateDragDirection(touch.clientY);

        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (element?.getAttribute("data-index")) {
          const index = parseInt(element.getAttribute("data-index") || "0", 10);
          setCurrentIndex(index);

          const relY = calculateRelativeYPosition(touch.clientY, index);
          setRelativeYPosition(relY);
        }
      }
    };

    const touchEndHandler = (e: TouchEvent) => {
      if (touchStarted) {
        handleTouchEnd(e as any);
      }
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);

    if (timeTableRef.current) {
      timeTableRef.current.addEventListener("touchmove", touchMoveHandler, {
        passive: false,
      });
      document.addEventListener("touchend", touchEndHandler);
    }

    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);

      if (timeTableRef.current) {
        timeTableRef.current.removeEventListener("touchmove", touchMoveHandler);
      }
      document.removeEventListener("touchend", touchEndHandler);

      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }
    };
  }, [
    isDragging,
    touchStarted,
    handleMouseUp,
    updateDragDirection,
    calculateRelativeYPosition,
    handleTouchEnd,
  ]);

  // 컴포넌트 언마운트시 타임아웃 클리어
  useEffect(() => {
    return () => {
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }
    };
  }, []);

  // 슬롯 ref 초기화
  useEffect(() => {
    const newRefs = Array(timeSlots.length).fill(null);

    if (slotRefs.current.length > 0) {
      slotRefs.current.forEach((ref, idx) => {
        if (idx < newRefs.length) {
          newRefs[idx] = ref;
        }
      });
    }

    slotRefs.current = newRefs;
  }, [timeSlots.length]);

  // 안전한 ref 할당 함수
  const setSlotRef = useCallback(
    (index: number, element: HTMLDivElement | null) => {
      if (index >= 0 && index < timeSlots.length) {
        slotRefs.current[index] = element;
      }
    },
    [timeSlots.length]
  );

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
