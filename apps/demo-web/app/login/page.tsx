"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!userId.trim()) {
      setErrorMsg("아이디를 입력해주세요.");
      return;
    }

    setIsLoading(true);

    // 💡 [Mock Data] 백엔드 API 연동 전 테스트를 위한 가상 분기 처리 로직
    setTimeout(() => {
      // 1. 사전설문 데이터가 없는 멘티인 경우 -> 사전설문 페이지로 이동
      if (userId === "mentee_new") {
        router.push("/survey");
      } 
      // 2. 그 외 (멘토이거나 사전설문 데이터가 있는 멘티) -> 홈(멘토 목록) 화면으로 이동
      else if (userId === "mentor1" || userId === "mentee_old") {
        router.push("/");
      } 
      // 3. 등록되지 않은 테스트 아이디
      else {
        setErrorMsg("존재하지 않는 아이디입니다. (테스트: mentee_new, mentee_old, mentor1)");
        setIsLoading(false);
      }
    }, 600); // 실제 API 통신처럼 살짝 딜레이를 줍니다.
  };

  return (
    <main className="flex flex-col items-center justify-center w-full h-[100dvh] bg-[#F8F9FA] px-6 font-sans">
      
      {/* 💡 화면 중앙 로그인 컨테이너 */}
      <div className="w-full max-w-[340px] bg-white p-8 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.05)] flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* 서비스 로고/브랜딩 영역 */}
        <div className="w-16 h-16 bg-[#FFCC00] rounded-2xl flex items-center justify-center mb-6 shadow-inner">
          <img src="/icons/User.svg" alt="사용자 아이콘" className="w-9 h-9 text-[#1A1A1A]" />
        </div>
        
        <h1 className="text-[27px] font-extrabold text-[#1A1A1A] tracking-tight text-center mb-2">
          카풀링 방문을 환영합니다
        </h1>
        <p className="text-[13px] text-gray-500 font-medium mb-8 text-center break-keep">
          로그인 후 멘토링 서비스를 시작해 보세요.
        </p>

        {/* 로그인 폼 */}
        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
          <div className="relative w-full">
            <input
              type="text"
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                setErrorMsg("");
              }}
              placeholder="아이디를 입력하세요"
              disabled={isLoading}
              className={`w-full bg-[#F2F4F6] text-[#1A1A1A] font-medium text-[15px] py-4 px-5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FFCC00]/50 transition-all placeholder:text-gray-400
                ${errorMsg ? 'ring-2 ring-red-400/50 bg-red-50' : ''}
              `}
            />
          </div>

          {/* 에러 메시지 출력 영역 */}
          {errorMsg && (
            <p className="text-red-500 text-[12px] font-bold px-1 animate-in fade-in">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#1A1A1A] text-[#FFCC00] font-extrabold text-[16px] py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-black transition-colors active:scale-[0.98] mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-[#FFCC00] rounded-full animate-spin" />
            ) : (
              <>로그인 <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </form>

      </div>

      {/* 테스트용 안내 뱃지 (나중에 백엔드 붙일 때 삭제하시면 됩니다) */}
      <div className="mt-8 flex gap-2">
        <button onClick={() => setUserId('mentee_new')} className="text-[11px] font-bold bg-white border border-gray-200 text-gray-500 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors">
          테스트: 신규 멘티
        </button>
        <button onClick={() => setUserId('mentee_old')} className="text-[11px] font-bold bg-white border border-gray-200 text-gray-500 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors">
          테스트: 기존 멘티
        </button>
        <button onClick={() => setUserId('mentor1')} className="text-[11px] font-bold bg-white border border-gray-200 text-gray-500 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors">
          테스트: 멘토
        </button>
      </div>

    </main>
  );
}