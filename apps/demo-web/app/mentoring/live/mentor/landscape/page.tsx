"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { PhoneOff, Users, Volume2, Settings, Mic, Video, VideoOff, MessageSquare, Lock } from "lucide-react";

interface Question {
  id: number;
  type: "free" | "paid";
  isPrivate: boolean;
  author: string;
  avatar: string;
  content: string;
}

export default function MentorLandscapeLivePage() {
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isExitPopupOpen, setIsExitPopupOpen] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isReading, setIsReading] = useState(false);
  
  const [currentIdx, setCurrentIdx] = useState(0);

  const questionQueue: Question[] = [
    {
      id: 1, type: "paid", isPrivate: true, author: "김세종", avatar: "👨‍💼",
      content: '"How do you negotiate equity in a Series B startup without losing the offer?"'
    },
    {
      id: 2, type: "free", isPrivate: false, author: "이유진", avatar: "👩‍💼",
      content: '"Can you share some tips on building a tech portfolio from scratch?"'
    },
    {
      id: 3, type: "paid", isPrivate: false, author: "박지민", avatar: "👨‍💻",
      content: '"What are the key metrics to track for early-stage SaaS?"'
    }
  ];

  const chats = [
    { id: 1, author: "Marcus Lee", avatar: "👨‍💼", content: "The lighting in your studio is incredible today!" },
    { id: 2, author: "Elena Rodriguez", avatar: "👩‍💼", content: "Can we get a link to that deck after the session?" },
    { id: 3, author: "David Chen", avatar: "👨‍💻", content: "Loving the insights on brand architecture." },
    { id: 4, author: "Marcus T.", avatar: "👩‍💻", content: "Great insights, Sarah! Looking forward to the demo." },
  ];

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isChatOpen]);

  const handleNextQuestion = () => {
    setCurrentIdx((prev) => (prev + 1) % questionQueue.length);
    setIsReading(false);
  };

  const TopHeader = () => (
    <div className="flex items-center justify-between w-full">
      <button onClick={() => setIsExitPopupOpen(true)} className="inline-flex items-center text-red-500 hover:opacity-80 transition-opacity">
        <PhoneOff className="w-5 h-5 mr-2" strokeWidth={2.5} />
        <span className="font-bold text-[16px] text-white">종료</span>
      </button>
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-[#2A2A2A] px-2.5 py-1 rounded-full shadow-inner">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
          <span className="text-[11px] font-bold text-gray-200 tracking-wider">LIVE</span>
        </div>
        <div className="flex items-center text-gray-400 text-xs font-medium bg-[#1A1A1A] px-2.5 py-1 rounded-full">
          <Users className="w-3.5 h-3.5 mr-1" />
          1,284
        </div>
      </div>
    </div>
  );

  return (
    <main className="flex flex-row w-full h-full bg-[#161616] text-white font-sans overflow-hidden relative">
      
      {/* ==========================================
          [좌측 패널] 질문 관리 대시보드
          ========================================== */}
      <div className={`relative flex flex-col h-full bg-[#1A1A1A] border-r border-gray-800/60 transition-all duration-500 ease-in-out ${isChatOpen ? 'w-[55%]' : 'w-full'}`}>
        
        {/* 채팅창이 닫혔을 때 표시되는 좌측 상단 헤더 */}
        {!isChatOpen && (
          <header className="w-full px-5 py-4 shrink-0 border-b border-gray-800/80 bg-[#161616]">
            <TopHeader />
          </header>
        )}

        {/* 💡 핵심 수정 포인트: h-full을 flex-1 overflow-hidden으로 변경하여 하단바 밀림 방지 */}
        <div className="relative z-10 flex flex-col flex-1 overflow-hidden">
          
          {/* 1. 질문 리스트 영역 */}
          <div className="flex-1 overflow-y-auto px-5 pt-6 pb-2 space-y-4 custom-scrollbar">
            {questionQueue.slice(currentIdx, currentIdx + 2).map((q, idx) => {
              const isActive = idx === 0;
              return (
                <div key={q.id} className={`w-full rounded-[24px] p-5 shadow-2xl transition-all duration-500 flex justify-between gap-4 relative
                  ${q.type === 'paid' ? (isActive ? 'bg-[#FFCC00] text-[#1A1A1A]' : 'bg-[#E6B800] text-[#1A1A1A] opacity-70') : (isActive ? 'bg-white text-[#1A1A1A]' : 'bg-[#F0F0F0] text-[#1A1A1A] opacity-70')}
                  ${!isActive && 'scale-[0.96] origin-top'}
                `}>
                  
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-black/10 rounded-full flex items-center justify-center text-sm">{q.avatar}</div>
                        <span className="font-bold text-[14px]">{q.author}</span>
                      </div>
                      
                      {isActive && q.isPrivate && (
                        <div className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg shadow-sm">
                          <Lock className="w-3 h-3" strokeWidth={2.5} />
                          비공개 질문
                        </div>
                      )}
                    </div>
                    
                    <p className={`font-extrabold text-[15px] leading-snug break-keep ${!isActive && 'line-clamp-2'}`}>
                      {q.content}
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-2 shrink-0 justify-center">
                    <button 
                      onClick={() => isActive && setIsReading(true)}
                      className={`px-3 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center transition-all duration-300
                        ${!isActive ? 'bg-[#1A1A1A]/5 text-black/30 pointer-events-none' : 
                          isReading 
                            ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.6)] ring-2 ring-red-400/50' 
                            : q.type === 'paid' ? 'bg-[#1A1A1A] text-[#FFCC00] hover:bg-black' : 'bg-[#E0E0E0] hover:bg-[#D0D0D0]'
                        }
                      `}
                    >
                      <Volume2 className={`w-3.5 h-3.5 mr-1.5 ${isReading && isActive ? 'animate-pulse' : ''}`} /> 
                      {isReading && isActive ? '읽는 중...' : '질문 읽기'}
                    </button>
                    <button 
                      onClick={isActive ? handleNextQuestion : undefined} 
                      className={`px-3 py-2.5 rounded-xl text-[12px] font-bold transition-colors 
                        ${!isActive ? 'bg-[#1A1A1A]/5 text-black/30 pointer-events-none' : 
                          q.type === 'paid' ? 'bg-[#1A1A1A]/10 hover:bg-[#1A1A1A]/20' : 'bg-[#E0E0E0] hover:bg-[#D0D0D0]'}
                      `}
                    >
                      답변 완료
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-auto shrink-0 flex flex-col">
            {/* 2. 질문 제어 액션 버튼 */}
            <div className="px-5 pb-2 pt-2 flex items-center justify-between gap-2">
              <div className="flex gap-2">
                <button onClick={handleNextQuestion} className="bg-[#FFCC00] text-black hover:bg-[#3A3A3A] text-[12px] font-bold px-4 py-2.5 rounded-full active:scale-95 transition-all shadow-md">다음 질문</button>
                <button onClick={handleNextQuestion} className="bg-[#FFCC00] text-black hover:bg-[#3A3A3A] text-[12px] font-bold px-4 py-2.5 rounded-full active:scale-95 transition-all shadow-md">질문 답변 완료</button>
                <button onClick={() => setIsReading(true)} className="bg-[#FFCC00] text-black hover:bg-[#3A3A3A] text-[12px] font-bold px-4 py-2.5 rounded-full active:scale-95 transition-all shadow-md">질문 다시 읽기</button>
              </div>
              <button className="bg-[#2A2A2A] p-2.5 rounded-full text-white hover:bg-[#3A3A3A] transition-colors shadow-md"><Settings className="w-5 h-5" /></button>
            </div>

            {/* 3. 하단 메인 컨트롤 바 */}
            <div className="w-full bg-[#111111] py-3 px-6 flex justify-around items-center border-t border-gray-800/50">
              <button onClick={() => setIsMicOn(!isMicOn)} className={`p-3 rounded-full transition-all ${!isMicOn ? 'bg-red-500/20 text-red-500' : 'text-white hover:bg-white/5'}`}>
                <Mic className="w-6 h-6" />
              </button>
              <button onClick={() => setIsCamOn(!isCamOn)} className={`p-3.5 rounded-full transition-all ${isCamOn ? 'bg-[#FFCC00] text-[#1A1A1A]' : 'bg-gray-700 text-white'}`}>
                {isCamOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </button>
              <button onClick={() => setIsChatOpen(!isChatOpen)} className={`p-3 rounded-full transition-all ${isChatOpen ? 'text-[#FFCC00] bg-white/5' : 'text-white hover:bg-white/10'}`}>
                <MessageSquare className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          [우측 패널] 헤더 및 채팅 영역
          ========================================== */}
      <div className={`flex flex-col h-full bg-[#222222] transition-all duration-500 ease-in-out ${isChatOpen ? 'w-[45%]' : 'w-0 opacity-0 overflow-hidden'}`}>
        
        <header className="w-full px-5 py-4 flex items-center shrink-0 border-b border-gray-800/80 bg-[#1A1A1A]">
          <TopHeader />
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {chats.map((chat) => (
            <div key={chat.id} className="flex gap-3 animate-in fade-in duration-300">
              <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-[15px]">{chat.avatar}</span>
              </div>
              <div className="flex flex-col items-start w-full">
                <span className="text-[12px] font-medium text-gray-400 mb-1 ml-1">{chat.author}</span>
                <div className="bg-[#303030] text-gray-200 p-3.5 rounded-2xl rounded-tl-sm shadow-sm">
                  <p className="text-[14px] leading-snug break-keep">{chat.content}</p>
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* ==========================================
          종료 확인 팝업 (모달)
          ========================================== */}
      {isExitPopupOpen && (
        <div className="absolute inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#1A1A1A] w-full max-w-[320px] rounded-[28px] p-6 shadow-2xl border border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-center mb-5">
              <div className="bg-red-500/20 p-3 rounded-2xl">
                <PhoneOff className="w-7 h-7 text-red-500" strokeWidth={2.5} />
              </div>
            </div>
            <h3 className="text-lg font-bold text-white text-center mb-2">정말 종료하시겠습니까?</h3>
            <p className="text-gray-400 text-[13px] text-center mb-6 leading-relaxed break-keep">
              지금 종료하시면 라이브 멘토링 세션이 완전히 닫히게 됩니다.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setIsExitPopupOpen(false)} className="flex-1 bg-gray-800 text-white text-[14px] font-bold py-3 rounded-xl hover:bg-gray-700 transition-colors">
                취소
              </button>
              <Link href="/" className="flex-1 bg-red-600 text-white text-[14px] font-bold py-3 rounded-xl hover:bg-red-700 transition-colors text-center">
                종료
              </Link>
            </div>
          </div>
        </div>
      )}
      
    </main>
  );
}