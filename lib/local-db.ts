import type {
  BodyMetricRecord,
  ExerciseLogRecord,
  FoodLogRecord,
  GoalRecord,
  ReportSnapshotRecord,
  SleepLogRecord,
  UserProfileRecord
} from "@/lib/local-types";

const DB_NAME = "health-tracker-local";
const DB_VERSION = 1;

const STORES = {
  profile: "profile",
  goals: "goals",
  foodLogs: "food_logs",
  exerciseLogs: "exercise_logs",
  sleepLogs: "sleep_logs",
  bodyMetrics: "body_metrics",
  reports: "report_snapshots"
} as const;

type StoreMap = {
  [STORES.profile]: UserProfileRecord;
  [STORES.goals]: GoalRecord;
  [STORES.foodLogs]: FoodLogRecord;
  [STORES.exerciseLogs]: ExerciseLogRecord;
  [STORES.sleepLogs]: SleepLogRecord;
  [STORES.bodyMetrics]: BodyMetricRecord;
  [STORES.reports]: ReportSnapshotRecord;
};

type StoreName = keyof StoreMap;
type RecordForStore<S extends StoreName> = StoreMap[S];

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available in this environment."));
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      const names = Object.values(STORES);
      for (const name of names) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: "id" });
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB."));
  });

  return dbPromise;
}

function txPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

function transactionComplete(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed."));
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted."));
  });
}

export async function getAllRecords<S extends StoreName>(storeName: S): Promise<Array<RecordForStore<S>>> {
  const db = await openDatabase();
  const tx = db.transaction(storeName, "readonly");
  const store = tx.objectStore(storeName);
  const request = store.getAll();
  const result = await txPromise(request);
  await transactionComplete(tx);
  return result as Array<RecordForStore<S>>;
}

export async function putRecord<S extends StoreName>(
  storeName: S,
  value: RecordForStore<S>
): Promise<RecordForStore<S>> {
  const db = await openDatabase();
  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  store.put(value);
  await transactionComplete(tx);
  return value;
}

export async function putRecords<S extends StoreName>(
  storeName: S,
  values: Array<RecordForStore<S>>
): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  for (const value of values) {
    store.put(value);
  }
  await transactionComplete(tx);
}

export async function getRecordById<S extends StoreName>(
  storeName: S,
  id: string
): Promise<RecordForStore<S> | null> {
  const db = await openDatabase();
  const tx = db.transaction(storeName, "readonly");
  const store = tx.objectStore(storeName);
  const request = store.get(id);
  const result = await txPromise(request);
  await transactionComplete(tx);
  return (result as RecordForStore<S> | undefined) ?? null;
}

export async function deleteRecord<S extends StoreName>(storeName: S, id: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  store.delete(id);
  await transactionComplete(tx);
}

export async function clearStore<S extends StoreName>(storeName: S): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  store.clear();
  await transactionComplete(tx);
}

export const LocalStores = STORES;
