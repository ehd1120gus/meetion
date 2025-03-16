import React from "react";
import { TimeSlot } from "./types";
import TimeSlotItem from "./TimeSlotItem";

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

const TimeColumn: React.FC<TimeColumnProps> = ({
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
}) => (
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

export default TimeColumn;
