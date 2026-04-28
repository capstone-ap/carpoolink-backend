"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, ChevronDown, Users, Radio, Check, AlertCircle } from "lucide-react";

// 데이터 부분 (이전과 동일)
const LIVE_STREAMS = [
  { id: 101, title: "신입 백엔드 포트폴리오 실시간 리뷰 & QnA", mentor: "AI네이티브개발자", category: "개발", viewers: 128, startTime: "2026-04-28T10:30:00Z", tags: ["백엔드", "포트폴리오", "취업"], thumbnailColor: "bg-blue-900", profileColor: "bg-blue-500" },
  { id: 102, title: "실무에서 쓰이는 React 패턴 (주니어용)", mentor: "프론트엔드장인", category: "개발", viewers: 85, startTime: "2026-04-28T11:50:00Z", tags: ["프론트엔드", "React", "실무"], thumbnailColor: "bg-emerald-900", profileColor: "bg-emerald-500" },
  { id: 103, title: "Unreal Engine 5 구조 설계 노하우 방송", mentor: "게임개발자K", category: "개발", viewers: 210, startTime: "2026-04-28T09:00:00Z", tags: ["게임개발", "언리얼"], thumbnailColor: "bg-purple-900", profileColor: "bg-purple-500" },
  { id: 104, title: "주니어 기획자를 위한 역량 강화 가이드", mentor: "기획왕", category: "기획/PM", viewers: 45, startTime: "2026-04-28T11:15:00Z", tags: ["기획", "PM", "커리어"], thumbnailColor: "bg-orange-900", profileColor: "bg-orange-500" }
];

const CATEGORIES = ["전체", "개발", "기획/PM", "디자인", "마케팅"];
const SORT_OPTIONS = [
  { id: "viewers", label: "시청자 많은순" },
  { id: "newest", label: "최신순" },
  { id: "oldest", label: "오래된 순" },
];

function LiveListContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 💡 [해결책 1] 하이드레이션 체크: 클라이언트 마운트 완료 확인
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const activeCategory = searchParams.get("category") || "전체";
  const sortBy = searchParams.get("sort") || "viewers";

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  const handleCategoryClick = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category === "전체") params.delete("category");
    else params.set("category", category);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSortClick = (sortId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sortId === "viewers") params.delete("sort");
    else params.set("sort", sortId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setIsSortMenuOpen(false);
  };

  const filteredAndSortedStreams = useMemo(() => {
    let list = [...LIVE_STREAMS];
    if (activeCategory !== "전체") list = list.filter(s => s.category === activeCategory);
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => s.title.toLowerCase().includes(q) || s.mentor.toLowerCase().includes(q));
    }
    if (sortBy === "viewers") list.sort((a, b) => b.viewers - a.viewers);
    else if (sortBy === "newest") list.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    else if (sortBy === "oldest") list.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    return list;
  }, [activeCategory, searchQuery, sortBy]);

  // 💡 마운트 전에는 레이아웃만 보여주고 클릭 이벤트가 포함된 UI는 마운트 후에 렌더링
  if (!isMounted) return <div className="w-full h-screen bg-white" />;

  return (
    <div className="flex flex-col w-full bg-white text-[#1A1A1A] font-sans min-h-[100dvh] relative">
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
              <button type="button" onClick={() => setIsSearchOpen(true)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                <Search className="w-6 h-6" strokeWidth={2.5} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3 w-full animate-in slide-in-from-right-4 duration-300">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={2.5} />
                <input autoFocus type="text" placeholder="검색어 입력" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-100 py-2.5 pl-10 pr-4 rounded-xl text-[14px] font-medium focus:outline-none" />
              </div>
              <button type="button" onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }} className="text-[14px] font-bold text-gray-500 px-1">취소</button>
            </div>
          )}
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto px-5 py-2 scrollbar-hide">
        {CATEGORIES.map((category) => (
          <button key={category} type="button" onClick={() => handleCategoryClick(category)} className={`shrink-0 px-4 py-2 rounded-full text-[14px] font-bold border transition-all ${activeCategory === category ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'bg-white text-gray-500 border-gray-200'}`}>
            {category}
          </button>
        ))}
      </div>

      <div className="px-5 py-4 flex items-center justify-between relative">
        <button type="button" onClick={() => setIsSortMenuOpen(!isSortMenuOpen)} className="flex items-center gap-1 text-[13px] font-bold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
          {SORT_OPTIONS.find(opt => opt.id === sortBy)?.label}
          <ChevronDown className={`w-4 h-4 transition-transform ${isSortMenuOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isSortMenuOpen && (
          <div className="absolute top-14 left-5 w-[160px] bg-white border border-gray-100 rounded-2xl shadow-xl z-30 p-2">
            {SORT_OPTIONS.map((option) => (
              <button key={option.id} type="button" onClick={() => handleSortClick(option.id)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-bold ${sortBy === option.id ? 'bg-[#FFCC00]/10 text-[#1A1A1A]' : 'text-gray-500 hover:bg-gray-50'}`}>
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
            <Link key={stream.id} href={`/mentoring_list/live_list/${stream.id}`} className="group flex flex-col gap-3">
              <div className={`relative w-full aspect-video rounded-2xl ${stream.thumbnailColor} overflow-hidden`}>
                <div className="absolute top-3 left-3 bg-red-600 text-white text-[11px] font-extrabold px-2 py-1 rounded-[6px] flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                </div>
                <div className="absolute bottom-3 right-3 bg-black/70 text-white text-[12px] font-bold px-2.5 py-1 rounded-[8px] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> {stream.viewers}명 시청 중
                </div>
              </div>
              <div className="flex gap-3 px-1">
                <div className={`w-10 h-10 rounded-full shrink-0 ${stream.profileColor}`} />
                <div className="flex flex-col flex-1 min-w-0 pt-0.5">
                  <h3 className="text-[16px] font-bold text-[#1A1A1A] truncate">{stream.title}</h3>
                  <p className="text-[13px] font-medium text-gray-500">{stream.mentor} · {stream.category}</p>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-10 h-10 text-gray-300 mb-4" />
            <p className="text-gray-400 font-bold text-[15px]">해당하는 라이브가 없습니다.</p>
          </div>
        )}
      </div>

      {isSortMenuOpen && <div className="fixed inset-0 z-20" onClick={() => setIsSortMenuOpen(false)} />}
    </div>
  );
}

export default function LiveListPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // 💡 [해결책 2] 고유한 Key 부여: 경로와 검색 파라미터가 바뀔 때마다 리액트가 컴포넌트를 새로 생성하게 함
  // 뒤로가기 시 캐시된 DOM 대신 리액트가 다시 마운트되면서 이벤트 리스너를 복구합니다.
  const uniqueKey = `${pathname}-${searchParams.toString()}`;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LiveListContent key={uniqueKey} />
    </Suspense>
  );
}