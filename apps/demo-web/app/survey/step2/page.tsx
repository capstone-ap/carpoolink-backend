"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, MessageCircleQuestion, Compass } from "lucide-react";

export default function SurveyStep2Page() {
    // 1. 프로그레스 바의 초기 상태를 '이전 단계(25%)'로 설정합니다.
    const [progressWidth, setProgressWidth] = useState("25%");

    // 2. 화면이 켜지자마자 실행되는 애니메이션 로직
    useEffect(() => {
        // 0.05초 뒤에 현재 단계(50%)로 길이를 늘려줍니다. (스르륵 차오르는 효과 발생!)
        const timer = setTimeout(() => {
        setProgressWidth("50%");
        }, 50);
        return () => clearTimeout(timer);
    }, []);

  return (
    <main className="flex flex-col w-full h-full bg-[#F8F9FA] relative font-sans">
      
      {/* 상단 네비게이션 */}
      <header className="w-full bg-white px-4 py-4 flex items-center">
        {/* 이전 단계(step1)로 돌아가기 */}
        <Link href="/survey/step1" className="inline-flex items-center hover:opacity-80 transition-opacity">
          <img src="/icons/arrow.svg" alt="화살표 아이콘" className="w-5 h-5 mr-2 text-[#FFCC00]" />
          <span className="text-[#2F2F2F] font-medium text-lg">이전</span>
        </Link>
      </header>

      {/* 본문 컨텐츠 영역 */}
      <div className="flex flex-col flex-1 px-6 pt-18 pb-8">
        
        {/* 질문 타이틀 */}
        <h1 className="text-2xl sm:text-[28px] font-bold text-[#1A1A1A] text-center mb-10 tracking-tight">
          나의 학습 성향 및 소통 스타일은?
        </h1>

        {/* 선택지 카드 목록 */}
        <div className="flex flex-col gap-5 mb-auto">
            {/* 질문 폭격기형 카드를 눌렀을 때 step3로 이동 */}
            <Link href="/survey/step3" className="block w-full">
                {/* 카드 1: 질문 폭격기형 */}
                <button className="w-full bg-white rounded-3xl p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] flex items-start gap-5 border-2 border-transparent hover:border-[#FFCC00] active:scale-[0.98] transition-all text-left">
                    <div className="w-16 h-16 rounded-2xl bg-[#2F2F2F] flex items-center justify-center shrink-0">
                    <MessageCircleQuestion className="w-8 h-8 text-[#FFCC00]" strokeWidth={2} />
                    </div>
                    <div className="flex flex-col pt-1">
                    <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">질문 폭격기형</h2>
                    <p className="text-[#666666] text-[15px] leading-relaxed break-keep">
                        스스로 공부하다가 막히는 부분을 조목조목 질문하고 답을 얻는 방식을 선호해요.
                    </p>
                    </div>
                </button>
            </Link>

            {/* 자율 주도형 카드를 눌렀을 때 step3로 이동 */}
            <Link href="/survey/step3" className="block w-full">
                {/* 카드 2: 자율 주도형 */}
                <button className="w-full bg-white rounded-3xl p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] flex items-start gap-5 border-2 border-transparent hover:border-[#FFCC00] active:scale-[0.98] transition-all text-left">
                    <div className="w-16 h-16 rounded-2xl bg-[#2F2F2F] flex items-center justify-center shrink-0">
                    <Compass className="w-8 h-8 text-[#FFCC00]" strokeWidth={2} />
                    </div>
                    <div className="flex flex-col pt-1">
                    <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">자율 주도형</h2>
                    <p className="text-[#666666] text-[15px] leading-relaxed break-keep">
                        큰 방향성만 제시해주면 스스로 파고드는 것을 좋아하며, 멘토를 '가이드'로 활용하고 싶어요.
                    </p>
                    </div>
                </button>
            </Link>
        </div>

        {/* 하단 프로그레스 영역 (2/4 단계) */}
        <div className="w-full flex flex-col items-center mt-12 pb-4">
          <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden mb-4">
            {/* 기존의 Tailwind w-2/4 대신, style 속성을 사용해 상태값(progressWidth)을 주입합니다. */}
            <div 
              className="h-full bg-[#FFCC00] rounded-full transition-all duration-700 ease-out"
              style={{ width: progressWidth }}
            ></div>
          </div>
          <span className="text-[15px] font-medium text-[#666666]">
            2 / 4
          </span>
        </div>

      </div>
    </main>
  );
}