import {
  collection,
  getDocs,
  setDoc,
  doc,
  Timestamp,
  query,
  where,
} from "firebase/firestore";
import { db } from "./config";
import { format, parse, isValid } from "date-fns";
import { ko } from "date-fns/locale";

// 선택 가능한 날짜 가져오기
export async function getAvailableDates(meetingId: string) {
  try {
    const datesRef = collection(db, "meetings", meetingId, "available_dates");
    const snapshot = await getDocs(datesRef);

    const dates = snapshot.docs.map((doc) => {
      const data = doc.data();

      // Firestore Timestamp를 Date 객체로 변환
      const date = data.date?.toDate();

      return {
        id: doc.id,
        date: date,
        formattedDate: isValid(date)
          ? format(date, "yyyy-MM-dd", { locale: ko })
          : "",
        displayDate: isValid(date)
          ? format(date, "M월 d일 (E)", { locale: ko })
          : "",
        isAvailable: data.isAvailable ?? true,
      };
    });

    // 날짜순으로 정렬
    return dates.sort((a, b) => a.date - b.date);
  } catch (error) {
    console.error("Error fetching available dates:", error);
    return [];
  }
}

// 해당 날짜의 가능한 시간대 가져오기
export async function getAvailableTimes(meetingId: string, dateId: string) {
  try {
    const timesRef = collection(
      db,
      "meetings",
      meetingId,
      "available_dates",
      dateId,
      "times"
    );
    const snapshot = await getDocs(timesRef);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        time: data.time || "",
        isSelected: data.isSelected || false,
        isAvailable: data.isAvailable !== false, // 기본값은 true
      };
    });
  } catch (error) {
    console.error("Error fetching available times:", error);
    return [];
  }
}

// 새 미팅 추가 함수
export async function addMeeting(meetingId: string, dates: Date[]) {
  try {
    // 미팅 문서 생성
    await setDoc(doc(db, "meetings", meetingId), {
      createdAt: Timestamp.now(),
      status: "active",
    });

    // 선택된 날짜들 추가
    for (const date of dates) {
      const dateId = date.toISOString().split("T")[0]; // YYYY-MM-DD 형식

      await setDoc(doc(db, "meetings", meetingId, "available_dates", dateId), {
        date: Timestamp.fromDate(date),
        isAvailable: true,
      });
    }

    return meetingId;
  } catch (error) {
    console.error("미팅 생성 오류:", error);
    throw error;
  }
}
