import { useMemo } from 'react';

export default function UpgradePanel({ board, selected, upgrades, onApply, pregame, turn, balances, gamePoints, pregameSide }){
  const currentSide = pregame ? pregameSide : turn;
  const selectedPiece = useMemo(()=>{
    if (!selected) return null;
    const p = board[selected.r][selected.c];
    if (!p) return null;
    return p;
  },[selected, board]);

  const candidates = useMemo(()=>{
    const list = [];
    for (let r=0;r<8;r++) for (let c=0;c<8;c++){
      const p = board[r][c]; if (!p) continue; if (p.player!==currentSide) continue; list.push(p);
    }
    return list;
  },[board, currentSide]);

  const canAfford = (cost)=> pregame ? balances[currentSide] >= cost : gamePoints[currentSide] >= cost;

  return (
    <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800">
      <h3 className="font-semibold text-lg">Upgrades {pregame? '(Pre-game)': '(Mid-game)'}</h3>
      <div className="text-xs text-slate-400 mb-3">Select a piece then choose an upgrade. Costs are deducted from {pregame? 'your bank': 'your in-game points'}.</div>

      <div className="mb-3">
        <label className="block text-xs text-slate-400 mb-1">Your Pieces</label>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {candidates.map(p => (
            <button key={p.id} className={`px-2 py-1 rounded-md text-xs border ${selectedPiece && selectedPiece.id===p.id? 'border-indigo-400 bg-slate-800': 'border-slate-700 bg-slate-800/60'}`} onClick={()=>{
              // find coords
              for (let r=0;r<8;r++) for (let c=0;c<8;c++){ if (board[r][c] && board[r][c].id===p.id){ selected.r=r; selected.c=c; }}
            }}>
              {p.type} {p.player}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {Object.entries(upgrades).map(([key,u])=>{
          const disabled = !selectedPiece || !canAfford(u.cost);
          return (
            <div key={key} className="flex items-center justify-between bg-slate-800/60 rounded-md p-3 border border-slate-700">
              <div>
                <div className="font-medium">{u.name} <span className="text-xs text-slate-400">({u.cost} pts)</span></div>
                <div className="text-xs text-slate-400 max-w-md">{u.description}</div>
              </div>
              <button
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${disabled? 'bg-slate-700 text-slate-400 cursor-not-allowed':'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
                onClick={()=> onApply({ upgradeKey: key, targetPieceId: selectedPiece?.id })}
                disabled={disabled}
              >Apply</button>
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-slate-500">
        Earn points by capturing enemy pieces. Win bonus is granted to your bank when you capture the King.
      </div>
    </div>
  );
}
