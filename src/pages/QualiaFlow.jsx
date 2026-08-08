import React, { useEffect, useRef, useState } from 'react';
import { QualiaEngine } from '@/lib/qualia/engine';
import { MultiplayerSync } from '@/lib/qualia/multiplayer';
import ExperiencePanel from '@/components/qualia/ExperiencePanel';
import AgentList from '@/components/qualia/AgentList';
import ConceptCard from '@/components/qualia/ConceptCard';
import ConceptDialog from '@/components/qualia/ConceptDialog';
import IntroOverlay from '@/components/qualia/IntroOverlay';
import VirtualJoystick from '@/components/qualia/VirtualJoystick';
import { useResponsiveCanvas } from '@/hooks/use-responsive-canvas';
import { useIsMobile } from '@/hooks/use-mobile';

export default function QualiaFlow() {
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const engineRef = useRef(null);
  const mpRef = useRef(null);
  const keys = useRef({});
  const [snap, setSnap] = useState(null);
  const [started, setStarted] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [conceptOpen, setConceptOpen] = useState(false);
  const [spectator, setSpectator] = useState(false);
  const isMobile = useIsMobile();
  useResponsiveCanvas(canvasRef);

  // boot engine + multiplayer when the player enters a room
  useEffect(() => {
    if (!started || !canvasRef.current) return;
    const engine = new QualiaEngine(canvasRef.current);
    engineRef.current = engine;
    engine.onTick((s) => {
      setSnap(s);
      const mp = mpRef.current;
      if (mp && s.player) {
        mp.updateMyState({
          x: s.player.x,
          y: s.player.y,
          experience: s.player.experienceIdx,
          belief: s.player.belief,
        });
      }
    });
    engine.start();

    const mp = new MultiplayerSync(roomCode, 'You');
    mpRef.current = mp;
    mp.onChange((list) => engine.setRemotePlayers(list));
    mp.join().catch((err) => console.warn('Multiplayer unavailable — playing solo:', err));

    return () => {
      engine.stop();
      mp.leave();
      engineRef.current = null;
      mpRef.current = null;
    };
  }, [started, roomCode]);

  // keyboard
  useEffect(() => {
    const applyInput = () => {
      const k = keys.current;
      let x = 0, y = 0;
      if (k['a'] || k['arrowleft']) x -= 1;
      if (k['d'] || k['arrowright']) x += 1;
      if (k['w'] || k['arrowup']) y -= 1;
      if (k['s'] || k['arrowdown']) y += 1;
      const l = Math.hypot(x, y) || 1;
      engineRef.current?.setPlayerInput(x / l, y / l);
    };
    const track = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'f', 'v'];
    const onKeyDown = (e) => {
      const k = e.key.toLowerCase();
      if (track.includes(k)) e.preventDefault();
      if (k === 'f') { engineRef.current?.requestFusion(); return; }
      if (k === 'v') {
        const eng = engineRef.current;
        if (eng) { eng.setSpectator(!eng.spectator); setSpectator(eng.spectator); }
        return;
      }
      keys.current[k] = true;
      applyInput();
    };
    const onKeyUp = (e) => {
      const k = e.key.toLowerCase();
      keys.current[k] = false;
      applyInput();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const toggleSpectator = () => {
    const e = engineRef.current;
    if (!e) return;
    e.setSpectator(!e.spectator);
    setSpectator(e.spectator);
  };

  const humanCount = snap ? snap.agents.filter((a) => a.isRemote).length + 1 : 1;

  const handleMobileMove = (x, y) => {
    if (engineRef.current) {
      engineRef.current.setPlayerInput(x, y);
    }
  };

  const handleMobileFuse = () => {
    if (engineRef.current) {
      engineRef.current.requestFusion();
    }
  };

  const handleMobileSpectator = () => {
    const e = engineRef.current;
    if (!e) return;
    e.setSpectator(!e.spectator);
    setSpectator(e.spectator);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <header className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-light tracking-tight">Qualia Flow</h1>
            <p className="text-xs text-white/40">
              A playable Markov Qualia Kernel
              {started && roomCode && (
                <>
                  {' '}· Room <span className="text-white/70">{roomCode}</span>
                  {' '}· {humanCount} human{humanCount !== 1 ? 's' : ''}
                </>
              )}
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={toggleSpectator}
              className="flex-1 sm:flex-none rounded-full border border-white/15 px-4 py-1.5 text-xs text-white/70 transition hover:bg-white/10"
            >
              {spectator ? 'Spectating' : 'Spectator'}
            </button>
            <button
              onClick={() => setConceptOpen(true)}
              className="flex-1 sm:flex-none rounded-full border border-white/15 px-4 py-1.5 text-xs text-white/70 transition hover:bg-white/10"
            >
              Concept
            </button>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div ref={canvasContainerRef} className="relative overflow-hidden rounded-2xl border border-white/10 bg-black" style={{ aspectRatio: '1200 / 800' }}>
            <canvas ref={canvasRef} width={1200} height={800} className="block h-auto w-full" />
            {!started && (
              <IntroOverlay
                roomCode={roomCode}
                setRoomCode={setRoomCode}
                onStart={(c) => { setRoomCode(c); setStarted(true); }}
              />
            )}
            {spectator && started && (
              <div className="absolute left-3 top-3 rounded-full bg-black/50 px-3 py-1 text-xs text-white/70">
                Spectator mode — watching the flow
              </div>
            )}
          </div>

          {started && isMobile && (
            <VirtualJoystick
              onMove={handleMobileMove}
              onFuse={handleMobileFuse}
              onSpectator={handleMobileSpectator}
              canFuse={snap?.player?.fusionReady}
              isSpectating={spectator}
            />
          )}

          <aside className="space-y-4 hidden lg:block">
            {snap?.player && !spectator && <ExperiencePanel player={snap.player} />}
            {snap?.agents && <AgentList agents={snap.agents} />}
            <ConceptCard onMore={() => setConceptOpen(true)} />
          </aside>
        </div>

        {/* Mobile sidebar - shown below canvas on small screens */}
        {started && isMobile && (
          <div className="mt-4 space-y-4 lg:hidden">
            {snap?.player && !spectator && <ExperiencePanel player={snap.player} />}
            {snap?.agents && <AgentList agents={snap.agents} />}
            <ConceptCard onMore={() => setConceptOpen(true)} />
          </div>
        )}
      </div>

      <ConceptDialog open={conceptOpen} onClose={() => setConceptOpen(false)} />
    </div>
  );
}
