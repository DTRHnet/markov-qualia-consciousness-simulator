import React from 'react';
import { STATES, STATE_COLORS } from '@/lib/qualia/constants';

export default function ExperiencePanel({ player }) {
  if (!player) return null;
  const col = STATE_COLORS[player.experienceIdx];
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <span
          className="h-9 w-9 rounded-full"
          style={{
            background: `rgb(${col[0]},${col[1]},${col[2]})`,
            boxShadow: `0 0 18px rgba(${col[0]},${col[1]},${col[2]},0.7)`,
          }}
        />
        <div>
          <div className="text-[10px] uppercase tracking-widest text-white/40">Your experience</div>
          <div className="text-lg font-semibold text-white">{player.experience}</div>
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        {STATES.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span className="w-16 text-xs text-white/50">{s}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(player.belief[i] * 100).toFixed(0)}%`,
                  background: `rgb(${STATE_COLORS[i][0]},${STATE_COLORS[i][1]},${STATE_COLORS[i][2]})`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {player.fused && (
        <div className="mt-3 rounded-lg bg-fuchsia-500/20 px-3 py-2 text-xs text-fuchsia-200">
          Fused — a shared consciousness is active
        </div>
      )}
      {player.fusionReady && !player.fused && (
        <div className="mt-3 rounded-lg bg-emerald-500/20 px-3 py-2 text-xs text-emerald-200">
          Press <b>F</b> to fuse with {player.fusionCandidateName}
        </div>
      )}
    </div>
  );
}