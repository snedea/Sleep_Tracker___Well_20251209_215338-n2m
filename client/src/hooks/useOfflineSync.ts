import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  isOnline,
  onConnectionChange,
  pendingMutations,
  offlineSleepLogs,
  offlineDiaryEntries,
} from '../lib/db';
import { apiPost, apiPut, apiDelete } from '../lib/api';
import { useAuth } from './useAuth';
import type { PendingMutation } from '../types';

// Sync status
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export function useOfflineSync() {
  const [status, setStatus] = useState<SyncStatus>(isOnline() ? 'idle' : 'offline');
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    const count = await pendingMutations.count();
    setPendingCount(count);
  }, []);

  // Process a single mutation
  const processMutation = async (mutation: PendingMutation): Promise<boolean> => {
    try {
      const { type, resource, data } = mutation;
      const baseUrl = resource === 'sleepLogs' ? '/api/sleep-logs' : '/api/diary-entries';

      switch (type) {
        case 'create':
          await apiPost(baseUrl, data);
          break;
        case 'update':
          const updateData = data as { id: number; input: unknown };
          await apiPut(`${baseUrl}/${updateData.id}`, updateData.input);
          break;
        case 'delete':
          await apiDelete(`${baseUrl}/${data}`);
          break;
      }

      return true;
    } catch (error) {
      console.error('Failed to process mutation:', error);
      return false;
    }
  };

  // Sync all pending mutations
  const syncPendingMutations = useCallback(async () => {
    if (!isOnline() || !isAuthenticated) return;

    const mutations = await pendingMutations.getAll();
    if (mutations.length === 0) {
      setStatus('synced');
      return;
    }

    setStatus('syncing');
    setLastSyncError(null);

    let successCount = 0;
    let failedCount = 0;

    for (const mutation of mutations) {
      const success = await processMutation(mutation);
      if (success) {
        await pendingMutations.remove(mutation.id);
        successCount++;
      } else {
        failedCount++;
      }
    }

    await updatePendingCount();

    if (failedCount > 0) {
      setStatus('error');
      setLastSyncError(`Failed to sync ${failedCount} changes`);
    } else {
      setStatus('synced');
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['sleepLogs'] });
      queryClient.invalidateQueries({ queryKey: ['diaryEntries'] });
    }
  }, [isAuthenticated, queryClient, updatePendingCount]);

  // Add mutation to queue
  const addToQueue = useCallback(async (
    type: 'create' | 'update' | 'delete',
    resource: 'sleepLogs' | 'diaryEntries',
    data: unknown
  ) => {
    await pendingMutations.add({
      id: crypto.randomUUID(),
      type,
      resource,
      data,
      timestamp: Date.now(),
    });
    await updatePendingCount();
  }, [updatePendingCount]);

  // Handle online/offline status changes
  useEffect(() => {
    const unsubscribe = onConnectionChange((online) => {
      setStatus(online ? 'idle' : 'offline');
      if (online) {
        // Sync when coming back online
        syncPendingMutations();
      }
    });

    return unsubscribe;
  }, [syncPendingMutations]);

  // Initial pending count
  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  // Sync on mount if online
  useEffect(() => {
    if (isOnline() && isAuthenticated) {
      syncPendingMutations();
    }
  }, [isAuthenticated, syncPendingMutations]);

  // Clear local data (for logout)
  const clearLocalData = useCallback(async () => {
    if (user) {
      await offlineSleepLogs.clear(user.id);
      await offlineDiaryEntries.clear(user.id);
    }
    await pendingMutations.clear();
    setPendingCount(0);
  }, [user]);

  return {
    status,
    pendingCount,
    lastSyncError,
    isOnline: isOnline(),
    syncPendingMutations,
    addToQueue,
    clearLocalData,
  };
}

// Hook to check if offline mode is available
export function useOfflineAvailable(): boolean {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    // Check if IndexedDB is available
    const checkAvailability = async () => {
      try {
        const testKey = 'offline-test';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        setAvailable(true);
      } catch {
        setAvailable(false);
      }
    };

    checkAvailability();
  }, []);

  return available;
}
