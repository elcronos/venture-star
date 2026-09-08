import 'fake-indexeddb/auto';
import { openDB } from 'idb';
import { beforeAll, describe, expect, it } from 'vitest';
import { VentureStore } from '../../src/persistence/store';

describe('VentureStore integrity', () => {
  beforeAll(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('venture-star');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => resolve();
    });
  });

  it('keeps the verified primary distinct from its recovery journal', async () => {
    const store = new VentureStore();
    await store.saveCampaign('run-a', { tick: 20 });
    await store.journalCampaign('run-a', { tick: 40 });
    await expect(
      store.newestCampaign<{ tick: number }>(),
    ).resolves.toMatchObject({ id: 'run-a', state: { tick: 20 } });
    const db = await openDB('venture-star', 2);
    const primary = await db.get('campaigns', 'run-a');
    await db.put('campaigns', { ...primary, state: { tick: 999 } });
    await expect(
      store.newestCampaign<{ tick: number }>(),
    ).resolves.toMatchObject({ id: 'run-a', state: { tick: 40 } });
    db.close();
  });

  it('atomically seals an active save into an immutable history record', async () => {
    const store = new VentureStore();
    await store.saveCampaign('run-b', { active: true });
    await store.journalCampaign('run-b', { active: true, tick: 10 });
    await store.sealRecord('run-b', 'defeat', {
      record: { outcome: 'Defeat' },
    });
    await expect(store.loadCampaign('run-b')).resolves.toBeNull();
    await expect(
      store.records<{ record: { outcome: string } }>(),
    ).resolves.toMatchObject([
      {
        id: 'run-b',
        outcome: 'defeat',
        state: { record: { outcome: 'Defeat' } },
      },
    ]);
  });
});
