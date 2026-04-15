import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-900 text-white p-4">
      <h1 className="text-4xl font-bold text-yellow-400 mb-5">
        1:N Live 멘토링 UI 모음
      </h1>

      {/* 4개의 버튼을 세로로 나열하는 묶음 */}
      <div className="flex flex-col gap-4 w-full max-w-sm">
        
        <Link href="/mentoring/live/mentor" className="px-6 py-4 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-zinc-700 transition-colors text-center font-bold">
          🧑‍🏫멘토 ↕️세로 UI
        </Link>

        <Link href="/mentoring/live/mentor/landscape" className="px-6 py-4 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-zinc-700 transition-colors text-center font-bold">
          🧑‍🏫멘토 ↔️가로 UI
        </Link>

        <Link href="/mentoring/live/mentee" className="px-6 py-4 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-zinc-700 transition-colors text-center font-bold">
          🙋멘티 ↕️세로 UI
        </Link>

        <Link href="/mentoring/live/mentee/landscape" className="px-6 py-4 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-zinc-700 transition-colors text-center font-bold">
          🙋멘티 ↔️가로 UI
        </Link>

        <Link href="/" className="w-fit mx-auto px-5 py-3 bg-[#FFCC00] text-black rounded-xl hover:bg-[#E6B800] transition-colors text-center font-bold">
          📱 메인으로
        </Link>

      </div>
    </main>
  );
}