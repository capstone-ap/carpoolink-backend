import Link from "next/link"; // 페이지 이동을 위한 Next.js 기본 도구 가져오기

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-900 text-white p-4">
      <h1 className="text-4xl font-bold text-yellow-400 mb-2">
        카풀링 멘토링 서비스
      </h1>
      <p className="text-lg text-gray-300 mb-10">
        아래 버튼을 눌러 개별 UI 화면으로 이동해보세요!
      </p>

      {/* 4개의 버튼을 세로로 나열하는 묶음 */}
      <div className="flex flex-col gap-4 w-full max-w-sm">
        
        <Link href="/survey" className="px-6 py-4 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-zinc-700 transition-colors text-center font-bold">
          📝 사전 설문 테스트 UI
        </Link>

        <Link href="/mentoring/1on1" className="px-6 py-4 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-zinc-700 transition-colors text-center font-bold">
          📞 1:1 멘토링 룸 UI
        </Link>

        <Link href="/mentoring/live" className="px-6 py-4 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-zinc-700 transition-colors text-center font-bold">
          📺 1:N 라이브 멘토링 UI
        </Link>

        <Link href="/mentor/script" className="px-6 py-4 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-zinc-700 transition-colors text-center font-bold">
          ✂️ 스크립트 수정 UI
        </Link>

      </div>
    </main>
  );
}