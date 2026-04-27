"use client";

import { useState } from "react";
// 💡 Link 컴포넌트를 불러옵니다.
import Link from "next/link"; 
import { Search, ChevronDown, Star } from "lucide-react";

// 스크린샷 기반 목업 데이터
const MOCK_MENTORS = [
  {
    id: 1,
    isSuper: true,
    tags: ["커리어 / 보상", "카풀링 3회"],
    rating: null,
    title: "IT 백엔드 개발 및 프로젝트 경험",
    price: "20,000원 / 60분",
    career: "백엔드 개발자 2년차",
    location: "봉천동 · 사당동",
    bgColor: "bg-gray-200" 
  },
  {
    id: 2,
    isSuper: true,
    tags: ["업무 / 커리어", "카풀링 9회"],
    rating: "5.0점",
    title: "증권사 빅데이터 직무 / 실무와 취업 이야기",
    price: "30,000원 / 60분",
    career: "금융 빅데이터 10년차",
    location: "신공덕동 · 여의도동 · 군자동",
    bgColor: "bg-gray-300" 
  },
  {
    id: 3,
    isSuper: false,
    tags: ["업계 / 업무"],
    rating: null,
    title: "개발자 취업 및 커리어 상담",
    price: "30,000원 / 60분",
    career: "백엔드 개발자 9년차",
    location: "정자동 · 판교동",
    bgColor: "bg-black" 
  }
];

const CATEGORIES = ["전체", "업무", "일상", "보상", "성장", "커리어", "업계"];

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState("전체");

  return (
    <main className="flex flex-col w-full bg-white text-[#1A1A1A] font-sans">
      
      <header className="flex items-center justify-between px-5 py-4 sticky top-0 bg-white z-20">
        <button className="flex items-center gap-1 text-[20px] font-extrabold tracking-tight">
          전체 지역 <ChevronDown className="w-5 h-5 mt-0.5" strokeWidth={2.5} />
        </button>
        <button className="p-1">
          <Search className="w-6 h-6" strokeWidth={2.5} />
        </button>
      </header>

      <div className="flex gap-2 overflow-x-auto px-5 py-2 scrollbar-hide">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`shrink-0 px-4 py-2 rounded-full text-[14px] font-bold border transition-colors
              ${activeCategory === category 
                ? 'bg-[#2B2F3A] text-white border-[#2B2F3A]' 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }
            `}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="px-5 py-4 flex">
        <button className="flex items-center gap-1 text-[13px] font-medium text-gray-500">
          최신순 <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* 4. 멘토 리스트 */}
      <div className="flex flex-col">
        {MOCK_MENTORS.map((mentor) => (
          // 💡 핵심 변경점: div 태그를 Link 태그로 바꾸고, href 속성으로 멘토의 id를 주소에 넘겨줍니다!
          // 누를 때 살짝 회색 배경이 되도록 hover:bg-gray-50 도 추가했습니다.
          <Link 
            key={mentor.id} 
            href={`/mentor/${mentor.id}`}
            className="flex gap-4 px-5 py-6 border-b border-gray-100/60 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
          >
            <div className="relative shrink-0">
              <div className={`w-[92px] h-[92px] rounded-2xl ${mentor.bgColor} flex items-center justify-center overflow-hidden`}>
                {mentor.id === 3 && (
                  <div className="text-[#FFCC00] font-extrabold text-sm flex flex-col items-center">
                    <span>멘토</span>
                    <span className="text-white text-[10px] mt-1">—O—O—</span>
                  </div>
                )}
              </div>
              
              {mentor.isSuper && (
                <div className="absolute -top-1.5 -left-1.5 bg-[#FFCC00] text-[#1A1A1A] text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-sm z-10 tracking-tight">
                  슈퍼멘토
                </div>
              )}
            </div>

            <div className="flex flex-col flex-1 min-w-0 pt-0.5">
              
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {mentor.tags.map((tag, idx) => (
                  <span key={idx} className="bg-[#F2F4F6] text-gray-600 text-[11px] font-bold px-2 py-1 rounded-[4px]">
                    {tag}
                  </span>
                ))}
                {mentor.rating && (
                  <span className="bg-[#FFF9E6] text-[#1A1A1A] text-[11px] font-extrabold px-2 py-1 rounded-[4px] flex items-center gap-0.5">
                    <Star className="w-3 h-3 text-[#FFCC00] fill-current" /> {mentor.rating}
                  </span>
                )}
              </div>

              <h3 className="text-[16px] font-bold text-[#1A1A1A] leading-snug mb-1 truncate">
                {mentor.title}
              </h3>
              <p className="text-[15px] font-extrabold text-[#1A1A1A] mb-2.5">
                {mentor.price}
              </p>

              <div className="flex flex-col gap-0.5 text-[12.5px]">
                <div className="flex gap-2">
                  <span className="font-bold text-gray-500">직군 경력</span>
                  <span className="text-gray-400">{mentor.career}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-gray-500">가능 지역</span>
                  <span className="text-gray-400">{mentor.location}</span>
                </div>
              </div>
              
            </div>
          </Link>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </main>
  );
}