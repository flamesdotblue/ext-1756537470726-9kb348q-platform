import { useEffect, useMemo, useState } from 'react';
import Hero from './components/Hero';
import GameBoard from './components/GameBoard';
import UpgradePanel from './components/UpgradePanel';
import HUD from './components/HUD';

const STARTING_PERSIST_BALANCE = 100; // Starting bank for each player for pre-game upgrades

const defaultUpgrades = {
  jumper: { name: 'Jumper', cost: 20, description: 'Can jump over pieces when moving in lines (like a knight for sliders).' },
  shield: { name: 'Shield', cost: 30, description: 'Survive first capture attempt (lose shield instead).' },
  teleport: { name: 'Teleport', cost: 40, description: 'Once per game, move to any empty square within 3 tiles.' },
  diagonal: { name: 'Add Diagonal', cost: 25, description: 'Add diagonal moves (great for Rooks).' },
  orthogonal: { name: 'Add Orthogonal', cost: 25, description: 'Add orthogonal moves (great for Bishops).' },
  dash: { name: 'Dash +2', cost: 15, description: 'Increase max sliding distance by +2 (non-pawns and non-knights).'},
};

const pieceValues = { Pawn: 5, Knight: 15, Bishop: 15, Rook: 25, Queen: 45, King: 100 };

function createPiece(type, player) {
  return {
    id: `${type}-${player}-${Math.random().toString(36).slice(2,9)}`,
    type,
    player, // 'W' or 'B'
    hasMoved: false,
    abilities: { jumper: false, shield: false, teleport: false, teleportLeft: 0, diagonal: false, orthogonal: false, dash: 0 },
    hp: 1, // increased to 2 when shield applied
  };
}

function initialBoard() {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  const backRank = ['Rook','Knight','Bishop','Queen','King','Bishop','Knight','Rook'];
  // White at bottom (rows 6,7), Black at top (rows 0,1)
  for (let c=0;c<8;c++) {
    board[1][c] = createPiece('Pawn','B');
    board[6][c] = createPiece('Pawn','W');
    board[0][c] = createPiece(backRank[c],'B');
    board[7][c] = createPiece(backRank[c],'W');
  }
  return board;
}

function cloneBoard(board){
  return board.map(row => row.map(cell => cell ? { ...cell, abilities: { ...cell.abilities } } : null));
}

function usePersistentBalances() {
  const [p1Balance, setP1Balance] = useState(0);
  const [p2Balance, setP2Balance] = useState(0);
  useEffect(()=>{
    const b1 = parseInt(localStorage.getItem('chess_custom_balance_P1')||'NaN',10);
    const b2 = parseInt(localStorage.getItem('chess_custom_balance_P2')||'NaN',10);
    setP1Balance(Number.isFinite(b1) ? b1 : STARTING_PERSIST_BALANCE);
    setP2Balance(Number.isFinite(b2) ? b2 : STARTING_PERSIST_BALANCE);
  },[]);
  useEffect(()=>{ localStorage.setItem('chess_custom_balance_P1', String(p1Balance)); },[p1Balance]);
  useEffect(()=>{ localStorage.setItem('chess_custom_balance_P2', String(p2Balance)); },[p2Balance]);
  return { p1Balance, setP1Balance, p2Balance, setP2Balance };
}

export default function App(){
  const [board, setBoard] = useState(initialBoard);
  const [turn, setTurn] = useState('W');
  const [selected, setSelected] = useState(null); // {r,c}
  const [winner, setWinner] = useState(null);
  const [pregame, setPregame] = useState(true);
  const [hoverMoves, setHoverMoves] = useState([]);
  const [gamePoints, setGamePoints] = useState({ W: 0, B: 0 });
  const { p1Balance, setP1Balance, p2Balance, setP2Balance } = usePersistentBalances();

  // Legal moves calculator considering abilities
  const legalMoves = useMemo(()=>{
    if (!selected) return [];
    const { r, c } = selected;
    const piece = board[r][c];
    if (!piece) return [];
    if (piece.player !== turn && !pregame) return [];
    return computeLegalMoves(board, r, c);
  }, [selected, board, turn, pregame]);

  function applyUpgradeToPiece(piece, key){
    // returns updated abilities and any stat changes
    const abilities = { ...piece.abilities };
    if (key === 'shield' && !abilities.shield) { abilities.shield = true; return { abilities, hp: 2 }; }
    if (key === 'teleport' && !abilities.teleport) { abilities.teleport = true; abilities.teleportLeft = 1; return { abilities }; }
    if (key === 'jumper' && !abilities.jumper) { abilities.jumper = true; return { abilities }; }
    if (key === 'diagonal' && !abilities.diagonal) { abilities.diagonal = true; return { abilities }; }
    if (key === 'orthogonal' && !abilities.orthogonal) { abilities.orthogonal = true; return { abilities }; }
    if (key === 'dash') { abilities.dash = (abilities.dash||0) + 2; return { abilities }; }
    return null;
  }

  function handleApplyUpgrade({ upgradeKey, targetPieceId }){
    const cost = defaultUpgrades[upgradeKey].cost;
    const currentPlayer = pregame ? 'W' : turn; // pregame upgrades default to White first; allow toggle using HUD controls
    const isWhite = currentPlayer === 'W';

    // balances and game points
    const bank = isWhite ? p1Balance : p2Balance;
    const inGame = gamePoints[currentPlayer];

    const payingFrom = pregame ? bank : inGame;
    if (payingFrom < cost) return; // insufficient

    setBoard(prev => {
      const b = cloneBoard(prev);
      let found = null;
      for (let i=0;i<8;i++) { for (let j=0;j<8;j++) { const p = b[i][j]; if (p && p.id === targetPieceId && (pregame || p.player === turn)) { found = { i,j,p }; break; } } if (found) break; }
      if (!found) return prev;
      const { i,j,p } = found;
      const res = applyUpgradeToPiece(p, upgradeKey);
      if (!res) return prev;
      b[i][j] = { ...p, abilities: res.abilities, hp: res.hp ?? p.hp };
      return b;
    });

    if (pregame) {
      if (isWhite) setP1Balance(b => b - cost); else setP2Balance(b => b - cost);
    } else {
      setGamePoints(g => ({ ...g, [currentPlayer]: g[currentPlayer] - cost }));
    }
  }

  function handleSquareClick(r,c){
    if (winner) return;
    const piece = board[r][c];
    // Pregame: selecting your own pieces to upgrade; allow both players via HUD toggle
    if (pregame) {
      setSelected(piece ? { r, c } : null);
      return;
    }

    if (!selected) {
      if (piece && piece.player === turn) setSelected({ r, c });
      return;
    }

    const isLegal = legalMoves.some(m => m.r === r && m.c === c);
    if (!isLegal) { setSelected(null); return; }

    performMove(selected, { r, c });
  }

  function performMove(from, to){
    setBoard(prev => {
      const b = cloneBoard(prev);
      const moving = b[from.r][from.c];
      const target = b[to.r][to.c];

      // Handle teleport intent if outside normal path but marked as teleport
      // (We allow teleport as special move computed in computeLegalMoves)

      // Capture logic with shield
      if (target) {
        if (target.hp > 1) {
          // knock off shield
          b[to.r][to.c] = { ...target, hp: target.hp - 1, abilities: { ...target.abilities, shield: target.hp - 1 > 1 ? target.abilities.shield : false } };
          // piece stays in place as attack expended
          return prev; // Cancel the move, as shield absorbed
        }
      }

      // Move piece
      b[to.r][to.c] = { ...moving, hasMoved: true };
      b[from.r][from.c] = null;

      // If teleport used, consume charge
      const usedTeleport = Math.abs(to.r - from.r) > 2 || Math.abs(to.c - from.c) > 2 ? true : false;
      if (usedTeleport && moving.abilities.teleport && moving.abilities.teleportLeft > 0) {
        b[to.r][to.c].abilities = { ...b[to.r][to.c].abilities, teleportLeft: moving.abilities.teleportLeft - 1 };
      }

      // Pawn promotion (simple): auto-promote at back rank to Queen
      const p = b[to.r][to.c];
      if (p.type === 'Pawn' && ((p.player==='W' && to.r===0) || (p.player==='B' && to.r===7))) {
        b[to.r][to.c] = { ...p, type: 'Queen' };
      }

      // Award points for capture
      if (target) {
        const value = pieceValues[target.type] || 10;
        setGamePoints(g => ({ ...g, [p.player]: g[p.player] + value }));
      }

      // Win check (capture king)
      if (target && target.type === 'King') {
        setWinner(moving.player);
        const isWhite = moving.player === 'W';
        if (isWhite) setP1Balance(bal => bal + pieceValues.King + 100);
        else setP2Balance(bal => bal + pieceValues.King + 100);
      }

      return b;
    });

    setSelected(null);
    setTurn(t => t === 'W' ? 'B' : 'W');
  }

  function newGame() {
    setBoard(initialBoard());
    setTurn('W');
    setSelected(null);
    setWinner(null);
    setPregame(true);
    setGamePoints({ W: 0, B: 0 });
  }

  // Allow toggling pregame upgrade side
  const [pregameSide, setPregameSide] = useState('W');

  // Sync selection allowed side during pregame
  useEffect(()=>{
    if (!pregame) return;
    if (!selected) return;
    const p = board[selected.r][selected.c];
    if (!p || p.player !== pregameSide) setSelected(null);
  }, [pregameSide, pregame, board, selected]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Hero onStart={()=> setPregame(false)} pregame={pregame} />

      <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <GameBoard
            board={board}
            onSquareClick={handleSquareClick}
            selected={selected}
            setSelected={setSelected}
            legalMoves={legalMoves}
            onSquareHover={(moves)=> setHoverMoves(moves)}
            hoverMoves={hoverMoves}
          />
        </div>
        <div className="lg:col-span-4 space-y-6">
          <HUD
            turn={turn}
            winner={winner}
            pregame={pregame}
            setPregame={setPregame}
            gamePoints={gamePoints}
            p1Balance={p1Balance}
            p2Balance={p2Balance}
            pregameSide={pregameSide}
            setPregameSide={setPregameSide}
            onNewGame={newGame}
          />

          <UpgradePanel
            board={board}
            selected={selected}
            upgrades={defaultUpgrades}
            onApply={handleApplyUpgrade}
            pregame={pregame}
            turn={turn}
            balances={{ W: p1Balance, B: p2Balance }}
            gamePoints={gamePoints}
            pregameSide={pregameSide}
          />
        </div>
      </div>
    </div>
  );
}

// Movement rules and abilities
function computeLegalMoves(board, r, c){
  const piece = board[r][c];
  if (!piece) return [];
  const ab = piece.abilities || {};

  const dirs = [];
  const addDirs = (arr)=> arr.forEach(d => dirs.push(d));

  const orth = [[1,0],[-1,0],[0,1],[0,-1]];
  const diag = [[1,1],[1,-1],[-1,1],[-1,-1]];

  // Determine base move set
  switch(piece.type){
    case 'King': addDirs([...orth, ...diag]); break;
    case 'Queen': addDirs([...orth, ...diag]); break;
    case 'Rook': addDirs(orth); if (ab.diagonal) addDirs(diag); break;
    case 'Bishop': addDirs(diag); if (ab.orthogonal) addDirs(orth); break;
    case 'Knight': break; // handled separately
    case 'Pawn': break; // handled separately
    default: break;
  }

  let moves = [];

  // Sliding pieces
  const isSlider = ['Queen','Rook','Bishop'].includes(piece.type) || ((piece.type==='King') && false);
  const maxStepBase = piece.type==='King' ? 1 : 8;
  const extra = ab.dash || 0;
  const maxSteps = piece.type==='King' ? (1 + Math.min(2, extra>0?1:0)) : (maxStepBase + extra); // King can dash +1 step at most

  if (piece.type==='Knight'){
    const jumps = [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]];
    for (const [dr,dc] of jumps){
      const nr=r+dr, nc=c+dc; if (!inBounds(nr,nc)) continue;
      if (!board[nr][nc] || board[nr][nc].player !== piece.player) moves.push({ r:nr, c:nc });
    }
  } else if (piece.type==='Pawn'){
    const dir = piece.player==='W' ? -1 : 1;
    const nr = r + dir;
    if (inBounds(nr,c) && !board[nr][c]) moves.push({ r:nr, c });
    const startRow = piece.player==='W' ? 6 : 1;
    const two = r + dir*2;
    if (r===startRow && inBounds(two,c) && !board[nr][c] && !board[two][c]) moves.push({ r: two, c });
    // captures
    for (const dc of [-1,1]){
      const nc = c + dc; const cr = r + dir; if (!inBounds(cr,nc)) continue;
      if (board[cr][nc] && board[cr][nc].player !== piece.player) moves.push({ r: cr, c: nc });
    }
  } else {
    // sliders and king
    for (const [dr,dc] of dirs){
      for (let step=1; step<=maxSteps; step++){
        const nr=r+dr*step, nc=c+dc*step; if (!inBounds(nr,nc)) break;
        const occ = board[nr][nc];
        if (!occ) { moves.push({ r:nr, c:nc }); continue; }
        if (occ.player !== piece.player) { moves.push({ r:nr, c:nc }); }
        if (ab.jumper) { // can continue past blocking
          continue;
        } else {
          break;
        }
      }
    }
  }

  // Teleport special moves: within radius 3 empty squares if charges left
  if (ab.teleport && ab.teleportLeft > 0){
    for (let dr=-3; dr<=3; dr++){
      for (let dc=-3; dc<=3; dc++){
        if (dr===0 && dc===0) continue;
        const nr=r+dr, nc=c+dc; if (!inBounds(nr,nc)) continue;
        if (!board[nr][nc]) moves.push({ r:nr, c:nc, teleport:true });
      }
    }
  }

  // Remove moves that land on your own piece
  moves = moves.filter(m => !board[m.r][m.c] || board[m.r][m.c].player !== piece.player);

  return dedupeMoves(moves);
}

function inBounds(r,c){ return r>=0 && r<8 && c>=0 && c<8; }
function dedupeMoves(moves){ const key = (m)=> m.r+','+m.c; const seen=new Set(); const out=[]; for(const m of moves){ const k=key(m); if(!seen.has(k)){ seen.add(k); out.push(m);} } return out; }
