// Test stand-in for firebase/firestore. Used only by `npm test`, never by the app.
// In-memory stand-in for firebase/firestore with real transaction semantics:
// reads before writes, writes applied atomically at commit, and automatic
// retry when a document read by the transaction changed in the meantime.
export class Timestamp {
  constructor(public ms: number) {}
  toDate() { return new Date(this.ms); }
}
const SERVER_TS = { __serverTimestamp: true };
export const serverTimestamp = () => SERVER_TS;

type Doc = { data: Record<string, unknown>; version: number };
export const store = new Map<string, Doc>();
let clock = 1_700_000_000_000;
let idCounter = 0;
const tick = () => new Promise((r) => setTimeout(r, Math.random() * 5));

function resolveValues(data: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) out[k] = v === SERVER_TS ? new Timestamp(clock += 1000) : v;
  return out;
}
class FsError extends Error { constructor(public code: string, msg: string) { super(msg); } }

export const collection = (_db: unknown, ...segs: string[]) => ({ type: 'collection', path: segs.join('/') });
export function doc(parent: any, ...segs: string[]) {
  if (parent && parent.type === 'collection' && segs.length === 0) {
    const id = `auto${++idCounter}`;
    return { type: 'doc', path: `${parent.path}/${id}`, id };
  }
  const path = segs.join('/');
  return { type: 'doc', path, id: segs[segs.length - 1] };
}
const snap = (ref: any) => {
  const d = store.get(ref.path);
  return { id: ref.id, exists: () => !!d, data: () => (d ? { ...d.data } : undefined) };
};
function write(path: string, data: Record<string, unknown> | null, merge = false) {
  if (data === null) { store.delete(path); return; }
  const prev = store.get(path);
  const next = merge && prev ? { ...prev.data, ...resolveValues(data) } : resolveValues(data);
  store.set(path, { data: next, version: (prev?.version ?? 0) + 1 });
}
export async function setDoc(ref: any, data: any) { await tick(); write(ref.path, data); }
export async function updateDoc(ref: any, data: any) {
  await tick();
  if (!store.has(ref.path)) throw new FsError('not-found', `No document to update: ${ref.path}`);
  write(ref.path, data, true);
}
export async function deleteDoc(ref: any) { await tick(); write(ref.path, null); }
export function writeBatch() {
  const ops: Array<() => void> = [];
  return {
    delete: (ref: any) => ops.push(() => write(ref.path, null)),
    set: (ref: any, d: any) => ops.push(() => write(ref.path, d)),
    update: (ref: any, d: any) => ops.push(() => write(ref.path, d, true)),
    commit: async () => { await tick(); ops.forEach((op) => op()); },
  };
}
export const stats = { transactionRetries: 0 };
export async function runTransaction(_db: unknown, fn: (t: any) => Promise<unknown>) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const reads = new Map<string, number>();
    const ops: Array<() => void> = [];
    const t = {
      get: async (ref: any) => {
        if (ops.length) throw new Error('Firestore transactions require all reads before writes');
        await tick();
        reads.set(ref.path, store.get(ref.path)?.version ?? 0);
        return snap(ref);
      },
      set: (ref: any, d: any) => { ops.push(() => write(ref.path, d)); return t; },
      update: (ref: any, d: any) => {
        ops.push(() => {
          if (!store.has(ref.path)) throw new FsError('not-found', 'update on missing doc');
          write(ref.path, d, true);
        });
        return t;
      },
      delete: (ref: any) => { ops.push(() => write(ref.path, null)); return t; },
    };
    const result = await fn(t); // errors thrown by fn abort the transaction (no writes)
    await tick();
    const conflict = [...reads].some(([p, v]) => (store.get(p)?.version ?? 0) !== v);
    if (conflict) { stats.transactionRetries++; continue; }
    ops.forEach((op) => op()); // atomic commit
    return result;
  }
  throw new FsError('aborted', 'Too much contention');
}
export const onSnapshot = () => () => {};
export const query = (...a: unknown[]) => a[0];
export const where = () => null;
export const orderBy = () => null;
