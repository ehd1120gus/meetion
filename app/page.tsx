"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function HomePage() {
  const [otp, setOtp] = useState("");
  const router = useRouter();

  const handleSubmit = () => {
    if (otp.length < 6) {
      toast.error("6자리 코드를 모두 입력해주세요");
      return;
    }

    router.push(`/engage/${otp}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-4xl font-bold">Meetion</h1>
        <p className="text-zinc-500">미팅 OTP 코드를 입력해주세요</p>

        <div className="bg-zinc-900 rounded-lg p-6 mx-auto my-8">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            containerClassName="justify-center"
          >
            <InputOTPGroup>
              {Array.from({ length: 6 }).map((_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full bg-lime-500 hover:bg-lime-600 text-black"
        >
          참여하기
        </Button>

        <div className="mt-8">
          <a
            href="/create"
            className="text-zinc-400 hover:text-zinc-300 text-sm underline"
          >
            새 미팅 만들기
          </a>
        </div>
      </div>
    </div>
  );
}
