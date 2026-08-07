import React from 'react';
import { STATE_COLORS } from '@/lib/qualia/constants';

export default function AgentList({ agents }) {
  if (!agents) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      <div className="mb-3 text-[10px] uppercase tracking-widest text-white/40">Agents in the field</div>
      <ul className="space-y-2">
        {agents.map((a) => {
          const c = STATE_COLORS[a.experienceIdx];
          return (
            <li key={a.id} className="flex items-center gap-3">
              <span
                className="h-4 w-4 rounded-full"
                style={{
                  background: `rgb(${c[0]},${c[1]},${c[2]})`,
                  boxShadow: `0 0 8px rgba(${c[0]},${c[1]},${c[2]},0.7)`,
                }}
              />
              <span className={a.isPlayer ? 'font-semibold text-white' : a.isRemote ? 'text-white' : 'text-white/70'}>
                {a.name}
              </span>
              {a.isRemote && <span className="text-[10px] uppercase text-sky-300">human</span>}
              {a.fused && <span className="text-[10px] uppercase text-fuchsia-300">fused</span>}
              <span className="ml-auto text-xs text-white/40">{a.experience}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}