import Link from "next/link";
import { Home, MapPin, MessageSquare, Calendar, User } from "lucide-react";

export default function WithNavLayout({ children }: { children: React.ReactNode }) {
  return (
    // 1. 전체 화면을 꽉 채우는 Flex 컨테이너 (h-[100dvh]로 높이 고정, 넘침 방지)
    <div className="flex flex-col w-full h-[100dvh] bg-white overflow-hidden relative">
      
      {/* 2. 본문 영역: flex-1로 남은 공간을 모두 채우고, 여기서만 스크롤이 발생하도록 설정 */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>

      {/* 3. 네비게이션 바: fixed 속성을 제거하여, 본문과 완벽하게 동일한 너비로 하단에 안착합니다. */}
      <nav className="w-full shrink-0 bg-white border-t border-gray-100 flex justify-between px-2 pt-2 pb-safe text-gray-400 z-50">
        <Link href="/" className="flex flex-col items-center p-2 flex-1 text-[#1A1A1A]">
          <Home className="w-6 h-6 mb-1" strokeWidth={2} />
          <span className="text-[10px] font-bold">홈</span>
        </Link>
        <Link href="#" className="flex flex-col items-center p-2 flex-1 hover:text-gray-900 transition-colors">
          <MapPin className="w-6 h-6 mb-1" strokeWidth={2} />
          <span className="text-[10px] font-bold">지도</span>
        </Link>
        <Link href="#" className="flex flex-col items-center p-2 flex-1 hover:text-gray-900 transition-colors">
          <MessageSquare className="w-6 h-6 mb-1" strokeWidth={2} />
          <span className="text-[10px] font-bold">메시지</span>
        </Link>
        <Link href="#" className="flex flex-col items-center p-2 flex-1 hover:text-gray-900 transition-colors">
          <Calendar className="w-6 h-6 mb-1" strokeWidth={2} />
          <span className="text-[10px] font-bold">예약</span>
        </Link>
        <Link href="/mypage" className="flex flex-col items-center p-2 flex-1 hover:text-gray-900 transition-colors">
          <User className="w-6 h-6 mb-1" strokeWidth={2} />
          <span className="text-[10px] font-bold">마이</span>
        </Link>
      </nav>
      
    </div>
  );
}