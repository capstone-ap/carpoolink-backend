"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Terminal, Map } from "lucide-react";

export default function SurveyStep4Page() {
    // 1. 프로그레스 바의 초기 상태를 '이전 단계(25%)'로 설정합니다.
    const [progressWidth, setProgressWidth] = useState("75%");

    // 2. 화면이 켜지자마자 실행되는 애니메이션 로직
    useEffect(() => {
        // 0.05초 뒤에 현재 단계(50%)로 길이를 늘려줍니다. (스르륵 차오르는 효과 발생!)
        const timer = setTimeout(() => {
        setProgressWidth("100%");
        }, 50);
        return () => clearTimeout(timer);
    }, []);

  return (
    <main className="flex flex-col w-full h-full bg-[#F8F9FA] relative font-sans">
      
      {/* 상단 네비게이션 */}
      <header className="w-full bg-white px-4 py-4 flex items-center">
        {/* 이전 단계(step2)로 돌아가기 */}
        <Link href="/survey/step3" className="inline-flex items-center hover:opacity-80 transition-opacity">
          <img src="/icons/arrow.svg" alt="화살표 아이콘" className="w-5 h-5 mr-2 text-[#FFCC00]" />
          <span className="text-[#2F2F2F] font-medium text-lg">이전</span>
        </Link>
      </header>

      {/* 본문 컨텐츠 영역 */}
      <div className="flex flex-col flex-1 px-6 pt-18 pb-8">
        
        {/* 질문 타이틀 */}
        <h1 className="text-2xl sm:text-[28px] font-bold text-[#1A1A1A] text-center mb-10 tracking-tight">
          나의 관심 도메인 및 기술 스택은?
        </h1>

        {/* 선택지 카드 목록 */}
        <div className="flex flex-col gap-5 mb-auto">
          
          {/* 카드 1: 특정 직무/분야 */}
          <Link href="/survey/loading" className="block w-full">
            <button className="w-full bg-white rounded-3xl p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] flex items-start gap-5 border-2 border-transparent hover:border-[#FFCC00] active:scale-[0.98] transition-all text-left">
              <div className="w-16 h-16 rounded-2xl bg-[#2F2F2F] flex items-center justify-center shrink-0">
                <img src="/icons/map_pin.svg" alt="멥핀 아이콘" className="w-8 h-8 text-[#FFCC00]"/>
              </div>
              <div className="flex flex-col pt-1">
                <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">특정 직무/분야</h2>
                <p className="text-[#666666] text-[15px] leading-relaxed break-keep">
                  백엔드, 프론트엔드, 데이터 분석, 기획, 디자인 같은 특정 직무/분야에 대해 알고싶어요.
                </p>
              </div>
            </button>
          </Link>

          {/* 카드 2: 전체 산업군 */}
          <Link href="/survey/loading" className="block w-full">
            <button className="w-full bg-white rounded-3xl p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] flex items-start gap-5 border-2 border-transparent hover:border-[#FFCC00] active:scale-[0.98] transition-all text-left">
              <div className="w-16 h-16 rounded-2xl bg-[#2F2F2F] flex items-center justify-center shrink-0">
                <Map className="w-8 h-8 text-[#FFCC00]" strokeWidth={2} />
              </div>
              <div className="flex flex-col pt-1">
                <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">전체 산업군</h2>
                <p className="text-[#666666] text-[15px] leading-relaxed break-keep">
                  이커머스, 핀테크, AI, 게임 등 관심 있는 영역의 전체 산업에 대해 알고싶어요.
                </p>
              </div>
            </button>
          </Link>

        </div>

        {/* 하단 프로그레스 영역 (4/4 단계 - 가득 참) */}
        <div className="w-full flex flex-col items-center mt-12 pb-4">
          <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden mb-4">
            {/* 기존의 Tailwind w-2/4 대신, style 속성을 사용해 상태값(progressWidth)을 주입합니다. */}
            <div 
              className="h-full bg-[#FFCC00] rounded-full transition-all duration-700 ease-out"
              style={{ width: progressWidth }}
            ></div>
          </div>
          <span className="text-[15px] font-medium text-[#666666]">
            4 / 4
          </span>
        </div>

      </div>
    </main>
  );
}