"use client";

import { useState, useEffect, useRef } from "react";

type TimeSlot = {
  id: string;
  time: string; // 예: "09:00"
  display: string; // 예: "오전 9:00"
  isSelected: boolean;
};

export default function TimeTable() {
  // 시간 슬롯 생성 (9시부터 21시, 30분 간격)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(() => {
    const slots: TimeSlot[] = [];
    for (let hour = 9; hour <= 21; hour++) {
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

  // 드래그 시작 위치 및 현재 드래그 위치
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  // 드래그 시작 시점의 원본 타임슬롯 상태
  const [originalTimeSlots, setOriginalTimeSlots] = useState<boolean[]>([]);

  // 드래그 방향 상태
  const [dragDirection, setDragDirection] = useState<"up" | "down" | null>(
    null
  );
  const lastPositionRef = useRef<number | null>(null);

  // refs
  const timeTableRef = useRef<HTMLDivElement>(null);

  // 이전 드래그 범위 추적
  const prevRangeRef = useRef<{ start: number; end: number } | null>(null);

  // 터치 이벤트 발생 여부 추적 플래그 추가
  const isTouchEventRef = useRef(false);
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 단일 슬롯 토글 함수 추가
  const toggleSlot = (index: number) => {
    setTimeSlots((prev) => {
      const newTimeSlots = [...prev];
      newTimeSlots[index].isSelected = !newTimeSlots[index].isSelected;

      console.log(
        `${newTimeSlots[index].display} ${
          newTimeSlots[index].isSelected ? "선택됨" : "선택 해제됨"
        }`
      );

      return newTimeSlots;
    });
  };

  // 드래그 방향 계산
  const updateDragDirection = (clientY: number) => {
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
  };

  // 드래그된 범위 계산 및 타임슬롯 상태 업데이트
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

      // 새로운 타임슬롯 상태 생성
      const newTimeSlots = [...timeSlots];

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

      setTimeSlots(newTimeSlots);

      // 현재 범위 저장
      prevRangeRef.current = { start, end };
    }
  }, [
    isDragging,
    touchStarted,
    dragStart,
    currentIndex,
    selectionMode,
    originalTimeSlots,
  ]);

  // 마우스 이벤트 핸들러
  const handleMouseDown = (index: number, e: React.MouseEvent) => {
    // 터치 이벤트에 의해 트리거된 마우스 이벤트인지 확인
    if (isTouchEventRef.current) {
      console.log("터치 이벤트 후 마우스 이벤트 무시");
      return;
    }

    console.log("mouse down");
    const newMode = !timeSlots[index].isSelected ? "select" : "deselect";
    setOriginalTimeSlots(timeSlots.map((slot) => slot.isSelected));
    setSelectionMode(newMode);
    setIsDragging(true);
    setDragStart(index);
    setCurrentIndex(index);
    prevRangeRef.current = null;
    lastPositionRef.current = e.clientY;

    console.log(
      `${timeSlots[index].display} ${
        newMode === "select" ? "선택 시작" : "해제 시작"
      }`
    );
  };

  const handleMouseEnter = (index: number, e: React.MouseEvent) => {
    // 터치 이벤트에 의해 트리거된 마우스 이벤트인지 확인
    if (isTouchEventRef.current) return;

    console.log("mouse enter");
    if (isDragging) {
      setCurrentIndex(index);
      updateDragDirection(e.clientY);
    }
  };

  const handleMouseUp = (e: React.MouseEvent | null = null) => {
    // 터치 이벤트에 의해 트리거된 마우스 이벤트인지 확인
    if (isTouchEventRef.current) return;

    console.log("mouse up");

    // 클릭 동작 감지 (드래그 없이 같은 요소에서 mousedown과 mouseup이 발생)
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
  };

  // 터치 이벤트 핸들러
  const handleTouchStart = (index: number, e: React.TouchEvent) => {
    // 터치 이벤트 플래그 설정
    isTouchEventRef.current = true;

    // 이전 타임아웃 취소
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
    }

    console.log("touch start");
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

    console.log(
      `${timeSlots[index].display} ${
        newMode === "select" ? "선택 시작" : "해제 시작"
      }`
    );
  };

  const handleTouchMove = (e: TouchEvent) => {
    console.log("touch move");
    if (!touchStarted || !timeTableRef.current) return;

    const touch = e.touches[0];
    updateDragDirection(touch.clientY);

    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element?.getAttribute("data-index")) {
      const index = parseInt(element.getAttribute("data-index") || "0", 10);
      setCurrentIndex(index);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent | TouchEvent) => {
    console.log("touch end");

    // 클릭(탭) 동작 감지
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

    // 터치 이벤트 플래그 리셋 (일정 시간 후)
    touchTimeoutRef.current = setTimeout(() => {
      isTouchEventRef.current = false;
    }, 500); // 500ms 동안 마우스 이벤트 무시
  };

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
        handleTouchMove(e);
      }
    };

    const touchEndHandler = (e: TouchEvent) => {
      if (touchStarted) {
        handleTouchEnd(e);
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

      // 타임아웃 클리어
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }
    };
  }, [isDragging, touchStarted]);

  // 컴포넌트 언마운트시 타임아웃 클리어
  useEffect(() => {
    return () => {
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }
    };
  }, []);

  // 슬롯 클래스 계산 함수
  const getSlotClassName = (index: number, isSelected: boolean) => {
    // 현재 드래그 범위인지 확인 (선택 표시를 위해 유지)
    const isInDragRange =
      dragStart !== null &&
      currentIndex !== null &&
      index >= Math.min(dragStart, currentIndex) &&
      index <= Math.max(dragStart, currentIndex);

    // 현재 마우스/터치가 위치한 슬롯인지 확인 (쫀득한 효과용)
    const isCurrentSlot = currentIndex === index;

    // 쫀득한 효과를 위한 클래스
    let elasticClass = "";

    // 현재 드래그/터치 중이고 현재 슬롯에만 쫀득한 효과 적용
    if ((isDragging || touchStarted) && isCurrentSlot) {
      // 드래그 방향에 관계없이 세로로 늘어나고 가로로 줄어드는 효과 적용
      elasticClass = "transform scale-y-110 scale-x-95";

      // 드래그 방향에 따라 약간의 이동 효과만 다르게 적용
      if (dragDirection === "up") {
        elasticClass += " -translate-y-[1px]";
      } else if (dragDirection === "down") {
        elasticClass += " translate-y-[1px]";
      }
    }

    // 미니멀 디자인과 형광 초록색 적용
    return `w-full py-3 flex flex-col items-center justify-center 
  ${
    isSelected
      ? "bg-lime-400 text-black font-medium"
      : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
  }
  rounded-md cursor-pointer transition-all duration-100 ease-in-out ${elasticClass}
  shadow-sm border-0`;
  };

  // 타임슬롯을 두 열로 균등하게 분할
  const slotCount = timeSlots.length;
  const halfLength = Math.floor(slotCount / 2);
  const leftColumn = timeSlots.slice(0, halfLength);
  const rightColumn = timeSlots.slice(halfLength);

  return (
    <div className="w-full">
      <div ref={timeTableRef} className="grid grid-cols-2 gap-4">
        {/* 왼쪽 열 */}
        <div className="space-y-3">
          {leftColumn.map((slot, index) => (
            <div
              key={slot.id}
              data-index={index}
              className={getSlotClassName(index, slot.isSelected)}
              onMouseDown={(e) => handleMouseDown(index, e)}
              onMouseEnter={(e) => handleMouseEnter(index, e)}
              onMouseUp={(e) => handleMouseUp(e)}
              onTouchStart={(e) => handleTouchStart(index, e)}
              onTouchEnd={(e) => handleTouchEnd(e)}
            >
              <span className="text-base font-medium select-none">
                {slot.display}
              </span>
            </div>
          ))}
        </div>

        {/* 오른쪽 열 */}
        <div className="space-y-3">
          {rightColumn.map((slot, index) => (
            <div
              key={slot.id}
              data-index={index + halfLength}
              className={getSlotClassName(index + halfLength, slot.isSelected)}
              onMouseDown={(e) => handleMouseDown(index + halfLength, e)}
              onMouseEnter={(e) => handleMouseEnter(index + halfLength, e)}
              onMouseUp={(e) => handleMouseUp(e)}
              onTouchStart={(e) => handleTouchStart(index + halfLength, e)}
              onTouchEnd={(e) => handleTouchEnd(e)}
            >
              <span className="text-base font-medium select-none">
                {slot.display}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
