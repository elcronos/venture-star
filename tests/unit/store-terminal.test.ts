import 'fake-indexeddb/auto';
import { openDB } from 'idb';
import { describe, expect, it, vi } from 'vitest';
import { VentureStore } from '../../src/persistence/store';

describe('M28 durable terminal fence', () => {
  it('rejects stale primary and journal writes from another instance after sealing and history deletion', async () => {
    const live = new VentureStore();
    const stale = new VentureStore();
    const id = 'terminal-cross-instance';
    await live.saveCampaign(id, { tick: 1 });
    await live.sealRecord(id, 'defeat', { outcome: 'defeat' });
    await stale.saveCampaign(id, { tick: 2 });
    await stale.journalCampaign(id, { tick: 3 });
    expect(await stale.loadCampaign(id)).toBeNull();
    await live.deleteRecord(id);
    await stale.saveCampaign(id, { tick: 4 });
    await stale.journalCampaign(id, { tick: 5 });
    expect(await new VentureStore().loadCampaign(id)).toBeNull();
    const db = await openDB('venture-star', 2);
    expect(await db.get('campaigns', id)).toBeUndefined();
    expect(await db.get('campaigns', `${id}:journal`)).toBeUndefined();
    expect(await db.get('settings', `venture-star:terminal:${id}`)).toBe(true);
    db.close();
  });

  it('keeps the first sealed record immutable and does not recreate deleted history', async () => {
    const first = new VentureStore();
    const second = new VentureStore();
    const id = 'terminal-immutable';
    await first.sealRecord(id, 'defeat', { original: true });
    await second.sealRecord(id, 'victory', { replacement: true });
    expect(
      (await first.records()).find((record) => record.id === id),
    ).toMatchObject({ outcome: 'defeat', state: { original: true } });
    await first.deleteRecord(id);
    await second.sealRecord(id, 'victory', { replacement: true });
    expect((await first.records()).some((record) => record.id === id)).toBe(
      false,
    );
  });

  it('racing saves and sealing leave no live row', async () => {
    const first = new VentureStore();
    const second = new VentureStore();
    const id = 'terminal-race';
    await first.saveCampaign(id, { tick: 0 });
    await Promise.all([
      second.saveCampaign(id, { tick: 1 }),
      second.journalCampaign(id, { tick: 2 }),
      first.sealRecord(id, 'defeat', { tick: 3 }),
    ]);
    expect(await second.loadCampaign(id)).toBeNull();
  });

  it('writes the crash tombstone synchronously and blocks old rows before IDB sealing', async () => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    });
    try {
      const first = new VentureStore();
      const second = new VentureStore();
      const id = 'terminal-crash';
      await first.saveCampaign(id, { tick: 1 });
      const sealing = first.sealRecord(id, 'defeat', { tick: 2 });
      expect(values.get(`venture-star:terminal:${id}`)).toBe('sealed');
      expect(await second.loadCampaign(id)).toBeNull();
      await sealing;
      const otherId = 'terminal-crash-only-marker';
      await first.saveCampaign(otherId, { tick: 1 });
      values.set(`venture-star:terminal:${otherId}`, 'sealed');
      expect(await second.loadCampaign(otherId)).toBeNull();
      await second.saveCampaign(otherId, { tick: 99 });
      const db = await openDB('venture-star', 2);
      expect((await db.get('campaigns', otherId)).state).toEqual({ tick: 1 });
      db.close();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
