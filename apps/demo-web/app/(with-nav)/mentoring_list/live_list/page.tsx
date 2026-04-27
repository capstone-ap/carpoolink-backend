"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronDown, Users, Radio, Check, AlertCircle } from "lucide-react";

// 💡 핵심 수정: Date.now() 같은 동적 함수를 제거하고, 고정된 시간 문자열을 사용하여 
// Next.js의 Hydration(렌더링 동기화) 에러와 클릭 이벤트 먹통 현상을 완벽하게 방지했습니다.
const LIVE_STREAMS = [
  {
    id: 101,
    title: "신입 백엔드 포트폴리오 실시간 리뷰 & QnA",
    mentor: "AI네이티브개발자",
    category: "개발",
    viewers: 128,
    startTime: "2026-04-28T10:30:00Z", // 고정된 시간
    tags: ["백엔드", "포트폴리오", "취업"],
    thumbnailColor: "bg-blue-900",
    profileColor: "bg-blue-500",
  },
  {
    id: 102,
    title: "실무에서 쓰이는 React 패턴 (주니어용)",
    mentor: "프론트엔드장인",
    category: "개발",
    viewers: 85,
    startTime: "2026-04-28T11:50:00Z", 
    tags: ["프론트엔드", "React", "실무"],
    thumbnailColor: "bg-emerald-900",
    profileColor: "bg-emerald-500",
  },
  {
    id: 103,
    title: "Unreal Engine 5 구조 설계 노하우 방송",
    mentor: "게임개발자K",
    category: "개발",
    viewers: 210,
    startTime: "2026-04-28T09:00:00Z",
    tags: ["게임개발", "언리얼"],
    thumbnailColor: "bg-purple-900",
    profileColor: "bg-purple-500",
  },
  {
    id: 104,
    title: "주니어 기획자를 위한 역량 강화 가이드",
    mentor: "기획왕",
    category: "기획/PM",
    viewers: 45,
    startTime: "2026-04-28T11:15:00Z",
    tags: ["기획", "PM", "커리어"],
    thumbnailColor: "bg-orange-900",
    profileColor: "bg-orange-500",
  }
];

const CATEGORIES = ["전체", "개발", "기획/PM", "디자인", "마케팅"];
const SORT_OPTIONS = [
  { id: "viewers", label: "시청자 많은순" },
  { id: "newest", label: "최신순" },
  { id: "oldest", label: "오래된 순" },
];

export default function LiveListPage() {
  const [sortBy, setSortBy] = useState("viewers");
  const [activeCategory, setActiveCategory] = useState("전체");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  const filteredAndSortedStreams = useMemo(() => {
    let list = [...LIVE_STREAMS];

    if (activeCategory !== "전체") {
      list = list.filter(stream => stream.category === activeCategory);
    }

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      list = list.filter(stream => 
        stream.title.toLowerCase().includes(query) || 
        stream.mentor.toLowerCase().includes(query)
      );
    }

    if (sortBy === "viewers") list.sort((a, b) => b.viewers - a.viewers);
    else if (sortBy === "newest") list.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    else if (sortBy === "oldest") list.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return list;
  }, [activeCategory, searchQuery, sortBy]);

  return (
    <main className="flex flex-col w-full bg-white text-[#1A1A1A] font-sans min-h-[100dvh] relative">
      
      <header className={`sticky top-0 bg-white z-20 transition-all duration-300 ${isSearchOpen ? 'pb-2' : ''}`}>
        <div className="flex items-center justify-between px-5 py-4">
          {!isSearchOpen ? (
            <>
              <h1 className="text-[20px] font-extrabold tracking-tight flex items-center gap-2">
                1:N 라이브 멘토링
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </h1>
              <button 
                type="button"
                onClick={() => setIsSearchOpen(true)} 
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Search className="w-6 h-6" strokeWidth={2.5} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3 w-full animate-in slide-in-from-right-4 duration-300">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={2.5} />
                <input 
                  autoFocus
                  type="text"
                  placeholder="멘토 또는 라이브 제목 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-100 py-2.5 pl-10 pr-4 rounded-xl text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-[#FFCC00]/50"
                />
              </div>
              <button 
                type="button"
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery("");
                }} 
                className="text-[14px] font-bold text-gray-500 px-1"
              >
                취소
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto px-5 py-2 scrollbar-hide">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button" // 💡 명시적으로 버튼 타입을 지정하여 폼 전송 등 오작동 방지
            onClick={() => setActiveCategory(category)}
            className={`shrink-0 px-4 py-2 rounded-full text-[14px] font-bold border transition-all
              ${activeCategory === category 
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' 
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }
            `}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="px-5 py-4 flex items-center justify-between relative">
        <button 
          type="button"
          onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
          className="flex items-center gap-1 text-[13px] font-bold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg active:bg-gray-100 transition-colors"
        >
          {SORT_OPTIONS.find(opt => opt.id === sortBy)?.label}
          <ChevronDown className={`w-4 h-4 transition-transform ${isSortMenuOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isSortMenuOpen && (
          <div className="absolute top-14 left-5 w-[160px] bg-white border border-gray-100 rounded-2xl shadow-xl z-30 p-2 animate-in fade-in zoom-in-95 duration-150">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setSortBy(option.id);
                  setIsSortMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-bold transition-colors
                  ${sortBy === option.id ? 'bg-[#FFCC00]/10 text-[#1A1A1A]' : 'text-gray-500 hover:bg-gray-50'}
                `}
              >
                {option.label}
                {sortBy === option.id && <Check className="w-4 h-4 text-[#FFCC00]" />}
              </button>
            ))}
          </div>
        )}
        <span className="text-[12px] font-bold text-gray-400">결과 {filteredAndSortedStreams.length}개</span>
      </div>

      <div className="flex flex-col px-5 gap-6 pb-10 flex-1">
        {filteredAndSortedStreams.length > 0 ? (
          filteredAndSortedStreams.map((stream) => (
            <Link 
              key={stream.id} 
              href={`/mentoring_list/live_list/${stream.id}`} 
              className="group flex flex-col gap-3"
            >
              <div className={`relative w-full aspect-video rounded-2xl ${stream.thumbnailColor} overflow-hidden shadow-sm`}>
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                  <Radio className="w-16 h-16 text-white" />
                </div>
                <div className="absolute top-3 left-3 bg-red-600 text-white text-[11px] font-extrabold px-2 py-1 rounded-[6px] flex items-center gap-1 tracking-wider">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                </div>
                <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-[12px] font-bold px-2.5 py-1 rounded-[8px] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> {stream.viewers}명 시청 중
                </div>
              </div>

              <div className="flex gap-3 px-1">
                <div className={`w-10 h-10 rounded-full shrink-0 ${stream.profileColor} border border-gray-100 shadow-sm`} />
                <div className="flex flex-col flex-1 min-w-0 pt-0.5">
                  <h3 className="text-[16px] font-bold text-[#1A1A1A] leading-tight mb-1 truncate group-hover:text-blue-600 transition-colors">
                    {stream.title}
                  </h3>
                  <p className="text-[13px] font-medium text-gray-500 mb-2">
                    {stream.mentor} · {stream.category}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {stream.tags.map((tag, idx) => (
                      <span key={idx} className="bg-[#F2F4F6] text-gray-600 text-[11px] font-bold px-2 py-0.5 rounded-[4px]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
            <div className="bg-gray-50 p-6 rounded-full mb-4">
              <AlertCircle className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-400 font-bold text-[15px] mb-1">해당하는 라이브가 없습니다.</p>
            <p className="text-gray-300 text-[13px]">다른 카테고리나 검색어를 이용해 보세요.</p>
            {(activeCategory !== "전체" || searchQuery !== "") && (
              <button 
                type="button"
                onClick={() => {
                  setActiveCategory("전체");
                  setSearchQuery("");
                }}
                className="mt-6 text-[#FFCC00] font-bold text-[14px] border-b border-[#FFCC00] pb-0.5"
              >
                필터 초기화
              </button>
            )}
          </div>
        )}
      </div>

      {isSortMenuOpen && <div className="fixed inset-0 z-20" onClick={() => setIsSortMenuOpen(false)} />}

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </main>
  );
}