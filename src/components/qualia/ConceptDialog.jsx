import React from 'react';

export default function ConceptDialog({ open, onClose }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 p-6 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-light tracking-tight">Qualia Flow &amp; the Markov Qualia Kernel</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white">✕</button>
        </div>

        <div className="mt-4 space-y-3 text-sm leading-relaxed text-white/70">
          <p>
            Donald Hoffman proposes that consciousness can be modeled as a Markov process
            over a small space of <em>experiences</em> (qualia). An agent doesn't perceive
            the world directly — it perceives a constructed conscious state, and that state
            drives its behavior.
          </p>
          <p>
            Each agent here carries four pieces, composed every tick:
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li><b className="text-white">D — decision kernel:</b> maps the current feeling to a probability distribution over actions, then samples one.</li>
            <li><b className="text-white">A — action:</b> moves the agent's body through the shared world.</li>
            <li><b className="text-white">P — perception kernel:</b> turns the world — including the feelings of nearby agents — into a new experience distribution.</li>
            <li><b className="text-white">Q = P ∘ A ∘ D:</b> the composed qualia kernel; one tick of the stream of consciousness.</li>
          </ul>
          <p>
            The social twist is in <b className="text-white">P</b>: it is open to other agents.
            When two agents are close, their experience distributions leak into each other's
            perception — this is <em>coupling</em>, drawn as the glowing threads between
            circles. Sustain closeness <em>and</em> similarity and two agents can <em>fuse</em>
            into a single larger agent with a shared feeling for a few seconds.
          </p>
          <p>
            You control your <em>action</em> (movement), but you do <em>not</em> control your
            experience — it emerges from perception. That is the whole game: watching and
            shaping how feelings flow between conscious agents in real time.
          </p>
          <p className="text-white/50">
            In a fully networked multiplayer build, each agent is a different human player
            connected over WebSockets. This single-browser realization uses autonomous
            agents that run the identical D, A, P, Q math — so the coupling and fusion
            dynamics you see are the real thing, not a scripted animation.
          </p>
        </div>
      </div>
    </div>
  );
}