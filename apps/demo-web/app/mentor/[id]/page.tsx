"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, MoreVertical, HelpCircle } from "lucide-react";

export default function MentorDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  // 스크린샷 기반 목업 데이터
  const mentorData = {
    title: "IT 백엔드 개발 및 프로젝트 경험",
    name: "AI네이티브개발자",
    count: "카풀링 3회",
    infoTags: ["카풀링", "백엔드 개발자", "2년차", "남성", "직장인"],
    fieldTags: ["커리어", "보상"],
    detailTags: ["Javascript", "Typescript", "AWS", "Serverless", "Jira", "Slack", "PM", "IT"],
    intro: "IT 백엔드 개발자 2년차입니다. 서버 아키텍처 설계, 금융 도메인, AI Native 등 다양한 개발 관련 대한 실무 경험을 쌓고 있습니다.\n\n백엔드 개발 입문자, 신입 개발자 희망자분들께 도움을 드릴 수 있습니다. 기술 면접 준비, 포트폴리오 피드백, 실무 개발 패턴, 커리어 고민 등을 함께 이야기할 수 있습니다.\n\n얼마 전까지 초보였기에 여러분의 어려움을 잘 이해합니다. 어려운 용어보다 쉽고 친절한 설명을 지향하며, 어떤 질문도 환영합니다. 함께 성장하겠습니다!",
    locationTags: ["봉천동", "사당동"],
    price: "20,000원 / 1시간"
  };

  return (
    // PC 화면에서도 모바일 앱처럼 보이도록 max-w-md mx-auto 적용
    <main className="w-full max-w-md mx-auto h-[100dvh] bg-white relative shadow-sm flex flex-col font-sans">
      
      {/* 1. 상단 고정 헤더 */}
      <header className="flex items-center justify-between px-2 py-3 bg-white sticky top-0 z-20">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
          <img src="/icons/arrow.svg" className="w-5 h-5 text-[#1A1A1A]" />
        </button>
        <button className="p-2 hover:bg-gray-50 rounded-full transition-colors">
          <MoreVertical className="w-5 h-5 text-[#1A1A1A]" strokeWidth={2.5} />
        </button>
      </header>

      {/* 2. 스크롤 가능한 본문 영역 */}
      <div className="flex-1 overflow-y-auto px-5 pb-[100px] custom-scrollbar">
        
        {/* 타이틀 */}
        <h1 className="text-[22px] font-bold text-[#1A1A1A] leading-snug mt-2 mb-8 tracking-tight">
          {mentorData.title}
        </h1>

        {/* 프로필 요약 */}
        <div className="flex items-center gap-4 mb-10">
          {/* 프로필 이미지 (임시 회색 박스) */}
          <div className="w-[72px] h-[72px] bg-gray-200 rounded-[20px] shrink-0" />
          <div className="flex flex-col gap-1.5">
            <h2 className="text-[18px] font-bold text-[#1A1A1A]">{mentorData.name}</h2>
            <span className="inline-block bg-[#F2F4F6] text-gray-600 text-[12px] font-medium px-2.5 py-1 rounded-[6px] w-fit">
              {mentorData.count}
            </span>
          </div>
        </div>

        {/* 섹션: 멘토 정보 */}
        <section className="mb-10">
          <h3 className="text-[15px] font-bold text-[#1A1A1A] mb-4">멘토 정보</h3>
          <div className="flex flex-wrap gap-2">
            {mentorData.infoTags.map((tag, idx) => (
              <span key={idx} className="bg-[#F8F9FA] text-[#333333] text-[14px] px-3.5 py-1.5 rounded-full border border-gray-100">
                {tag}
              </span>
            ))}
          </div>
        </section>

        {/* 섹션: 멘토링 분야 */}
        <section className="mb-10">
          <div className="flex items-center gap-1 mb-4">
            <h3 className="text-[15px] font-bold text-[#1A1A1A]">멘토링 분야</h3>
            <HelpCircle className="w-4 h-4 text-gray-400" strokeWidth={2} />
          </div>
          <div className="flex flex-wrap gap-2">
            {mentorData.fieldTags.map((tag, idx) => (
              <span key={idx} className="bg-[#F8F9FA] text-[#333333] text-[14px] px-3.5 py-1.5 rounded-full border border-gray-100">
                {tag}
              </span>
            ))}
          </div>
        </section>

        {/* 섹션: 멘토링 세부 분야 */}
        <section className="mb-10">
          <h3 className="text-[15px] font-bold text-[#1A1A1A] mb-4">멘토링 세부 분야</h3>
          <div className="flex flex-wrap gap-2">
            {mentorData.detailTags.map((tag, idx) => (
              <span key={idx} className="bg-[#F8F9FA] text-[#333333] text-[14px] px-3.5 py-1.5 rounded-full border border-gray-100">
                {tag}
              </span>
            ))}
          </div>
        </section>

        {/* 섹션: 멘토링 소개 */}
        <section className="mb-10">
          <h3 className="text-[15px] font-bold text-[#1A1A1A] mb-4">멘토링 소개</h3>
          <p className="text-[15px] text-[#333333] leading-[1.7] whitespace-pre-wrap tracking-tight">
            {mentorData.intro}
          </p>
        </section>

        {/* 섹션: 멘토링 가능 지역 */}
        <section className="mb-10">
          <h3 className="text-[15px] font-bold text-[#1A1A1A] mb-4">멘토링 가능 지역</h3>
          <div className="flex flex-wrap gap-2">
            {mentorData.locationTags.map((tag, idx) => (
              <span key={idx} className="bg-[#F8F9FA] text-[#333333] text-[14px] px-3.5 py-1.5 rounded-full border border-gray-100">
                {tag}
              </span>
            ))}
          </div>
        </section>

        {/* 섹션: 멘토링 비용 */}
        <section className="mb-4">
          <h3 className="text-[15px] font-bold text-[#1A1A1A] mb-4">멘토링 비용</h3>
          <div className="bg-[#F8F9FA] rounded-2xl p-5 flex items-center">
            <span className="text-[16px] font-bold text-[#1A1A1A]">{mentorData.price}</span>
          </div>
        </section>

      </div>

      {/* 3. 하단 고정 버튼 영역 */}
      <div className="absolute bottom-0 left-0 w-full bg-white px-5 py-3 pb-safe z-50">
        <button className="w-full bg-[#111116] text-[white] font-bold text-[16px] py-4 rounded-xl hover:bg-black transition-colors active:scale-[0.98]">
          사전상담하기
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </main>
  );
}