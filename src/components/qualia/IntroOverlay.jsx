import React, { useEffect } from 'react';
import { STATES, STATE_COLORS } from '@/lib/qualia/constants';

function genCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

export default function IntroOverlay({ roomCode, setRoomCode, onStart }) {
  useEffect(() => {
    if (!roomCode) setRoomCode(genCode());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const code = roomCode || '';

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="max-w-lg px-6 text-center">
        <h1 className="text-4xl font-light tracking-tight text-white">Qualia Flow</h1>
        <p className="mt-3 text-white/60">
          A playable Markov Qualia Kernel. You are a conscious agent in a shared field —
          watch and shape how feelings flow between minds, in real time, across browsers.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {STATES.map((s, i) => {
            const c = STATE_COLORS[i];
            return (
              <span key={s} className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-white/70">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: `rgb(${c[0]},${c[1]},${c[2]})` }} />
                {s}
              </span>
            );
          })}
        </div>

        <div className="mt-6">
          <div className="text-[10px] uppercase tracking-widest text-white/40">Room code</div>
          <div className="mt-2 flex items-center justify-center gap-2">
            <input
              value={code}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="ROOM"
              className="w-32 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-center text-lg font-mono tracking-widest text-white outline-none focus:border-white/40"
            />
            <button
              onClick={() => setRoomCode(genCode())}
              className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/70 transition hover:bg-white/10"
            >
              new
            </button>
          </div>
          <p className="mt-2 text-xs text-white/40">Share this code so others join your field.</p>
        </div>

        <div className="mt-5 space-y-1 text-xs text-white/50">
          <p><b className="text-white/80">WASD / Arrows</b> — move (you choose your action)</p>
          <p><b className="text-white/80">F</b> — fuse with a nearby, attuned agent</p>
          <p><b className="text-white/80">V</b> — toggle spectator mode</p>
        </div>

        <button
          onClick={() => onStart(code || genCode())}
          className="mt-7 rounded-full bg-white px-8 py-3 text-sm font-medium text-slate-900 transition hover:bg-white/90"
        >
          Enter the flow
        </button>
      </div>
    </div>
  );
}