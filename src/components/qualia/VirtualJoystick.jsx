import React, { useRef, useEffect, useState } from 'react';

export default function VirtualJoystick({ onMove, onFuse, onSpectator, canFuse, isSpectating }) {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });

  const JOYSTICK_RADIUS = 40;
  const STICK_RADIUS = 30;

  useEffect(() => {
    const handleTouchStart = (e) => {
      if (!containerRef.current) return;
      const touch = e.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      setIsDragging(true);
      updateJoystick(touch.clientX - rect.left, touch.clientY - rect.top, centerX, centerY);
    };

    const handleTouchMove = (e) => {
      if (!isDragging || !containerRef.current) return;
      const touch = e.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      updateJoystick(touch.clientX - rect.left, touch.clientY - rect.top, centerX, centerY);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      setJoystickPos({ x: 0, y: 0 });
      onMove(0, 0);
    };

    const updateJoystick = (touchX, touchY, centerX, centerY) => {
      const dx = touchX - centerX;
      const dy = touchY - centerY;
      const distance = Math.hypot(dx, dy);

      if (distance > JOYSTICK_RADIUS) {
        const angle = Math.atan2(dy, dx);
        const x = Math.cos(angle) * JOYSTICK_RADIUS;
        const y = Math.sin(angle) * JOYSTICK_RADIUS;
        setJoystickPos({ x, y });
        const normalizedX = x / JOYSTICK_RADIUS;
        const normalizedY = y / JOYSTICK_RADIUS;
        onMove(normalizedX, normalizedY);
      } else {
        setJoystickPos({ x: dx, y: dy });
        const normalizedX = distance > 0 ? dx / JOYSTICK_RADIUS : 0;
        const normalizedY = distance > 0 ? dy / JOYSTICK_RADIUS : 0;
        onMove(normalizedX, normalizedY);
      }
    };

    if (containerRef.current) {
      containerRef.current.addEventListener('touchstart', handleTouchStart);
      containerRef.current.addEventListener('touchmove', handleTouchMove);
      containerRef.current.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('touchstart', handleTouchStart);
        containerRef.current.removeEventListener('touchmove', handleTouchMove);
        containerRef.current.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [isDragging, onMove]);

  return (
    <div className="flex flex-col gap-4 sm:hidden">
      {/* Virtual Joystick */}
      <div
        ref={containerRef}
        className="relative h-40 w-40 rounded-full border-2 border-white/20 bg-white/5 mx-auto"
      >
        <div
          className="absolute h-16 w-16 rounded-full border border-white/40 bg-white/10 transition-all"
          style={{
            left: `calc(50% + ${joystickPos.x}px - 32px)`,
            top: `calc(50% + ${joystickPos.y}px - 32px)`,
          }}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={onFuse}
          disabled={!canFuse}
          className="rounded-lg border border-white/15 bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-200 transition disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-emerald-500/30"
        >
          Fuse
        </button>
        <button
          onClick={onSpectator}
          className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10"
        >
          {isSpectating ? 'Playing' : 'Spectate'}
        </button>
      </div>
    </div>
  );
}
