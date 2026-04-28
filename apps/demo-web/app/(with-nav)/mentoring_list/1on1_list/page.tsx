"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, MessageSquare, Calendar as CalendarIcon, X, Send, ChevronLeft, ChevronRight, AlertCircle, Clock } from "lucide-react";

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
  // 💡 시간 선택을 위해 구조 변경: { 날짜: [시간들] }
  availableSlots?: Record<number, string[]>;
  bookedDate?: number | null;
  bookedTime?: string | null;
  messages: Message[];
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
    availableSlots: {
      12: ["10:00", "14:00", "16:00"],
      15: ["11:00", "15:00"],
      18: ["14:00", "19:00"],
      25: ["10:00", "13:00", "17:00"],
    },
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
    bookedDate: 30,
    bookedTime: "15:00",
    availableSlots: {
      10: ["10:00"],
      20: ["14:00", "16:00"],
      30: ["15:00"],
    },
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
    id: 103,
    name: "방황하는감자",
    role: "전공생 · 3학년",
    lastMentoring: "2026. 05. 02",
    status: "예약됨",
    profileColor: "bg-pink-400",
    tags: ["진로 상담"],
    bookedDate: 15,
    bookedTime: "14:00",
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
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // 💡 예약 확정 핸들러
  const handleConfirmReservation = () => {
    if (!selectedDate || !selectedTime || !activeCalendar) return;

    if (userRole === "MENTEE") {
      setMentors(prev => prev.map(mentor => {
        if (mentor.id === activeCalendar.id) {
          return {
            ...mentor,
            status: "예약됨",
            bookedDate: selectedDate,
            bookedTime: selectedTime,
            lastMentoring: `2026. 05. ${String(selectedDate).padStart(2, '0')} (${selectedTime})`
          };
        }
        return mentor;
      }));
    }
    setActiveCalendar(null);
  };

  // 💡 예약 취소 핸들러
  const handleCancelReservation = () => {
    if (!activeCalendar) return;
    if (!confirm("정말 예약을 취소하시겠습니까?")) return;

    if (userRole === "MENTEE") {
      setMentors(prev => prev.map(mentor => {
        if (mentor.id === activeCalendar.id) {
          return {
            ...mentor,
            status: "진행 완료",
            bookedDate: null,
            bookedTime: null,
            lastMentoring: "2026. 04. 25" // 임시 과거 날짜 복구
          };
        }
        return mentor;
      }));
    }
    setActiveCalendar(null);
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeMessage) return;
    const newMessage: Message = {
      id: Date.now(), sender: "me", text: inputText,
      time: new Date().toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })
    };
    const updatedPerson = { ...activeMessage, messages: [...activeMessage.messages, newMessage] };
    setActiveMessage(updatedPerson);
    if (userRole === "MENTEE") setMentors(prev => prev.map(m => m.id === updatedPerson.id ? updatedPerson : m));
    else setMentees(prev => prev.map(m => m.id === updatedPerson.id ? updatedPerson : m));
    setInputText("");
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [activeMessage?.messages]);

  return (
    <main className="flex flex-col w-full bg-white text-[#1A1A1A] font-sans min-h-[100dvh] relative pb-[70px]">
      
      <header className="sticky top-0 bg-white z-20 px-5 py-4 flex items-center justify-between">
        {!isSearchOpen ? (
          <>
            <h1 className="text-[20px] font-extrabold tracking-tight">1:1 멘토링</h1>
            <button onClick={() => setIsSearchOpen(true)} className="p-1 hover:bg-gray-100 rounded-full"><Search className="w-6 h-6" /></button>
          </>
        ) : (
          <div className="flex items-center gap-3 w-full animate-in slide-in-from-right-4 duration-300">
            <input autoFocus type="text" placeholder="검색어 입력" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-gray-100 py-2.5 px-4 rounded-xl text-[14px] outline-none" />
            <button onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }} className="text-[14px] font-bold text-gray-500">취소</button>
          </div>
        )}
      </header>

      <div className="px-5 mb-2 flex bg-gray-100 p-1 rounded-xl mx-5">
        <button onClick={() => setUserRole("MENTEE")} className={`flex-1 py-2 text-[14px] font-bold rounded-lg ${userRole === "MENTEE" ? "bg-white shadow-sm" : "text-gray-500"}`}>나의 멘토</button>
        <button onClick={() => setUserRole("MENTOR")} className={`flex-1 py-2 text-[14px] font-bold rounded-lg ${userRole === "MENTOR" ? "bg-white shadow-sm" : "text-gray-500"}`}>나의 멘티</button>
      </div>

      <div className="flex flex-col px-5 py-4 gap-4">
        {displayList.map((person) => (
          <div key={person.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full ${person.profileColor}`} />
                <div>
                  <h3 className="text-[16px] font-bold">{person.name}</h3>
                  <p className="text-[13px] text-gray-500">{person.role}</p>
                </div>
              </div>
              <span className={`text-[12px] font-bold px-2.5 py-1 rounded-full ${person.status === "예약됨" ? "bg-[#FFCC00]/20 text-yellow-700" : "bg-gray-100 text-gray-600"}`}>{person.status}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl mb-4 text-[13px]">
              <div className="flex gap-2 mb-1"><span className="font-bold text-gray-500 w-14">주제</span><span>{person.tags.join(", ")}</span></div>
              <div className="flex gap-2"><span className="font-bold text-gray-500 w-14">일정</span><span className="font-bold">{person.lastMentoring}</span></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setActiveMessage(person)} className="flex-1 py-2.5 bg-gray-100 rounded-xl font-bold text-[14px]">메시지</button>
              <button onClick={() => { setActiveCalendar(person); setSelectedDate(person.bookedDate || null); setSelectedTime(person.bookedTime || null); }} className="flex-1 py-2.5 bg-[#1A1A1A] text-white rounded-xl font-bold text-[14px]">{userRole === "MENTEE" ? "다시 예약" : "일정 관리"}</button>
            </div>
          </div>
        ))}
      </div>

      {/* 💡 수정된 달력 및 시간 선택 모달창 */}
      {activeCalendar && (
        <div 
          className="fixed inset-0 z-[999] bg-black/60 flex items-end justify-center sm:items-center max-w-md mx-auto animate-in fade-in duration-200"
          onClick={() => setActiveCalendar(null)} // 💡 1. 어두운 배경을 클릭해도 모달이 닫히도록 추가
        >
          <div 
            className="bg-white w-full sm:w-[90%] sm:rounded-3xl rounded-t-3xl p-6 pb-safe animate-in slide-in-from-bottom-10 duration-300 relative"
            onClick={(e) => e.stopPropagation()} // 💡 2. 모달 하얀색 '내부'를 클릭했을 땐 창이 닫히지 않고 정상 작동하도록 이벤트 보호
          >
            
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-[18px] font-extrabold">
                  {userRole === "MENTEE" ? "멘토링 예약하기" : "멘티 일정 확인"}
                </h2>
                <p className="text-[13px] text-gray-500 font-medium mt-1">대상: {activeCalendar.name}</p>
              </div>
              {/* 💡 3. type="button"을 명시하여 브라우저 기본 동작 충돌 방지 */}
              <button 
                type="button" 
                onClick={() => setActiveCalendar(null)} 
                className="p-2 bg-gray-50 rounded-full hover:bg-gray-200 transition-colors z-10 relative"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between mb-4 px-2">
              <button type="button" className="p-1"><ChevronLeft className="w-5 h-5 text-gray-400" /></button>
              <span className="font-bold text-[16px]">2026년 5월</span>
              <button type="button" className="p-1"><ChevronRight className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[12px] font-bold text-gray-400">
              <div className="text-red-400">일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div className="text-blue-400">토</div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {emptyDays.map((_, i) => <div key={`empty-${i}`} className="p-2" />)}
              
              {daysInMonth.map(day => {
                const isMentee = userRole === "MENTEE";
                const isAvailable = isMentee && activeCalendar.availableSlots?.[day];
                const isBooked = !isMentee && activeCalendar.bookedDate === day;
                const isSelected = selectedDate === day;

                // 💡 CSS 충돌(노란 바탕 + 노란 글씨) 방지를 위해 조건별로 클래스를 명확히 분리합니다.
                let buttonClass = "relative p-2.5 text-[14px] font-medium rounded-full transition-all ";
                
                if (isSelected || isBooked) {
                  // 예약된 날짜이거나 현재 선택된 날짜 (노란 바탕 + 진한 검정 글씨)
                  buttonClass += "bg-[#FFCC00] text-[#1A1A1A] font-extrabold shadow-md transform scale-110";
                } else if (isAvailable) {
                  // 예약 가능한 빈 날짜
                  buttonClass += "bg-gray-50 text-[#1A1A1A] border border-gray-200 hover:border-[#FFCC00]";
                } else {
                  // 선택 불가능한 날짜 (회색 글씨)
                  buttonClass += "text-gray-300";
                }

                return (
                  <button 
                    key={day}
                    type="button"
                    disabled={isMentee && !isAvailable}
                    onClick={() => isMentee && isAvailable && setSelectedDate(day)}
                    className={buttonClass}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* 시간 선택 영역 */}
            {selectedDate && (activeCalendar.availableSlots?.[selectedDate] || activeCalendar.bookedDate === selectedDate) && (
              <div className="mb-8 animate-in fade-in slide-in-from-top-2 mt-4">
                <div className="flex items-center gap-1.5 mb-3 text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-[13px] font-bold">시간 선택</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(activeCalendar.availableSlots?.[selectedDate] || (activeCalendar.bookedTime ? [activeCalendar.bookedTime] : [])).map(time => (
                    <button 
                      key={time}
                      type="button"
                      onClick={() => userRole === "MENTEE" && setSelectedTime(time as string)}
                      className={`px-4 py-2 rounded-lg text-[13px] font-bold border transition-all 
                        ${selectedTime === time ? "bg-[#FFCC00] border-[#FFCC00]" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 하단 액션 버튼 */}
            <div className="flex flex-col gap-2 mt-6">
              {userRole === "MENTEE" && activeCalendar.status === "예약됨" && (
                <button 
                  type="button"
                  onClick={handleCancelReservation} 
                  className="w-full py-3 text-red-500 font-bold text-[14px] border border-red-100 rounded-xl mb-2 hover:bg-red-50 transition-colors"
                >
                  예약 취소하기
                </button>
              )}
              {userRole === "MENTEE" ? (
                <button 
                  type="button"
                  disabled={!selectedTime}
                  className={`w-full py-4 rounded-xl font-bold text-[16px] transition-colors ${selectedTime ? 'bg-[#1A1A1A] text-white active:bg-black' : 'bg-gray-100 text-gray-400'}`}
                  onClick={handleConfirmReservation}
                >
                  {selectedTime ? `${selectedDate}일 ${selectedTime} 예약 확정` : '날짜와 시간을 선택해주세요'}
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={() => setActiveCalendar(null)} 
                  className="w-full py-4 bg-[#1A1A1A] text-white rounded-xl font-bold hover:bg-black transition-colors"
                >
                  확인
                </button>
              )}
            </div>

          </div>
        </div>
      )}
      
      {/* 🟢 달력 모달창 (이 부분은 파일에 있는 그대로 두시면 됩니다!) */}
      {activeCalendar && (
        <div className="fixed inset-0 z-[100] ...">
          {/* ... 달력 내용들 ... */}
        </div>
      )}
      
      {/* 🟢 여기서부터 아래 코드를 </main> 바로 위에 추가해 주세요! */}
      {/* 메시지 모달창 */}
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
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-white p-3 border-t flex items-center gap-2 pb-safe">
            <input 
              type="text" 
              placeholder="메시지 보내기..." 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
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

    </main>
  );
}