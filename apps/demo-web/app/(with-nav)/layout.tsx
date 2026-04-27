import Link from "next/link";
// 💡 새로운 항목에 어울리는 아이콘들로 변경했습니다.
import { Home, Users, UserCircle, User } from "lucide-react";

export default function WithNavLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col w-full h-[100dvh] bg-white overflow-hidden relative font-sans">
      
      {/* 본문 영역 */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>

      {/* 하단 네비게이션 바 */}
      {/* 항목이 5개에서 4개로 줄었기 때문에, 각 버튼이 차지하는 너비가 자연스럽게 넓어졌습니다. */}
      <nav className="w-full shrink-0 bg-white border-t border-gray-100 flex justify-between px-2 pt-2 pb-safe text-gray-400 z-50">
        
        <Link href="/" className="flex flex-col items-center justify-center p-2 flex-1 text-[#1A1A1A]">
          <Home className="w-6 h-6 mb-1" strokeWidth={2.5} />
          <span className="text-[11px] font-bold tracking-tight">홈</span>
        </Link>

        {/* 1:N 멘토링 (다수 인원 느낌의 Users 아이콘 사용) */}
        <Link href="/mentoring_list/live_list" className="flex flex-col items-center justify-center p-2 flex-1 hover:text-gray-900 transition-colors">
          <Users className="w-6 h-6 mb-1" strokeWidth={2} />
          <span className="text-[11px] font-bold tracking-tight whitespace-nowrap">1:N 멘토링</span>
        </Link>

        {/* 1:1 멘토링 (개인 대 개인 느낌의 UserCircle 아이콘 사용) */}
        <Link href="/mentoring_list/1on1_list" className="flex flex-col items-center justify-center p-2 flex-1 hover:text-gray-900 transition-colors">
          <UserCircle className="w-6 h-6 mb-1" strokeWidth={2} />
          <span className="text-[11px] font-bold tracking-tight whitespace-nowrap">1:1 멘토링</span>
        </Link>

        {/* 마이페이지 */}
        <Link href="/mypage" className="flex flex-col items-center justify-center p-2 flex-1 hover:text-gray-900 transition-colors">
          <User className="w-6 h-6 mb-1" strokeWidth={2} />
          <span className="text-[11px] font-bold tracking-tight">마이페이지</span>
        </Link>

      </nav>
      
    </div>
  );
}