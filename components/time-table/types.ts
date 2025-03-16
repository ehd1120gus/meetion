export type TimeSlot = {
  id: string;
  time: string; // 예: "09:00"
  display: string; // 예: "오전 9:00"
  isSelected: boolean;
  isAvailable?: boolean;
};

export interface TimeTableProps {
  meetingId?: string; // Firebase ID
  dateId?: string; // 선택된 날짜 ID
}

export type SelectionMode = "select" | "deselect" | null;
export type DragDirection = "up" | "down" | null;
