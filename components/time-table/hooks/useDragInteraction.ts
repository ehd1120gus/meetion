import { useState, useCallback, useRef, useEffect } from "react";
import { SelectionMode, DragDirection, TimeSlot } from "../types";

interface UseDragInteractionProps {
  timeSlots: TimeSlot[];
  setTimeSlots: React.Dispatch<React.SetStateAction<TimeSlot[]>>;
  toggleSlot: (index: number) => void;
  slotRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}

export function useDragInteraction({
  timeSlots,
  setTimeSlots,
  toggleSlot,
  slotRefs,
}: UseDragInteractionProps) {
  // 드래그 관련 상태
  const [isDragging, setIsDragging] = useState(false);
  const [touchStarted, setTouchStarted] = useState(false);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(null);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [originalTimeSlots, setOriginalTimeSlots] = useState<boolean[]>([]);
  const [dragDirection, setDragDirection] = useState<DragDirection>(null);
  const [relativeYPosition, setRelativeYPosition] = useState<number>(0);

  // Refs
  const lastPositionRef = useRef<number | null>(null);
  const prevRangeRef = useRef<{ start: number; end: number } | null>(null);
  const isTouchEventRef = useRef(false);
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timeTableRef = useRef<HTMLDivElement>(null);

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
    [slotRefs]
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
    setTimeSlots,
  ]);

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

  // 슬롯 스타일 관련 함수들
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

  return {
    isDragging,
    touchStarted,
    currentIndex,
    dragDirection,
    timeTableRef,
    getSlotClassName,
    getSlotStyle,
    handleMouseDown,
    handleMouseEnter,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchEnd,
  };
}
