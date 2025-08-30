import Spline from '@splinetool/react-spline';

export default function Hero({ onStart, pregame }){
  return (
    <section className="relative w-full h-[400px] md:h-[520px] bg-slate-900/60 overflow-hidden">
      <div className="absolute inset-0">
        <Spline scene="https://prod.spline.design/UGnf9D1Hp3OG8vSG/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/20 to-slate-950 pointer-events-none" />
      <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex flex-col justify-center">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">Custom Chess Arena</h1>
        <p className="mt-3 text-slate-300 max-w-2xl">Build your lineup with special abilities, earn points by capturing and winning, and upgrade pre-game or mid-match.</p>
        <div className="mt-6 flex gap-3">
          <button
            className="rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 py-2 text-white font-medium transition"
            onClick={onStart}
          >
            {pregame ? 'Start Match' : 'Resume Match'}
          </button>
          <a href="#game" className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-white font-medium transition">How it works</a>
        </div>
      </div>
    </section>
  );
}
