import React from 'react';

export default function ConceptCard({ onMore }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      <div className="text-[10px] uppercase tracking-widest text-white/40">The idea</div>
      <p className="mt-2 text-sm leading-relaxed text-white/70">
        Every glowing circle is a <em>conscious agent</em>. Each runs a
        <span className="text-white"> Markov Qualia Kernel</span> — a decision kernel{' '}
        <b className="text-white">D</b> that turns its feeling into actions, an action{' '}
        <b className="text-white">A</b> that moves it, and a perception kernel{' '}
        <b className="text-white">P</b> that turns the world (and nearby agents) back into a
        new feeling. The composed kernel <b className="text-white">Q = P ∘ A ∘ D</b> is its
        stream of experience. When agents get close, their kernels <em>couple</em> — your
        feelings shape theirs, and theirs shape yours.
      </p>
      <button
        onClick={onMore}
        className="mt-3 text-xs text-indigo-300 transition hover:text-indigo-200"
      >
        Read the full concept →
      </button>
    </div>
  );
}