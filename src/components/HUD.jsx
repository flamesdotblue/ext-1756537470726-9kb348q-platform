import { Crown, RotateCcw } from 'lucide-react';

export default function HUD({ turn, winner, pregame, setPregame, gamePoints, p1Balance, p2Balance, pregameSide, setPregameSide, onNewGame }){
  return (
    <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-400">{winner? 'Winner': (pregame? 'Setup Phase':'Turn')}</div>
          <div className="text-xl font-semibold">
            {winner ? (winner==='W' ? 'White' : 'Black') : (pregame ? (pregameSide==='W'?'White':'Black') : (turn==='W'?'White':'Black'))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {winner ? (
            <button onClick={onNewGame} className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 text-white text-sm">
              <RotateCcw size={16} /> New Game
            </button>
          ) : (
            <button onClick={()=> setPregame(p=>!p)} className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-white text-sm">
              {pregame? 'Start Match' : 'Back to Setup'}
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="bg-slate-800/60 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">White</div>
          <div className="text-sm">Bank: <span className="font-semibold">{p1Balance}</span></div>
          <div className="text-sm">In-game: <span className="font-semibold">{gamePoints.W}</span></div>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">Black</div>
          <div className="text-sm">Bank: <span className="font-semibold">{p2Balance}</span></div>
          <div className="text-sm">In-game: <span className="font-semibold">{gamePoints.B}</span></div>
        </div>
      </div>

      {pregame ? (
        <div className="mt-4">
          <div className="text-xs text-slate-400 mb-1">Setup Side</div>
          <div className="flex gap-2">
            <button className={`px-3 py-1.5 rounded-md text-sm ${pregameSide==='W'?'bg-indigo-500 text-white':'bg-slate-800 text-slate-200'}`} onClick={()=> setPregameSide('W')}>White</button>
            <button className={`px-3 py-1.5 rounded-md text-sm ${pregameSide==='B'?'bg-indigo-500 text-white':'bg-slate-800 text-slate-200'}`} onClick={()=> setPregameSide('B')}>Black</button>
          </div>
          <div className="mt-3 text-xs text-slate-500">During setup you can spend from your bank to upgrade the selected side's pieces.</div>
        </div>
      ) : (
        <div className="mt-4 bg-slate-800/40 rounded-lg p-3 text-sm flex items-center gap-2">
          <Crown size={16} className="text-amber-300" />
          Capture pieces to earn points. Spend them mid-game on your turn.
        </div>
      )}
    </div>
  );
}
