// ─────────────────────────────────────────────────────────────────────
// MultiplayerSync — syncs the local player to a shared room and streams
// other human players back via Base44 realtime entity subscriptions.
//
// Each human owns ONE QualiaPlayer record (owner-only writes, open reads).
// Every kernel tick the local client writes its position + experience +
// belief; subscriptions deliver every other player's updates in real time.
// ─────────────────────────────────────────────────────────────────────

import { base44 } from '@/api/base44Client';

const STALE_MS = 8000; // drop players we haven't heard from in 8s

export class MultiplayerSync {
  constructor(roomCode, name) {
    this.roomCode = roomCode;
    this.name = name;
    this.myId = null;
    this.players = new Map(); // id -> record (other humans only)
    this.onChangeCb = null;
    this.unsubscribe = null;
  }

  onChange(cb) { this.onChangeCb = cb; }

  async join() {
    const me = await base44.auth.me();
    const rec = await base44.entities.QualiaPlayer.create({
      room_id: this.roomCode,
      name: this.name || me.full_name || me.email || 'Player',
      x: 600,
      y: 400,
      experience: 0,
      belief: [1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6],
      last_seen: new Date(),
    });
    this.myId = rec.id;

    // pull everyone already in the room
    const existing = await base44.entities.QualiaPlayer.filter({ room_id: this.roomCode });
    this.players.clear();
    for (const r of existing) if (r.id !== this.myId) this.players.set(r.id, r);
    this._emit();

    // stream live updates
    this.unsubscribe = base44.entities.QualiaPlayer.subscribe((event) => {
      if (event.type === 'delete') {
        if (this.players.has(event.id)) { this.players.delete(event.id); this._emit(); }
        return;
      }
      const r = event.data;
      if (!r || r.id === this.myId || r.room_id !== this.roomCode) return;
      this.players.set(r.id, r);
      this._emit();
    });

    return rec;
  }

  // called every kernel tick with the local player's state
  async updateMyState(state) {
    if (!this.myId) return;
    try {
      await base44.entities.QualiaPlayer.update(this.myId, { ...state, last_seen: new Date() });
    } catch (e) {
      /* transient — next tick retries */
    }
  }

  _emit() {
    if (!this.onChangeCb) return;
    const now = Date.now();
    const list = [];
    for (const r of this.players.values()) {
      const age = now - new Date(r.last_seen).getTime();
      if (age < STALE_MS) list.push(r);
    }
    this.onChangeCb(list);
  }

  async leave() {
    if (this.unsubscribe) { this.unsubscribe(); this.unsubscribe = null; }
    if (this.myId) {
      try { await base44.entities.QualiaPlayer.delete(this.myId); } catch (e) { /* best effort */ }
      this.myId = null;
    }
  }
}