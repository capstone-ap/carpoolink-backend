import Link from "next/link";
import { ChevronLeft, Compass, Search, PersonStanding, Zap, Map, ArrowRight, Globe } from "lucide-react";

export default function SurveyResultPage() {
  // 💡 향후 개발 팁: 
  // 실제 연동 시에는 상태 관리 도구(Zustand)에 저장된 사용자의 1~4번 응답을 조합하여
  // 16개의 결과 객체(Title, Icon, Description 등) 중 하나를 불러와 렌더링하게 됩니다.
  
  return (
    <main className="flex flex-col min-h-screen bg-[#F8F9FA] mx-auto max-w-md relative font-sans">
      
      {/* 상단 네비게이션 */}
      <header className="w-full bg-white px-4 py-4 flex items-center">
        {/* 이전 단계로 돌아가기 (선택지를 다시 고르고 싶을 때) */}
        <Link href="/survey/step4" className="inline-flex items-center hover:opacity-80 transition-opacity">
          <img src="/icons/arrow.svg" alt="화살표 아이콘" className="w-5 h-5 mr-2 text-[#FFCC00]"/>
          <span className="text-[#2F2F2F] font-medium text-lg">이전</span>
        </Link>
      </header>

      {/* 본문 컨텐츠 영역 */}
      <div className="flex flex-col flex-1 px-6 pt-10 pb-8 items-center">
        
        {/* 최상단 메인 심볼 (검은 원 안의 노란색 나침반) */}
        <div className="w-24 h-24 bg-[#1A1A1A] rounded-full flex items-center justify-center shadow-lg mb-6">
          <img src="/icons/compass.svg" alt="창의적인 모험가" className="w-12 h-12 text-[#FFCC00]" />
        </div>

        {/* 결과 타이틀 */}
        <span className="text-[15px] font-semibold text-[#666666] mb-2">
          당신의 멘토링 유형은?
        </span>
        <h1 className="text-4xl font-extrabold text-[#1A1A1A] tracking-tight mb-10">
          창의적인 모험가
        </h1>

        {/* 선택한 4가지 특성을 보여주는 2x2 그리드 */}
        <div className="w-full grid grid-cols-2 gap-4 mb-10">
          
          {/* 특성 1 */}
          <div className="bg-white rounded-[24px] p-6 flex flex-col items-center justify-center shadow-[0_4px_20px_-10px_rgba(0,0,0,0.06)] aspect-square">
            <Search className="w-9 h-9 text-[#FFCC00] mb-3" strokeWidth={2} />
            <span className="text-[15px] font-bold text-[#2F2F2F]">직무 탐색형</span>
          </div>

          {/* 특성 2 */}
          <div className="bg-white rounded-[24px] p-6 flex flex-col items-center justify-center shadow-[0_4px_20px_-10px_rgba(0,0,0,0.06)] aspect-square">
            <Compass className="w-10 h-10 text-[#FFCC00] mb-3" strokeWidth={2} />
            <span className="text-[15px] font-bold text-[#2F2F2F]">자율 주도형</span>
          </div>

          {/* 특성 3 */}
          <div className="bg-white rounded-[24px] p-6 flex flex-col items-center justify-center shadow-[0_4px_20px_-10px_rgba(0,0,0,0.06)] aspect-square">
            <img src="/icons/zap.svg" className="w-9 h-9 text-[#FFCC00] mb-3" />
            <span className="text-[15px] font-bold text-[#2F2F2F]">스파르타형</span>
          </div>

          {/* 특성 4 */}
          <div className="bg-white rounded-[24px] p-6 flex flex-col items-center justify-center shadow-[0_4px_20px_-10px_rgba(0,0,0,0.06)] aspect-square">
            <Globe className="w-9 h-9 text-[#FFCC00] mb-3" strokeWidth={2} />
            <span className="text-[15px] font-bold text-[#2F2F2F]">전체 산업군</span>
          </div>

        </div>

        {/* 하단 설명 텍스트 (버튼 위로 밀어내기 위해 mt-auto 사용) */}
        <div className="mt-auto text-center mb-6">
          <p className="text-[#666666] text-[15px] leading-relaxed break-keep">
            당신의 유형을 바탕으로 딱 맞는<br />
            카풀링 멘토링 서비스를 제공할게요.
          </p>
        </div>

        {/* 멘토 찾기(메인으로 이동) 버튼 */}
        <Link href="/" className="w-full bg-[#FFCC00] text-[#1A1A1A] font-semibold text-lg py-4 rounded-2xl flex items-center justify-center shadow-lg hover:bg-[#E6B800] active:scale-[0.98] transition-all">
          나의 멘토 찾기
          <ArrowRight className="w-5 h-5 ml-2" strokeWidth={2.5} />
        </Link>

      </div>
    </main>
  );
}