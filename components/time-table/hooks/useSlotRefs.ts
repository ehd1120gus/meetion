import { useRef, useCallback, useEffect } from "react";
import { TimeSlot } from "../types";

export function useSlotRefs(timeSlots: TimeSlot[]) {
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  return { slotRefs, setSlotRef };
}
