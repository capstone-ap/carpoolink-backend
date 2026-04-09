import Link from "next/link";
import { ChevronLeft, Compass, Search, PersonStanding, Zap, Map, ArrowRight } from "lucide-react";

export default function SurveyResultPage() {
  return (
    // layout.tsx에서 이미 크기를 잡았으므로, 여기서는 w-full h-full로 부모 틀에 꽉 채웁니다.
    <main className="flex flex-col w-full h-full bg-[#F8F9FA] relative font-sans">
      
      {/* 상단 네비게이션 (높이 고정: shrink-0) */}
      <header className="w-full bg-white px-4 py-4 flex items-center shrink-0">
        <Link href="/survey/step4" className="inline-flex items-center hover:opacity-80 transition-opacity">
          <img src="/icons/arrow.svg" alt="화살표 아이콘" className="w-5 h-5 mr-2 text-[#FFCC00]" />
          <span className="text-[#2F2F2F] font-medium text-[16px]">이전</span>
        </Link>
      </header>

      {/* 본문 컨텐츠 영역: justify-between으로 위, 중간, 아래를 화면에 맞게 쫙 펼쳐줍니다. */}
      <div className="flex flex-col flex-1 px-6 pt-10 pb-6 overflow-hidden justify-start">
        
        {/* [상단 영역] 심볼 및 타이틀 */}
        <div className="flex flex-col items-center shrink-0">
          <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center shadow-lg mb-4">
            <img src="/icons/compass.svg" alt="나침반 아이콘" className="w-8 h-8 text-[#FFCC00]" />
          </div>
          <span className="text-[14px] font-semibold text-[#666666] mb-1">
            당신의 멘토링 유형은?
          </span>
          <h1 className="text-[32px] font-extrabold text-[#1A1A1A] tracking-tight">
            창의적인 모험가
          </h1>
        </div>

        {/* [중단 영역] 2x2 그리드 카드 (세로 길이를 줄이고 반응형으로 설정) */}
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