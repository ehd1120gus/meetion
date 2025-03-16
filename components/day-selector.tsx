"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { getAvailableDates } from "@/lib/firebase/db";
import useEmblaCarousel from "embla-carousel-react";
import { EmblaCarouselType, EmblaEventType } from "embla-carousel";

// 트윈 효과를 위한 상수 정의
const TWEEN_FACTOR_BASE = 0.52;

// 숫자를 범위 내로 제한하는 유틸리티 함수
const numberWithinRange = (number: number, min: number, max: number): number =>
  Math.min(Math.max(number, min), max);

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

// Dot 버튼 훅
const useDotButton = (emblaApi: EmblaCarouselType | undefined) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onDotButtonClick = useCallback(
    (index: number) => {
      if (!emblaApi) return;
      emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const onInit = useCallback((emblaApi: EmblaCarouselType) => {
    setScrollSnaps(emblaApi.scrollSnapList());
  }, []);

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    onInit(emblaApi);
    onSelect(emblaApi);

    emblaApi.on("reInit", onInit).on("reInit", onSelect).on("select", onSelect);
  }, [emblaApi, onInit, onSelect]);

  return {
    selectedIndex,
    scrollSnaps,
    onDotButtonClick,
  };
};

// Dot 버튼 컴포넌트
const DotButton = (props: { onClick: () => void; className: string }) => {
  const { onClick, className } = props;
  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      aria-label="날짜 선택하기"
    />
  );
};

export default function DaySelector({
  meetingId,
  onDateSelect,
}: DaySelectorProps) {
  const [dates, setDates] = useState<DateItem[]>([]);
  const [selectedDateId, setSelectedDateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 트윈 효과를 위한 참조
  const tweenNodes = useRef<HTMLElement[]>([]);
  const tweenFactor = useRef(TWEEN_FACTOR_BASE);

  // Embla Carousel 훅 설정
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false,
    dragFree: false,
  });

  const { selectedIndex, scrollSnaps, onDotButtonClick } =
    useDotButton(emblaApi);

  // 트윈 노드 설정
  const setTweenNodes = useCallback((emblaApi: EmblaCarouselType) => {
    tweenNodes.current = emblaApi.slideNodes().map((slideNode) => {
      return slideNode.querySelector(".tween-item") as HTMLElement;
    });
  }, []);

  // 트윈 팩터 설정
  const setTweenFactor = useCallback((emblaApi: EmblaCarouselType) => {
    tweenFactor.current = TWEEN_FACTOR_BASE * emblaApi.scrollSnapList().length;
  }, []);

  // 트윈 스케일 효과 적용
  const tweenScale = useCallback(
    (emblaApi: EmblaCarouselType, eventName?: EmblaEventType) => {
      const engine = emblaApi.internalEngine();
      const scrollProgress = emblaApi.scrollProgress();
      const slidesInView = emblaApi.slidesInView();
      const isScrollEvent = eventName === "scroll";

      emblaApi.scrollSnapList().forEach((scrollSnap, snapIndex) => {
        let diffToTarget = scrollSnap - scrollProgress;
        const slidesInSnap = engine.slideRegistry[snapIndex];

        slidesInSnap.forEach((slideIndex) => {
          if (isScrollEvent && !slidesInView.includes(slideIndex)) return;

          if (engine.options.loop) {
            engine.slideLooper.loopPoints.forEach((loopItem) => {
              const target = loopItem.target();

              if (slideIndex === loopItem.index && target !== 0) {
                const sign = Math.sign(target);

                if (sign === -1) {
                  diffToTarget = scrollSnap - (1 + scrollProgress);
                }
                if (sign === 1) {
                  diffToTarget = scrollSnap + (1 - scrollProgress);
                }
              }
            });
          }

          const tweenValue =
            0.5 * (1 - Math.abs(diffToTarget * tweenFactor.current));
          const scale = (
            0.5 + numberWithinRange(tweenValue, 0, 0.5)
          ).toString();
          const tweenNode = tweenNodes.current[slideIndex];

          if (tweenNode) {
            tweenNode.style.transform = `scale(${scale})`;
          }
        });
      });
    },
    []
  );

  // 트윈 효과 설정
  useEffect(() => {
    if (!emblaApi) return;

    setTweenNodes(emblaApi);
    setTweenFactor(emblaApi);
    tweenScale(emblaApi);

    emblaApi
      .on("reInit", setTweenNodes)
      .on("reInit", setTweenFactor)
      .on("reInit", tweenScale)
      .on("scroll", tweenScale)
      .on("slideFocus", tweenScale);

    return () => {
      emblaApi
        .off("reInit", setTweenNodes)
        .off("reInit", setTweenFactor)
        .off("reInit", tweenScale)
        .off("scroll", tweenScale)
        .off("slideFocus", tweenScale);
    };
  }, [emblaApi, setTweenNodes, setTweenFactor, tweenScale]);

  // 날짜 선택 핸들러
  const handleDateSelect = useCallback(
    (dateId: string, formattedDate: string) => {
      setSelectedDateId(dateId);
      onDateSelect(dateId, formattedDate);

      // 선택한 날짜에 해당하는 슬라이드로 이동
      if (emblaApi && dates.length > 0) {
        const index = dates.findIndex((date) => date.id === dateId);
        if (index !== -1) {
          emblaApi.scrollTo(index);
        }
      }
    },
    [onDateSelect, emblaApi, dates]
  );

  // 슬라이드 변경 시 날짜 선택 동기화
  //   useEffect(() => {
  //     if (emblaApi && dates.length > 0 && selectedIndex !== undefined) {
  //       const currentDate = dates[selectedIndex];
  //       if (currentDate && currentDate.id !== selectedDateId) {
  //         handleDateSelect(currentDate.id, currentDate.formattedDate);
  //       }
  //     }
  //   }, [selectedIndex, dates, emblaApi, handleDateSelect, selectedDateId]);

  // 날짜 데이터 로딩
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

      {/* Embla Carousel 구현 */}
      <div className="max-w-xl mx-auto">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex touch-pan-y">
            {dates.map((date, index) => {
              const isSelected = selectedDateId === date.id;

              return (
                <div key={date.id} className="flex-[0_0_55%] min-w-0 pl-4">
                  <div
                    className="tween-item flex flex-col items-center justify-center rounded-xl
                      shadow-sm transition-all duration-300 ease-out
                      font-medium cursor-pointer h-40"
                    onClick={() =>
                      handleDateSelect(date.id, date.formattedDate)
                    }
                  >
                    <div
                      className={`
                        w-full h-full flex flex-col items-center justify-center rounded-xl
                        ${
                          isSelected
                            ? "bg-zinc-900 border-2 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                            : "bg-zinc-900 border-2 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                        }
                      `}
                    >
                      <div className="text-sm mb-1">
                        {format(date.date, "M월", { locale: ko })}
                      </div>
                      <div
                        className={`font-bold ${
                          isSelected ? "text-3xl" : "text-2xl"
                        }`}
                      >
                        {format(date.date, "d", { locale: ko })}
                      </div>
                      <div className="mt-1 text-sm">
                        {format(date.date, "E", { locale: ko })}요일
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dot 버튼 네비게이션 */}
        <div className="flex justify-end mt-4">
          <div className="flex flex-wrap gap-2">
            {scrollSnaps.map((_, index) => (
              <DotButton
                key={index}
                onClick={() => onDotButtonClick(index)}
                className={`
                  w-8 h-8 flex items-center justify-center rounded-full relative
                  after:content-[''] after:w-4 after:h-4 after:rounded-full 
                  ${
                    index === selectedIndex
                      ? "after:border-2 after:border-lime-400"
                      : "after:border-2 after:border-zinc-800"
                  }
                `}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
