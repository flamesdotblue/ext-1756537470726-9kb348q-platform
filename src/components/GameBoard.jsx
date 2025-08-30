import { useMemo } from 'react';

const PIECE_GLYPHS = {
  W: { King: '♔', Queen: '♕', Rook: '♖', Bishop: '♗', Knight: '♘', Pawn: '♙' },
  B: { King: '♚', Queen: '♛', Rook: '♜', Bishop: '♝', Knight: '♞', Pawn: '♟︎' },
};

export default function GameBoard({ board, onSquareClick, selected, setSelected, legalMoves, onSquareHover, hoverMoves }){
  const sizeCls = 'w-10 h-10 md:w-16 md:h-16';

  const highlightMap = useMemo(()=>{
    const map = new Set();
    for (const m of legalMoves||[]) map.add(m.r+','+m.c);
    for (const m of hoverMoves||[]) map.add(m.r+','+m.c);
    return map;
  },[legalMoves,hoverMoves]);

  return (
    <div id="game" className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
      <div className="grid grid-cols-8 gap-1 mx-auto w-max">
        {board.map((row, r) => row.map((cell, c) => {
          const dark = (r + c) % 2 === 1;
          const isSel = selected && selected.r===r && selected.c===c;
          const key = r + '-' + c;
          const canMove = highlightMap.has(r+','+c);
          return (
            <button
              key={key}
              onClick={()=> onSquareClick(r,c)}
              onMouseEnter={()=> {
                if (cell && selected && selected.r===r && selected.c===c) return;
                if (cell) onSquareHover([]);
              }}
              className={`${sizeCls} flex items-center justify-center rounded-md relative select-none shadow-sm ${dark? 'bg-slate-800':'bg-slate-700'} ${isSel? 'ring-2 ring-indigo-400':''} ${canMove? 'outline outline-2 outline-emerald-400/70':''}`}
            >
              {cell ? (
                <div className="flex flex-col items-center">
                  <span className="text-xl md:text-3xl">
                    {PIECE_GLYPHS[cell.player][cell.type]}
                  </span>
                  <div className="flex gap-0.5 mt-0.5">
                    {cell.abilities?.shield && cell.hp>1 ? <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> : null}
                    {cell.abilities?.teleport && (cell.abilities.teleportLeft>0) ? <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" /> : null}
                    {cell.abilities?.jumper ? <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> : null}
                  </div>
                </div>
              ) : null}
            </button>
          );
        }))}
      </div>
      <div className="mt-3 text-xs text-slate-400">
        Tip: Colored dots under a piece indicate abilities: cyan=shield, pink=teleport, amber=jumper.
      </div>
    </div>
  );
}
