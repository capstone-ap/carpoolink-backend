"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Users, Send, Sparkles, Star, X, ChevronUp, ChevronDown } from "lucide-react";

interface ChatMessage {
  id: number;
  type: "free" | "paid";
  author: string;
  avatar: string;
  content: string;
}

export default function LandscapeLiveMentoringPage() {
  const [isPaidMode, setIsPaidMode] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isAiOpen, setIsAiOpen] = useState(false);

  const [chats, setChats] = useState<ChatMessage[]>([
    { id: 1, type: "free", author: "Marcus Lee", avatar: "👨‍💼", content: "The lighting in your studio is incredible today!" },
    { id: 2, type: "free", author: "Elena Rodriguez", avatar: "👩‍💼", content: "Can we get a link to that deck after the session?" },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  const addNewChat = (type: "free" | "paid", text: string) => {
    const newChat: ChatMessage = {
      id: Date.now(),
      type: type,
      author: "나 (멘티)",
      avatar: "👤",
      content: text,
    };
    setChats((prev) => [...prev, newChat]);
  };

  const handleSend = () => {
    if (!chatInput.trim()) return;
    if (isPaidMode) {
      setIsPopupOpen(true);
    } else {
      addNewChat("free", chatInput);
      setChatInput("");
    }
  };

  const confirmPaidQuestion = () => {
    setIsPopupOpen(false);
    addNewChat("paid", chatInput);
    setChatInput("");
    setIsPaidMode(false);
  };

  const handleSuggestionClick = (question: string) => {
    const cleanText = question.replace(/^\d+\.\s*/, ''); 
    setChatInput(cleanText);
    setIsAiOpen(false);
  };

  return (
    <main className="flex flex-row w-full h-full bg-[#161616] text-white font-sans overflow-hidden">
      
      {/* ==========================================
          [좌측 패널] 비디오 및 컨트롤 (p-6 -> p-4로 여백 축소)
          ========================================== */}
      <div className="flex flex-col w-1/2 h-full p-4 border-r border-gray-800/60 relative z-10">
        
        {/* 상단 네비게이션 (mb-5 -> mb-3) */}
        <header className="flex items-center justify-between shrink-0 mb-3 pl-1">
          <Link href="/" className="inline-flex items-center hover:opacity-80 transition-opacity">
            <img src="/icons/arrow.svg" alt="화살표 아이콘" className="w-4 h-4 mr-2 text-[#FFCC00]" />
            <span className="font-bold text-[16px]">나가기</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#2A2A2A] px-2.5 py-1 rounded-full shadow-inner">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-[11px] font-bold text-gray-200 tracking-wider">LIVE</span>
            </div>
            <div className="flex items-center text-gray-400 text-xs font-medium pr-1">
              <Users className="w-3.5 h-3.5 mr-1" />
              1,284
            </div>
          </div>
        </header>

        {/* 라이브 비디오 영역 */}
        <div className="flex-1 w-full bg-gray-800 rounded-2xl relative overflow-hidden shadow-xl">
          <img 
            src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1200&auto=format&fit=crop" 
            alt="Live Stream" 
            className="absolute inset-0 w-full h-full object-cover opacity-85"
          />
          <div className="absolute top-4 inset-x-0 flex justify-center">
            <div className="bg-red-600/90 backdrop-blur-sm text-white text-[11px] font-bold px-4 py-1.5 rounded-full shadow-lg">
              비공개 질문 답변중
            </div>
          </div>
        </div>

        {/* 모드 전환 버튼 (mt-6 -> mt-3, py-4 -> py-3) */}
        <div className="shrink-0 mt-3">
          {isPaidMode ? (
            <button 
              onClick={() => setIsPaidMode(false)}
              className="w-full bg-white text-[#1A1A1A] font-bold text-[15px] py-3 rounded-xl shadow-lg active:scale-[0.98] transition-all"
            >
              무료 채팅으로 돌아가기
            </button>
          ) : (
            <button 
              onClick={() => setIsPaidMode(true)}
              className="w-full bg-[#FFCC00] text-[#1A1A1A] font-bold text-[15px] py-3 rounded-xl shadow-[0_8px_24px_-4px_rgba(255,204,0,0.4)] active:scale-[0.98] transition-all flex items-center justify-center"
            >
              <Star className="w-4 h-4 mr-2" fill="currentColor" />
              유료 질문하기
            </button>
          )}
        </div>
      </div>

      {/* ==========================================
          [우측 패널] 채팅창 및 입력 영역 (p-6 -> p-4)
          ========================================== */}
      <div className="flex flex-col w-1/2 h-full relative">
        
        {/* 채팅 내역 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar z-10">
          {chats.map((chat) => (
            <div key={chat.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-[15px]">{chat.avatar}</span>
              </div>
              <div className="flex flex-col items-start w-full max-w-[85%]">
                <div className="flex items-center gap-2 mb-1 ml-1">
                  <span className="text-[12px] font-medium text-gray-400">{chat.author}</span>
                  {chat.type === 'paid' && (
                    <span className="bg-[#FFCC00] text-[#1A1A1A] text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wide">
                      유료
                    </span>
                  )}
                </div>
                <div className={`p-3 rounded-2xl rounded-tl-sm shadow-sm ${chat.type === 'paid' ? 'bg-[#3A331A] border border-[#FFCC00]/30 text-[#FFCC00]' : 'bg-[#2A2A2A] text-gray-200'}`}>
                  <p className="text-[14px] leading-snug break-keep">
                    {chat.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 하단 입력 영역 */}
        <div className="shrink-0 p-4 pt-1 relative">
          
          {isPaidMode && (
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#FFCC00]/20 to-transparent pointer-events-none z-0 transition-all duration-500"></div>
          )}

          <div className="relative z-10 flex flex-col items-end">
            
            {/* AI 질문 추천 토글 버튼 */}
            <button
              onClick={() => setIsAiOpen(!isAiOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 mb-2 bg-[#2A2A2A] border border-gray-700/50 rounded-full shadow-md hover:bg-[#333333] transition-colors active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FFCC00]" />
              <span className="text-[12px] font-medium text-gray-300">
                {isAiOpen ? "AI 추천 닫기" : "AI 질문 추천"}
              </span>
              {isAiOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
              )}
            </button>

            {/* AI 질문 추천 박스 (아코디언 애니메이션) */}
            <div 
              className={`w-full bg-[#2A2A2A] border border-gray-700/50 rounded-2xl shadow-lg transition-all duration-300 ease-in-out overflow-hidden flex flex-col
                ${isAiOpen ? "max-h-48 opacity-100 p-3 mb-3" : "max-h-0 opacity-0 p-0 m-0 border-transparent"}
              `}
            >
              <ul className="space-y-2">
                {[
                  "1. How can I improve my technical skills?",
                  "2. What should I focus on for my career?",
                  "3. Do you have any feedback on my project?"
                ].map((item, idx) => (
                  <li 
                    key={idx}
                    onClick={() => handleSuggestionClick(item)}
                    className="text-[13px] text-gray-300 hover:text-white cursor-pointer transition-colors p-2 rounded-xl hover:bg-gray-700/40 active:bg-gray-700/60"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* 입력창 (py-4 -> py-3) */}
            <div className="relative flex items-center w-full shadow-lg">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Share your thoughts..."
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="w-full bg-[#222222] text-white border border-gray-800 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:border-[#FFCC00]/50 placeholder-gray-500 text-[14px]"
              />
              <button 
                onClick={handleSend}
                className="absolute right-2 p-2 text-[#FFCC00] hover:bg-[#FFCC00]/10 rounded-lg transition-colors active:scale-90"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 팝업 모달 */}
      {isPopupOpen && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-6 backdrop-blur-sm transition-opacity">
          <div className="bg-[#1A1A1A] w-full max-w-[320px] rounded-3xl p-5 shadow-2xl border border-gray-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-3">
              <div className="bg-[#FFCC00]/20 p-2.5 rounded-2xl">
                <Star className="w-5 h-5 text-[#FFCC00]" fill="currentColor" />
              </div>
              <button onClick={() => setIsPopupOpen(false)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <h3 className="text-lg font-bold text-white mb-1.5">유료 질문을 전송할까요?</h3>
            <p className="text-gray-400 text-[13px] mb-5 leading-relaxed break-keep">
              보유하신 <strong className="text-[#FFCC00]">질문권 1개</strong>가 차감되며, 멘토에게 최우선으로 질문이 전달됩니다.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setIsPopupOpen(false)} className="flex-1 bg-gray-800 text-white text-[14px] font-bold py-3 rounded-xl hover:bg-gray-700 transition-colors">취소</button>
              <button onClick={confirmPaidQuestion} className="flex-1 bg-[#FFCC00] text-[#1A1A1A] text-[14px] font-bold py-3 rounded-xl hover:bg-[#E6B800] transition-colors">보내기</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}