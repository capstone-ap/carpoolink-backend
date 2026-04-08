"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Briefcase, Search } from "lucide-react";

export default function SurveyStep1Page() {
    // 1. 프로그레스 바의 초기 상태를 '이전 단계(25%)'로 설정합니다.
    const [progressWidth, setProgressWidth] = useState("4%");

    // 2. 화면이 켜지자마자 실행되는 애니메이션 로직
    useEffect(() => {
        // 0.05초 뒤에 현재 단계(50%)로 길이를 늘려줍니다. (스르륵 차오르는 효과 발생!)
        const timer = setTimeout(() => {
        setProgressWidth("25%");
        }, 50);
        return () => clearTimeout(timer);
    }, []);

  return (
    <main className="flex flex-col min-h-screen bg-[#F8F9FA] mx-auto max-w-md relative font-sans">
      
      {/* 상단 네비게이션 */}
      <header className="w-full bg-white px-4 py-4 flex items-center">
        {/* 이전 화면(/survey)으로 돌아가는 링크 */}
        <Link href="/survey" className="inline-flex items-center hover:opacity-80 transition-opacity">
          <img src="/icons/arrow.svg" alt="화살표 아이콘" className="w-5 h-5 mr-2 text-[#FFCC00]" />
          <span className="text-[#2F2F2F] font-medium text-lg">이전</span>
        </Link>
      </header>

      {/* 본문 컨텐츠 영역 */}
      <div className="flex flex-col flex-1 px-6 pt-12 pb-8">
        
        {/* 질문 타이틀 */}
        <h1 className="text-2xl sm:text-[28px] font-bold text-[#1A1A1A] text-center mb-10 tracking-tight">
          나의 목적 및 성장 단계는?
        </h1>

        {/* 선택지 카드 목록 */}
        <div className="flex flex-col gap-5 mb-auto">
            {/* 취업 준비형 카드를 눌렀을 때 step2로 이동 */}
            <Link href="/survey/step2" className="block w-full">
                {/* 카드 1: 취업 준비형 */}
                <button className="w-full bg-white rounded-3xl p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] flex items-start gap-5 border-2 border-transparent hover:border-[#FFCC00] active:scale-[0.98] transition-all text-left">
                    {/* 아이콘 박스 */}
                    <div className="w-16 h-16 rounded-2xl bg-[#2F2F2F] flex items-center justify-center shrink-0">
                    <Briefcase className="w-8 h-8 text-[#FFCC00]" strokeWidth={2} />
                    </div>
                    {/* 텍스트 영역 */}
                    <div className="flex flex-col pt-1">
                    <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">취업 준비형</h2>
                    <p className="text-[#666666] text-[15px] leading-relaxed break-keep">
                        당장 포트폴리오 완성,<br />
                        면접 대비, 직무 역량 강화가<br />
                        시급해요.
                    </p>
                    </div>
                </button>
            </Link>

            {/* 직무 탐색형 카드를 눌렀을 때 step2로 이동 */}
            <Link href="/survey/step2" className="block w-full">
                {/* 카드 2: 직무 탐색형 */}
                <button className="w-full bg-white rounded-3xl p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] flex items-start gap-5 border-2 border-transparent hover:border-[#FFCC00] active:scale-[0.98] transition-all text-left">
                    {/* 아이콘 박스 */}
                    <div className="w-16 h-16 rounded-2xl bg-[#2F2F2F] flex items-center justify-center shrink-0">
                    <Search className="w-8 h-8 text-[#FFCC00]" strokeWidth={2} />
                    </div>
                    {/* 텍스트 영역 */}
                    <div className="flex flex-col pt-1">
                    <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">직무 탐색형</h2>
                    <p className="text-[#666666] text-[15px] leading-relaxed break-keep">
                        해당 분야의 생생한<br />
                        현업 이야기를 듣거나,<br />
                        같은 고민을 하는 사람들과<br />
                        교류하고 싶어요.
                    </p>
                    </div>
                </button>
            </Link>
        </div>

        {/* 하단 프로그레스 영역 (1/4 단계) */}
        <div className="w-full flex flex-col items-center mt-12 pb-4">
          <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden mb-4">
            {/* 기존의 Tailwind w-2/4 대신, style 속성을 사용해 상태값(progressWidth)을 주입합니다. */}
            <div 
              className="h-full bg-[#FFCC00] rounded-full transition-all duration-700 ease-out"
              style={{ width: progressWidth }}
            ></div>
          </div>
          <span className="text-[15px] font-medium text-[#666666]">
            1 / 4
          </span>
        </div>

      </div>
    </main>
  );
}