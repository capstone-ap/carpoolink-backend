import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Carpoolink Online",
  description: "멘토링 서비스 플랫폼 카풀링 온라인 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      {/* 1. 배경 설정 */}
        <body className="bg-[#111111] flex justify-center items-center min-h-screen antialiased overflow-hidden">
          
          {/* 2. min-h-screen 대신 h-[100dvh]를 사용하여 높이를 브라우저 화면에 완벽히 고정합니다. */}
          <div className="w-[430px] h-[100dvh] bg-[#F8F9FA] relative shadow-2xl overflow-hidden flex flex-col">
            {children}
          </div>
          
        </body>
    </html>
  );
  // return (
  //   <html
  //     lang="en"
  //     className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
  //   >
  //     <body className="min-h-full flex flex-col">{children}</body>
  //   </html>
  // );
}
