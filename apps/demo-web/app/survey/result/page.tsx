"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Compass, Search, Zap, Map, ArrowRight } from "lucide-react";

// 💡 API 통신을 위한 apiClient 임포트
import apiClient from "@/lib/apiClient";

export default function SurveyResultPage() {
  const router = useRouter();
  
  // 💡 서버에서 받아온 최종 유형 타이틀을 담을 State
  const [surveyTitle, setSurveyTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // 화면이 켜지자마자 내 정보(/users/me)를 찔러서 설문 결과를 가져옵니다.
  useEffect(() => {
    const fetchMyResult = async () => {
      try {
        const res = await apiClient.get("/users/me");
        // 백엔드 응답에서 surveyResult(유형 이름)를 쏙 빼옵니다.
        const title = res.data.menteeProfile?.surveyResult;
        
        if (title) {
          setSurveyTitle(title);
        } else {
          setSurveyTitle("아직 설문 결과가 없습니다.");
        }
      } catch (error) {
        console.error("설문 결과 로딩 실패:", error);
        setSurveyTitle("결과를 불러올 수 없습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyResult();
  }, []);

  return (
    <main className="flex flex-col w-full h-full bg-[#F8F9FA] relative font-sans">
      
      {/* 상단 네비게이션 */}
      <header className="w-full bg-white px-4 py-4 flex items-center">
        {/* 💡 이전 화면 링크 수정: 
            결과 화면에서 뒤로가기를 누르면 설문지로 돌아가는 것보다 홈으로 가는 것이 자연스럽습니다. */}
        <button onClick={() => router.push("/")} className="inline-flex items-center hover:opacity-80 transition-opacity">
          <ChevronLeft className="w-6 h-6 mr-1 text-[#FFCC00]" />
          <span className="text-[#2F2F2F] font-medium text-lg">홈으로</span>
        </button>
      </header>

      {/* 본문 컨텐츠 영역 */}
      <div className="flex flex-col flex-1 px-6 pt-10 pb-6 overflow-hidden justify-start">
        
        {/* [상단 영역] 심볼 및 타이틀 */}
        <div className="flex flex-col items-center shrink-0 min-h-[140px]">
          <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center shadow-lg mb-4">
            <img src="/icons/compass.svg" alt="나침반 아이콘" className="w-8 h-8 text-[#FFCC00]" />
          </div>
          <span className="text-[14px] font-semibold text-[#666666] mb-1">
            당신의 멘토링 유형은?
          </span>
          
          {/* 💡 API 연동 부위: 서버 데이터를 뿌려줍니다. 로딩 중일 때는 애니메이션 표시 */}
          {isLoading ? (
            <div className="h-10 mt-2 flex items-center justify-center">
              <div className="w-6 h-6 border-4 border-gray-200 border-t-[#FFCC00] rounded-full animate-spin"></div>
            </div>
          ) : (
            <h1 className="text-[32px] font-extrabold text-[#1A1A1A] tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-500">
              {surveyTitle}
            </h1>
          )}
        </div>

        {/* [중단 영역] 2x2 그리드 카드 
            (※ 이 부분의 4가지 텍스트도 완전히 동적으로 만들고 싶다면, 이전 문항 페이지에서 제출 직전 
            답변 내역을 localStorage에 잠깐 저장해두었다가 여기서 꺼내어 뿌려주는 방식을 추천합니다!) */}
        <div className="w-full grid grid-cols-2 gap-3 my-auto shrink-0">
          <div className="bg-white rounded-2xl py-8 flex flex-col items-center justify-center shadow-[0_4px_16px_-8px_rgba(0,0,0,0.08)]">
            <Search className="w-8 h-8 text-[#FFCC00] mb-2" strokeWidth={2} />
            <span className="text-[15px] font-bold text-[#2F2F2F]">직무 탐색형</span>
          </div>
          <div className="bg-white rounded-2xl py-8 flex flex-col items-center justify-center shadow-[0_4px_16px_-8px_rgba(0,0,0,0.08)]">
            <Compass className="w-9 h-9 text-[#FFCC00] mb-2" strokeWidth={2} />
            <span className="text-[15px] font-bold text-[#2F2F2F]">자율 주도형</span>
          </div>
          <div className="bg-white rounded-2xl py-8 flex flex-col items-center justify-center shadow-[0_4px_16px_-8px_rgba(0,0,0,0.08)]">
            <img src="/icons/zap.svg" alt="번개 아이콘" className="w-8 h-8 text-[#FFCC00] mb-2"/>
            <span className="text-[15px] font-bold text-[#2F2F2F]">스파르타형</span>
          </div>
          <div className="bg-white rounded-2xl py-8 flex flex-col items-center justify-center shadow-[0_4px_16px_-8px_rgba(0,0,0,0.08)]">
            <Map className="w-8 h-8 text-[#FFCC00] mb-2" strokeWidth={2} />
            <span className="text-[15px] font-bold text-[#2F2F2F]">전체 산업군</span>
          </div>
        </div>

        {/* [하단 영역] 설명 및 버튼 */}
        <div className="w-full flex flex-col items-center shrink-0">
          <p className="text-[#666666] font-medium text-[14px] text-center leading-relaxed break-keep mb-10">
            당신의 유형을 바탕으로 딱 맞는<br />
            카풀링 멘토링 서비스를 제공할게요.
          </p>
          <Link href="/" className="w-full bg-[#FFCC00] text-[#1A1A1A] font-semibold text-[17px] py-4 rounded-2xl flex items-center justify-center shadow-lg hover:bg-[#E6B800] active:scale-[0.98] transition-all">
            나의 멘토 찾기
            <ArrowRight className="w-5 h-5 ml-2" strokeWidth={2.5} />
          </Link>
        </div>

      </div>
    </main>
  );
}