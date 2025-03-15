"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { addMeeting } from "@/lib/firebase/db";
import { Copy, Share2, Check, CalendarIcon } from "lucide-react";
import { toast } from "sonner";

export default function CreatePage() {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOTP, setGeneratedOTP] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // OTP 생성 함수
  const handleGenerateOTP = async () => {
    if (selectedDates.length === 0) {
      toast.error("미팅을 위한 날짜를 하나 이상 선택해주세요.");
      return;
    }

    try {
      setIsGenerating(true);

      // 6자리 OTP 생성 (랜덤 영숫자)
      const otp = Array.from(Array(6), () =>
        Math.floor(Math.random() * 36).toString(36)
      )
        .join("")
        .toUpperCase();

      // Firebase에 미팅 정보 저장
      await addMeeting(otp, selectedDates);

      // OTP 설정
      setGeneratedOTP(otp);
    } catch (error) {
      console.error("OTP 생성 오류:", error);
      toast.error("OTP 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  // 링크 복사 함수
  const copyToClipboard = () => {
    const url = `${window.location.origin}?otp=${generatedOTP}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("링크가 복사되었습니다!");

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="container max-w-md mx-auto p-4 space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-2xl font-bold">미팅 생성</h1>
        <p className="text-zinc-500 text-sm">
          미팅에 사용할 날짜를 선택하고 OTP를 생성하세요
        </p>
      </header>

      {!generatedOTP ? (
        <>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-zinc-500 text-sm">
              <CalendarIcon className="h-4 w-4" />
              <span>날짜 선택</span>
            </div>
            <div className="bg-zinc-900 rounded-lg p-4">
              <Calendar
                mode="multiple"
                selected={selectedDates}
                onSelect={(dates) =>
                  dates ? setSelectedDates(dates) : setSelectedDates([])
                }
                locale={ko}
                className="mx-auto"
                disabled={(date) => date < new Date()}
              />
            </div>

            {selectedDates.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">선택된 날짜:</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedDates.map((date, i) => (
                    <div
                      key={i}
                      className="bg-zinc-900 text-zinc-300 px-3 py-1 rounded-full text-xs"
                    >
                      {format(date, "M월 d일 (E)", { locale: ko })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleGenerateOTP}
            className="w-full bg-lime-500 hover:bg-lime-600 text-black"
            disabled={isGenerating || selectedDates.length === 0}
          >
            {isGenerating ? "생성 중..." : "OTP 생성하기"}
          </Button>
        </>
      ) : (
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <p className="text-sm text-zinc-500">
              미팅 공유용 코드가 생성되었습니다
            </p>
            <div className="bg-zinc-900 rounded-lg p-6 mx-auto">
              <InputOTP maxLength={6} value={generatedOTP} disabled>
                <InputOTPGroup>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              링크 복사
            </Button>

            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center gap-1 h-20"
                onClick={() => {
                  const text = `미팅 초대: ${window.location.origin}?otp=${generatedOTP}`;
                  window.open(
                    `https://api.whatsapp.com/send?text=${encodeURIComponent(
                      text
                    )}`
                  );
                }}
              >
                <div className="bg-green-500 rounded-full p-1.5">
                  <Share2 className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs">WhatsApp</span>
              </Button>

              <Button
                variant="outline"
                className="flex flex-col items-center justify-center gap-1 h-20"
                onClick={() => {
                  const text = `미팅 초대: ${window.location.origin}?otp=${generatedOTP}`;
                  window.open(
                    `https://t.me/share/url?url=${encodeURIComponent(
                      window.location.origin
                    )}&text=${encodeURIComponent(text)}`
                  );
                }}
              >
                <div className="bg-blue-500 rounded-full p-1.5">
                  <Share2 className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs">Telegram</span>
              </Button>

              <Button
                variant="outline"
                className="flex flex-col items-center justify-center gap-1 h-20"
                onClick={() => {
                  const text = `미팅 초대: ${window.location.origin}?otp=${generatedOTP}`;
                  window.open(`sms:?&body=${encodeURIComponent(text)}`);
                }}
              >
                <div className="bg-zinc-500 rounded-full p-1.5">
                  <Share2 className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs">SMS</span>
              </Button>
            </div>
          </div>

          <Button
            onClick={() => {
              setGeneratedOTP(null);
              setSelectedDates([]);
            }}
            variant="ghost"
            className="w-full"
          >
            새 미팅 만들기
          </Button>
        </div>
      )}
    </div>
  );
}
