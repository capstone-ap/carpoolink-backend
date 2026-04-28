"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, MessageSquare, Calendar as CalendarIcon, X, Send, ChevronLeft, ChevronRight } from "lucide-react";

// 💡 1. 메시지 타입을 정의하고 MentoringPerson에 추가합니다.
type Message = {
  id: number;
  sender: "me" | "other";
  text: string;
  time: string;
};

type MentoringPerson = {
  id: number;
  name: string;
  role: string;
  lastMentoring: string;
  status: string;
  profileColor: string;
  tags: string[];
  availableDates?: number[];
  bookedDate?: number | null;
  messages: Message[]; // 모든 사람에게 메시지 배열 추가
};

const INITIAL_MENTORS: MentoringPerson[] = [
  {
    id: 1,
    name: "AI네이티브개발자",
    role: "백엔드 개발자 · 2년차",
    lastMentoring: "2026. 04. 25",
    status: "진행 완료",
    profileColor: "bg-blue-500",
    tags: ["포트폴리오", "기술면접"],
    availableDates: [12, 15, 18, 25],
    messages: [
      { id: 1, sender: "me", text: "안녕하세요! 멘토링 관련해서 궁금한 점이 있습니다.", time: "오후 2:30" },
      { id: 2, sender: "other", text: "네, 편하게 말씀해 주세요! 😊", time: "오후 2:32" }
    ],
  },
  {
    id: 2,
    name: "프론트엔드장인",
    role: "프론트엔드 개발자 · 5년차",
    lastMentoring: "2026. 04. 30",
    status: "예약됨",
    profileColor: "bg-emerald-500",
    tags: ["React", "성능최적화"],
    availableDates: [10, 11, 20, 22],
    messages: [],
  }
];

const INITIAL_MENTEES: MentoringPerson[] = [
  {
    id: 101,
    name: "열혈취준생",
    role: "백엔드 지망생",
    lastMentoring: "2026. 04. 20",
    status: "진행 완료",
    profileColor: "bg-orange-400",
    tags: ["이력서 첨삭", "CS 기초"],
    bookedDate: null, 
    messages: [],
  },
  {
    id: 102,
    name: "코딩하는토끼",
    role: "주니어 개발자 · 1년차",
    lastMentoring: "2026. 04. 18",
    status: "진행 완료",
    profileColor: "bg-purple-400",
    tags: ["코드 리뷰", "아키텍처"],
    bookedDate: null,
    messages: [],
  },
  {
    id: 103,
    name: "방황하는감자",
    role: "전공생 · 3학년",
    lastMentoring: "2026. 05. 02",
    status: "예약됨",
    profileColor: "bg-pink-400",
    tags: ["진로 상담"],
    bookedDate: 15,
    messages: [],
  }
];

export default function OneOnOneListPage() {
  const [mentors, setMentors] = useState<MentoringPerson[]>(INITIAL_MENTORS);
  const [mentees, setMentees] = useState<MentoringPerson[]>(INITIAL_MENTEES);

  const [userRole, setUserRole] = useState<"MENTEE" | "MENTOR">("MENTEE");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [activeMessage, setActiveMessage] = useState<MentoringPerson | null>(null);
  const [activeCalendar, setActiveCalendar] = useState<MentoringPerson | null>(null);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  // 💡 2. 채팅 입력창 상태 추가
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null); // 자동 스크롤을 위한 참조

  const displayList = useMemo(() => {
    let list = userRole === "MENTEE" ? mentors : mentees;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      list = list.filter(person => 
        person.name.toLowerCase().includes(q) || 
        person.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }
    return list;
  }, [userRole, searchQuery, mentors, mentees]);

  const emptyDays = Array.from({ length: 5 });
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleConfirmReservation = () => {
    if (!selectedDate || !activeCalendar) return;

    if (userRole === "MENTEE") {
      setMentors(prev => prev.map(mentor => {
        if (mentor.id === activeCalendar.id) {
          return {
            ...mentor,
            status: "예약됨",
            lastMentoring: `2026. 05. ${String(selectedDate).padStart(2, '0')}`
          };
        }
        return mentor;
      }));
    }

    alert(`${selectedDate}일로 예약이 완료되었습니다!`);
    setActiveCalendar(null); 
  };

  // 💡 3. 메시지 전송 로직
  const handleSendMessage = () => {
    if (!inputText.trim() || !activeMessage) return;

    const newMessage: Message = {
      id: Date.now(),
      sender: "me",
      text: inputText,
      time: new Date().toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' }) // 예: 오후 3:45
    };

    // 현재 열려있는 모달창의 데이터 즉시 업데이트
    const updatedPerson = { 
      ...activeMessage, 
      messages: [...activeMessage.messages, newMessage] 
    };
    setActiveMessage(updatedPerson);

    // 전체 리스트(배열) 상태도 업데이트하여 껐다 켜도 유지되게 함
    if (userRole === "MENTEE") {
      setMentors(prev => prev.map(m => m.id === updatedPerson.id ? updatedPerson : m));
    } else {
      setMentees(prev => prev.map(m => m.id === updatedPerson.id ? updatedPerson : m));
    }

    setInputText(""); // 입력창 초기화
  };

  // 새로운 메시지가 추가될 때마다 스크롤을 맨 아래로 내리기
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessage?.messages]);

  return (
    <main className="flex flex-col w-full bg-white text-[#1A1A1A] font-sans min-h-[100dvh] relative pb-[70px]">
      
      <header className="sticky top-0 bg-white z-20">
        <div className="flex items-center justify-between px-5 py-4">
          {!isSearchOpen ? (
            <>
              <h1 className="text-[20px] font-extrabold tracking-tight">1:1 멘토링</h1>
              <button onClick={() => setIsSearchOpen(true)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
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
                  placeholder="이름 또는 태그 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-100 py-2.5 pl-10 pr-4 rounded-xl text-[14px] font-medium focus:outline-none"
                />
              </div>
              <button 
                onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }} 
                className="text-[14px] font-bold text-gray-500 px-1"
              >
                취소
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="px-5 mb-2">
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => { setUserRole("MENTEE"); setSearchQuery(""); }}
            className={`flex-1 py-2 text-[14px] font-bold rounded-lg transition-all ${userRole === "MENTEE" ? "bg-white text-[#1A1A1A] shadow-sm" : "text-gray-500"}`}
          >
            나의 멘토
          </button>
          <button 
            onClick={() => { setUserRole("MENTOR"); setSearchQuery(""); }}
            className={`flex-1 py-2 text-[14px] font-bold rounded-lg transition-all ${userRole === "MENTOR" ? "bg-white text-[#1A1A1A] shadow-sm" : "text-gray-500"}`}
          >
            나의 멘티
          </button>
        </div>
      </div>

      <div className="flex flex-col px-5 py-4 gap-4">
        {displayList.length > 0 ? (
          displayList.map((person) => (
            <div key={person.id} className="flex flex-col bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${person.profileColor} border border-gray-100 shrink-0`} />
                  <div>
                    <h3 className="text-[16px] font-bold text-[#1A1A1A]">{person.name}</h3>
                    <p className="text-[13px] text-gray-500 font-medium">{person.role}</p>
                  </div>
                </div>
                <span className={`text-[12px] font-bold px-2.5 py-1 rounded-full ${person.status === "예약됨" ? "bg-[#FFCC00]/20 text-yellow-700" : "bg-gray-100 text-gray-600"}`}>
                  {person.status}
                </span>
              </div>

              <div className="flex flex-col gap-2 mb-4 bg-gray-50 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold text-gray-500 w-14 shrink-0">멘토링 주제</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {person.tags.map((tag, idx) => (
                      <span key={idx} className="text-[12px] font-bold text-[#1A1A1A] bg-white px-1.5 py-0.5 rounded border border-gray-200">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold text-gray-500 w-14 shrink-0">
                    {person.status === "예약됨" ? "예약 일정" : "최근 진행"}
                  </span>
                  <span className="text-[13px] font-medium text-[#1A1A1A]">{person.lastMentoring}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setActiveMessage(person)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-[#1A1A1A] text-[14px] font-bold transition-colors"
                >
                  <MessageSquare className="w-4 h-4" /> 메시지
                </button>
                <button 
                  onClick={() => {
                    setActiveCalendar(person);
                    setSelectedDate(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#1A1A1A] hover:bg-black rounded-xl text-white text-[14px] font-bold transition-colors"
                >
                  <CalendarIcon className="w-4 h-4" /> {userRole === "MENTEE" ? "다시 예약" : "일정 관리"}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <p className="text-gray-400 font-bold text-[15px]">검색 결과가 없습니다.</p>
          </div>
        )}
      </div>

      {/* 💡 업데이트된 메시지 모달창 */}
      {activeMessage && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-gray-100 max-w-md mx-auto animate-in slide-in-from-bottom-full duration-300">
          <div className="bg-white px-4 py-3 flex items-center justify-between border-b shadow-sm">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full ${activeMessage.profileColor}`} />
              <span className="font-bold text-[16px]">{activeMessage.name}</span>
            </div>
            <button onClick={() => setActiveMessage(null)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4">
            <div className="text-center text-xs text-gray-400 my-2">2026년 4월 20일</div>
            
            {/* 메시지 리스트 렌더링 */}
            {activeMessage.messages.length > 0 ? (
              activeMessage.messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col w-3/4 ${msg.sender === "me" ? "self-end items-end" : "self-start items-start"}`}>
                  <div className={`p-3 text-[14px] shadow-sm ${
                    msg.sender === "me" 
                      ? "bg-[#FFCC00] rounded-2xl rounded-tr-none text-[#1A1A1A]" 
                      : "bg-white border border-gray-100 rounded-2xl rounded-tl-none text-[#1A1A1A]"
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.time}</span>
                </div>
              ))
            ) : (
              <div className="text-center text-[13px] text-gray-400 mt-10">
                아직 나눈 대화가 없습니다. <br/>인사를 건네보세요!
              </div>
            )}
            {/* 스크롤 하단 자동 이동을 위한 투명 요소 */}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-white p-3 border-t flex items-center gap-2 pb-safe">
            <input 
              type="text" 
              placeholder="메시지 보내기..." 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} // 엔터키로도 전송
              className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#FFCC00]/50" 
            />
            <button 
              onClick={handleSendMessage}
              className="w-10 h-10 bg-[#1A1A1A] rounded-full flex items-center justify-center text-[#FFCC00] shrink-0 hover:bg-black transition-colors"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>
      )}

      {/* 달력 모달창 (기존과 동일) */}
      {activeCalendar && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center sm:items-center max-w-md mx-auto animate-in fade-in duration-200">
          <div className="bg-white w-full sm:w-[90%] sm:rounded-3xl rounded-t-3xl p-6 pb-safe animate-in slide-in-from-bottom-10 duration-300">
            
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-[18px] font-extrabold">
                  {userRole === "MENTEE" ? "멘토링 예약하기" : "멘티 일정 확인"}
                </h2>
                <p className="text-[13px] text-gray-500 font-medium mt-1">대상: {activeCalendar.name}</p>
              </div>
              <button onClick={() => setActiveCalendar(null)} className="p-2 bg-gray-50 rounded-full"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex items-center justify-between mb-4 px-2">
              <button className="p-1"><ChevronLeft className="w-5 h-5 text-gray-400" /></button>
              <span className="font-bold text-[16px]">2026년 5월</span>
              <button className="p-1"><ChevronRight className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[12px] font-bold text-gray-400">
              <div className="text-red-400">일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div className="text-blue-400">토</div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {emptyDays.map((_, i) => <div key={`empty-${i}`} className="p-2" />)}
              
              {daysInMonth.map(day => {
                const isMentee = userRole === "MENTEE";
                const isAvailable = isMentee && activeCalendar.availableDates?.includes(day);
                const isBooked = !isMentee && activeCalendar.bookedDate === day;
                const isSelected = selectedDate === day;

                return (
                  <button 
                    key={day}
                    disabled={isMentee && !isAvailable}
                    onClick={() => isMentee && isAvailable && setSelectedDate(day)}
                    className={`
                      relative p-2.5 text-[14px] font-medium rounded-full transition-all
                      ${isBooked ? 'bg-[#1A1A1A] text-[#FFCC00] font-extrabold shadow-md' : ''} 
                      ${isSelected ? 'bg-[#FFCC00] text-[#1A1A1A] font-extrabold shadow-md transform scale-110' : ''}
                      ${isAvailable && !isSelected ? 'bg-gray-50 text-[#1A1A1A] border border-gray-200 hover:border-[#FFCC00]' : ''}
                      ${!isAvailable && !isBooked && !isSelected ? 'text-gray-300' : ''}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              {userRole === "MENTEE" ? (
                <>
                  <div className="flex items-center gap-2 text-[12px] font-medium text-gray-500 mb-4 justify-center">
                    <div className="w-3 h-3 bg-gray-50 border border-gray-200 rounded-full" /> 예약 가능
                    <div className="w-3 h-3 bg-[#FFCC00] rounded-full ml-2" /> 선택됨
                  </div>
                  <button 
                    disabled={!selectedDate}
                    className={`w-full py-4 rounded-xl font-bold text-[16px] transition-colors ${selectedDate ? 'bg-[#1A1A1A] text-white active:bg-black' : 'bg-gray-100 text-gray-400'}`}
                    onClick={handleConfirmReservation}
                  >
                    {selectedDate ? `${selectedDate}일 예약 확정하기` : '날짜를 선택해주세요'}
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-[12px] font-medium text-gray-500 justify-center">
                    <div className="w-3 h-3 bg-[#1A1A1A] rounded-full" /> 멘티가 예약한 날짜
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      )}

    </main>
  );
}