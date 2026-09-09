import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface VentureDatabase extends DBSchema {
  campaigns: {
    key: string;
    value: {
      id: string;
      savedAt: number;
      checksum: string;
      state: unknown;
      role?: 'primary' | 'journal';
    };
  };
  records: {
    key: string;
    value: {
      id: string;
      sealedAt: number;
      outcome: 'victory' | 'defeat' | 'abandoned';
      state: unknown;
    };
  };
  settings: {
    key: string;
    value: unknown;
  };
}

const DB_NAME = 'venture-star';
const VERSION = 2;
const terminalKey = (id: string) => `venture-star:terminal:${id}`;

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(
    ([a], [b]) => a.localeCompare(b),
  );
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(',')}}`;
}

async function checksum(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(stableStringify(value));
  if (globalThis.crypto?.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }
  let hash = 0x811c9dc5;
  for (const byte of bytes) hash = Math.imul(hash ^ byte, 0x01000193) >>> 0;
  return `fnv1a-${hash.toString(16).padStart(8, '0')}`;
}

export class VentureStore {
  private database: Promise<IDBPDatabase<VentureDatabase>> | null;
  private readonly memoryCampaigns = new Map<
    string,
    VentureDatabase['campaigns']['value']
  >();
  private readonly memoryRecords = new Map<
    string,
    VentureDatabase['records']['value']
  >();
  private readonly memorySettings = new Map<string, unknown>();
  private readonly sealedIds = new Set<string>();

  constructor() {
    this.database =
      typeof indexedDB === 'undefined'
        ? null
        : openDB<VentureDatabase>(DB_NAME, VERSION, {
            upgrade(db) {
              if (!db.objectStoreNames.contains('campaigns'))
                db.createObjectStore('campaigns', { keyPath: 'id' });
              if (!db.objectStoreNames.contains('records'))
                db.createObjectStore('records', { keyPath: 'id' });
              if (!db.objectStoreNames.contains('settings'))
                db.createObjectStore('settings');
            },
          });
  }

  private locallySealed(id: string): boolean {
    if (this.sealedIds.has(id)) return true;
    try {
      const marker = globalThis.localStorage?.getItem(terminalKey(id));
      return marker !== null && marker !== undefined;
    } catch {
      return false;
    }
  }

  private async terminal(id: string): Promise<boolean> {
    if (this.locallySealed(id)) return true;
    if (!this.database) return this.memoryRecords.has(id);
    const db = await this.database;
    const tx = db.transaction(['settings', 'records']);
    const [fence, record] = await Promise.all([
      tx.objectStore('settings').get(terminalKey(id)),
      tx.objectStore('records').get(id),
    ]);
    await tx.done;
    return Boolean(fence || record) || this.locallySealed(id);
  }

  private async writeCampaign(
    id: string,
    row: VentureDatabase['campaigns']['value'],
    isCurrent: () => boolean,
  ): Promise<void> {
    if (this.locallySealed(id) || !isCurrent()) return;
    if (!this.database) {
      this.memoryCampaigns.set(row.id, structuredClone(row));
      return;
    }
    const db = await this.database;
    // Shared transaction scope serializes a stale writer against terminal sealing.
    const tx = db.transaction(
      ['campaigns', 'records', 'settings'],
      'readwrite',
    );
    const [fence, record] = await Promise.all([
      tx.objectStore('settings').get(terminalKey(id)),
      tx.objectStore('records').get(id),
    ]);
    if (!fence && !record && !this.locallySealed(id) && isCurrent())
      await tx.objectStore('campaigns').put(row);
    await tx.done;
  }

  async saveCampaign(
    id: string,
    state: unknown,
    isCurrent: () => boolean = () => true,
  ): Promise<void> {
    if (this.locallySealed(id) || !isCurrent()) return;
    const row = {
      id,
      savedAt: Date.now(),
      checksum: await checksum(state),
      state,
      role: 'primary' as const,
    };
    await this.writeCampaign(id, row, isCurrent);
  }

  async journalCampaign(
    id: string,
    state: unknown,
    isCurrent: () => boolean = () => true,
  ): Promise<void> {
    if (this.locallySealed(id) || !isCurrent()) return;
    const journalId = `${id}:journal`;
    const row = {
      id: journalId,
      savedAt: Date.now(),
      checksum: await checksum(state),
      state,
      role: 'journal' as const,
    };
    await this.writeCampaign(id, row, isCurrent);
  }

  async loadCampaign<T>(id: string): Promise<T | null> {
    if (await this.terminal(id)) return null;
    const row = this.database
      ? await (await this.database).get('campaigns', id)
      : this.memoryCampaigns.get(id);
    if (
      row &&
      (await checksum(row.state)) === row.checksum &&
      !(await this.terminal(id))
    )
      return structuredClone(row.state) as T;
    const journalId = `${id}:journal`;
    const journal = this.database
      ? await (await this.database).get('campaigns', journalId)
      : this.memoryCampaigns.get(journalId);
    return journal &&
      (await checksum(journal.state)) === journal.checksum &&
      !(await this.terminal(id))
      ? (structuredClone(journal.state) as T)
      : null;
  }

  async newestCampaign<T>(): Promise<{ id: string; state: T } | null> {
    const rows = this.database
      ? await (await this.database).getAll('campaigns')
      : [...this.memoryCampaigns.values()];
    const primary = rows
      .filter(
        (candidate) =>
          candidate.role !== 'journal' && !candidate.id.endsWith(':journal'),
      )
      .sort((a, b) => b.savedAt - a.savedAt)[0];
    const journal = rows
      .filter(
        (candidate) =>
          candidate.role === 'journal' || candidate.id.endsWith(':journal'),
      )
      .sort((a, b) => b.savedAt - a.savedAt)[0];
    const id = primary?.id ?? journal?.id.replace(/:journal$/, '');
    if (!id) return null;
    const recovered = await this.loadCampaign<T>(id);
    return recovered ? { id, state: recovered } : null;
  }

  async deleteCampaign(id: string): Promise<void> {
    if (!this.database) {
      this.memoryCampaigns.delete(id);
      this.memoryCampaigns.delete(`${id}:journal`);
      return;
    }
    const db = await this.database;
    const tx = db.transaction('campaigns', 'readwrite');
    await Promise.all([tx.store.delete(id), tx.store.delete(`${id}:journal`)]);
    await tx.done;
  }

  async sealRecord(
    id: string,
    outcome: 'victory' | 'defeat' | 'abandoned',
    state: unknown,
  ): Promise<void> {
    this.sealedIds.add(id);
    // Synchronous tombstone closes the crash window before the first IDB await.
    // It intentionally outlives the user-visible history record.
    try {
      globalThis.localStorage?.setItem(terminalKey(id), 'sealed');
    } catch {
      // IDB remains the durable authority when browser localStorage is unavailable.
    }
    if (!this.database) {
      if (
        !this.memoryRecords.has(id) &&
        !this.memorySettings.has(terminalKey(id))
      )
        this.memoryRecords.set(id, {
          id,
          sealedAt: Date.now(),
          outcome,
          state: structuredClone(state),
        });
      this.memorySettings.set(terminalKey(id), true);
      this.memoryCampaigns.delete(id);
      this.memoryCampaigns.delete(`${id}:journal`);
      return;
    }
    const db = await this.database;
    const tx = db.transaction(
      ['campaigns', 'records', 'settings'],
      'readwrite',
    );
    const [existing, fence] = await Promise.all([
      tx.objectStore('records').get(id),
      tx.objectStore('settings').get(terminalKey(id)),
    ]);
    if (!existing && !fence)
      await tx.objectStore('records').add({
        id,
        sealedAt: Date.now(),
        outcome,
        state: structuredClone(state),
      });
    await tx.objectStore('settings').put(true, terminalKey(id));
    await tx.objectStore('campaigns').delete(id);
    await tx.objectStore('campaigns').delete(`${id}:journal`);
    await tx.done;
  }

  async deleteRecord(id: string): Promise<void> {
    if (!this.database) {
      this.memoryRecords.delete(id);
      return;
    }
    const db = await this.database;
    const tx = db.transaction(['records', 'settings'], 'readwrite');
    if (await tx.objectStore('records').get(id))
      await tx.objectStore('settings').put(true, terminalKey(id));
    await tx.objectStore('records').delete(id);
    await tx.done;
  }

  async records<T>(): Promise<
    Array<{
      id: string;
      sealedAt: number;
      outcome: 'victory' | 'defeat' | 'abandoned';
      state: T;
    }>
  > {
    const rows = this.database
      ? await (await this.database).getAll('records')
      : [...this.memoryRecords.values()];
    return rows.sort((a, b) => b.sealedAt - a.sealedAt) as Array<{
      id: string;
      sealedAt: number;
      outcome: 'victory' | 'defeat' | 'abandoned';
      state: T;
    }>;
  }

  async getSetting<T>(key: string, fallback: T): Promise<T> {
    if (!this.database)
      return (this.memorySettings.get(key) as T | undefined) ?? fallback;
    return (
      ((await (await this.database).get('settings', key)) as T | undefined) ??
      fallback
    );
  }

  async setSetting(key: string, value: unknown): Promise<void> {
    if (!this.database) {
      this.memorySettings.set(key, structuredClone(value));
      return;
    }
    await (await this.database).put('settings', value, key);
  }
}
