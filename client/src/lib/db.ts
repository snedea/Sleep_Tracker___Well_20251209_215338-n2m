import Dexie, { Table } from 'dexie';
import type { SleepLog, DiaryEntry, PendingMutation } from '../types';

// IndexedDB database class
class WellnessDatabase extends Dexie {
  sleepLogs!: Table<SleepLog & { syncStatus?: 'synced' | 'pending' }>;
  diaryEntries!: Table<DiaryEntry & { syncStatus?: 'synced' | 'pending' }>;
  pendingMutations!: Table<PendingMutation>;

  constructor() {
    super('SleepTrackerDB');

    this.version(1).stores({
      sleepLogs: '++id, date, userId, syncStatus',
      diaryEntries: '++id, date, userId, syncStatus',
      pendingMutations: '++id, type, resource, timestamp',
    });
  }
}

export const db = new WellnessDatabase();

// Sleep log offline operations
export const offlineSleepLogs = {
  async getAll(userId: number): Promise<SleepLog[]> {
    return db.sleepLogs
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('date');
  },

  async getByDate(userId: number, date: string): Promise<SleepLog | undefined> {
    return db.sleepLogs
      .where({ userId, date })
      .first();
  },

  async save(log: SleepLog): Promise<void> {
    await db.sleepLogs.put({ ...log, syncStatus: 'synced' });
  },

  async savePending(log: Omit<SleepLog, 'id'>, tempId: number): Promise<void> {
    await db.sleepLogs.put({ ...log, id: tempId, syncStatus: 'pending' } as SleepLog & { syncStatus: 'pending' });
  },

  async delete(id: number): Promise<void> {
    await db.sleepLogs.delete(id);
  },

  async bulkSave(logs: SleepLog[]): Promise<void> {
    await db.sleepLogs.bulkPut(logs.map((log) => ({ ...log, syncStatus: 'synced' as const })));
  },

  async clear(userId: number): Promise<void> {
    await db.sleepLogs.where('userId').equals(userId).delete();
  },
};

// Diary entry offline operations
export const offlineDiaryEntries = {
  async getAll(userId: number): Promise<DiaryEntry[]> {
    return db.diaryEntries
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('date');
  },

  async getByDate(userId: number, date: string): Promise<DiaryEntry | undefined> {
    return db.diaryEntries
      .where({ userId, date })
      .first();
  },

  async save(entry: DiaryEntry): Promise<void> {
    await db.diaryEntries.put({ ...entry, syncStatus: 'synced' });
  },

  async savePending(entry: Omit<DiaryEntry, 'id'>, tempId: number): Promise<void> {
    await db.diaryEntries.put({ ...entry, id: tempId, syncStatus: 'pending' } as DiaryEntry & { syncStatus: 'pending' });
  },

  async delete(id: number): Promise<void> {
    await db.diaryEntries.delete(id);
  },

  async bulkSave(entries: DiaryEntry[]): Promise<void> {
    await db.diaryEntries.bulkPut(entries.map((entry) => ({ ...entry, syncStatus: 'synced' as const })));
  },

  async clear(userId: number): Promise<void> {
    await db.diaryEntries.where('userId').equals(userId).delete();
  },
};

// Pending mutations queue
export const pendingMutations = {
  async add(mutation: PendingMutation): Promise<void> {
    await db.pendingMutations.add(mutation);
  },

  async getAll(): Promise<PendingMutation[]> {
    return db.pendingMutations.orderBy('timestamp').toArray();
  },

  async remove(id: string): Promise<void> {
    await db.pendingMutations.where('id').equals(id).delete();
  },

  async clear(): Promise<void> {
    await db.pendingMutations.clear();
  },

  async count(): Promise<number> {
    return db.pendingMutations.count();
  },
};

// Check if we're online
export function isOnline(): boolean {
  return navigator.onLine;
}

// Listen for online/offline events
export function onConnectionChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
