import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meetion - 모임 시간 수합",
  description: "가장 직관적인 모임 시간 수합 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-zinc-950 text-zinc-200`}
      >
        {/* 전체 레이아웃 컨테이너 - 세로 구분선 적용 */}
        <div className="flex-1 flex flex-col w-full relative">
          {/* 좌우 세로 점선 - 전체 페이지에 적용 */}
          <div className="hidden lg:block absolute top-0 bottom-0 left-0 right-0 mx-auto max-w-7xl border-l border-r border-dashed border-zinc-800 h-full"></div>

          {/* 헤더 */}
          <header className="border-b border-dashed border-zinc-800 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-14 items-center">
                <Link href="/" className="flex items-center">
                  <span className="text-lg font-medium text-white">
                    Meetion
                  </span>
                </Link>
                <nav className="hidden md:flex items-center space-x-6">
                  <Link
                    href="/"
                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    홈
                  </Link>
                  <Link
                    href="/create"
                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    모임 만들기
                  </Link>
                  <Link
                    href="/about"
                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    소개
                  </Link>
                </nav>
                <button className="md:hidden p-2 rounded-md text-zinc-400 hover:text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </header>

          {/* 바디 (메인 콘텐츠) */}
          <main className="flex-1 w-full relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </div>
          </main>

          {/* 푸터 */}
          <footer className="border-t border-dashed border-zinc-800 relative py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="text-xs text-zinc-500">
                  © {new Date().getFullYear()} Meetion
                </div>
                <div className="flex space-x-4 mt-3 md:mt-0">
                  <Link
                    href="/terms"
                    className="text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    이용약관
                  </Link>
                  <Link
                    href="/privacy"
                    className="text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    개인정보처리방침
                  </Link>
                  <Link
                    href="/contact"
                    className="text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    문의하기
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
