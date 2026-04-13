export default function LandscapeLayout({ children }: { children: React.ReactNode }) {
  return (
    // 1. 전체 화면 배경은 다크 그레이로 깔고, 내용물을 정중앙에 배치합니다.
    <div className="fixed inset-0 w-screen h-[100dvh] bg-[#111111] z-50 flex items-center justify-center overflow-hidden">
      
      {/* 2. 아이폰 가로모드 사이즈(932px x 430px)로 고정하고, 폰처럼 보이게 모서리를 둥글게 깎습니다. */}
      <div className="w-[932px] h-[430px] bg-[#161616] relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden rounded-[32px] border-[6px] border-[#2A2A2A]">
        {children}
      </div>
      
    </div>
  );
}