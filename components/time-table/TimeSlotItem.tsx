import React from "react";
import { TimeSlot } from "./types";

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

const TimeSlotItem: React.FC<TimeSlotItemProps> = ({
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
}) => (
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

export default TimeSlotItem;
