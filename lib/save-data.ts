import { get as idbGet, keys as idbKeys,set as idbSet } from "idb-keyval";

interface SaveBundle {
  version: 1
  timestamp: number
  localStorage: Record<string, string>
  indexedDB: Record<string, unknown>
}

const STORAGE_KEYS = [
  "flow-master-settings",
  "flow-master-puzzle",
  "flow-master-records",
  "flow-master-streaks",
];

const IDB_KEYS = [
  "flow-master-history",
  "flow-master-game-state",
];

export async function exportSaveData(): Promise<string> {
  const localData: Record<string, string> = {};
  for (const key of STORAGE_KEYS) {
    const val = localStorage.getItem(key);
    if (val) localData[key] = val;
  }

  const idbData: Record<string, unknown> = {};
  try {
    const allKeys = await idbKeys();
    for (const key of allKeys) {
      const strKey = String(key);
      if (IDB_KEYS.includes(strKey) || strKey.startsWith("flow-master-")) {
        idbData[strKey] = await idbGet(key);
      }
    }
  } catch {
    // IDB might not be available
  }

  const bundle: SaveBundle = {
    version: 1,
    timestamp: Date.now(),
    localStorage: localData,
    indexedDB: idbData,
  };

  return JSON.stringify(bundle, null, 2);
}

export async function importSaveData(json: string): Promise<boolean> {
  try {
    const bundle = JSON.parse(json) as SaveBundle;
    if (bundle.version !== 1) return false;

    for (const [key, value] of Object.entries(bundle.localStorage)) {
      if (key.startsWith("flow-master-")) {
        localStorage.setItem(key, value);
      }
    }

    for (const [key, value] of Object.entries(bundle.indexedDB)) {
      if (key.startsWith("flow-master-")) {
        await idbSet(key, value);
      }
    }

    return true;
  } catch {
    return false;
  }
}
