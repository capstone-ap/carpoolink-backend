export default function MentorLandscapeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 w-screen h-[100dvh] bg-[#111111] z-50 flex items-center justify-center overflow-hidden">
      <div className="w-[932px] h-[430px] bg-[#161616] relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden rounded-[32px] border-[6px] border-[#2A2A2A]">
        {children}
      </div>
    </div>
  );
}