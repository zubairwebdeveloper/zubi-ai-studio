// In-memory stand-in for Firestore, used only by tests. It enforces the rules our code must respect:
// transactions need all reads before any write, and update() needs an existing document.
export const fakeIncrement = (n) => ({ __inc: n });
const withIncrements = (existing, d) => Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v && typeof v === "object" && "__inc" in v ? (existing?.[k] || 0) + v.__inc : v]));

export function fakeFirestore() {
  const store = new Map(); let auto = 0, lock = Promise.resolve();
  const ref = (col, id) => {
    const r = {
      col, id, path: `${col}/${id}`,
      get: async () => snapOf(r),
      set: async (d, o) => apply("set", r, structuredClone(d), o),
      update: async (d) => apply("update", r, structuredClone(d)),
      delete: async () => apply("delete", r),
    };
    return r;
  };
  const snapOf = (r) => ({ id: r.id, ref: r, exists: store.has(r.path), data: () => (store.has(r.path) ? structuredClone(store.get(r.path)) : undefined) });
  const cmp = { "==": (a, b) => a === b, "<": (a, b) => a < b, "<=": (a, b) => a <= b, ">=": (a, b) => a >= b };
  const apply = (kind, r, d, opts) => {
    if (kind === "delete") { store.delete(r.path); return; }
    if (kind === "update") { if (!store.has(r.path)) throw new Error(`update on missing doc ${r.path}`); store.set(r.path, { ...store.get(r.path), ...d }); return; }
    const base = opts?.merge && store.has(r.path) ? store.get(r.path) : {};
    store.set(r.path, opts?.merge ? { ...base, ...withIncrements(base, d) } : d);
  };
  function query(col, filters = [], order = null, max = Infinity) {
    return {
      where: (f, op, v) => query(col, [...filters, [f, op, v]], order, max),
      orderBy: (f, dir = "asc") => query(col, filters, [f, dir], max),
      limit: (n) => query(col, filters, order, n),
      async get() {
        let rows = [...store.entries()].filter(([p]) => p.startsWith(col + "/")).map(([p, d]) => ({ id: p.slice(col.length + 1), d }))
          .filter(({ d }) => filters.every(([f, op, v]) => typeof d[f] === typeof v && cmp[op](d[f], v)));
        // Like Firestore: a document without the ordered field is not part of an orderBy query.
        if (order) rows = rows.filter(({ d }) => d[order[0]] !== undefined);
        if (order) rows.sort((a, b) => (order[1] === "desc" ? -1 : 1) * (a.d[order[0]] < b.d[order[0]] ? -1 : a.d[order[0]] > b.d[order[0]] ? 1 : 0)); // numbers and strings
        rows = rows.slice(0, max);
        return { empty: !rows.length, size: rows.length, docs: rows.map(({ id, d }) => ({ id, exists: true, ref: ref(col, id), data: () => structuredClone(d) })) };
      },
    };
  }
  return {
    store,
    collection: (col) => ({ doc: (id = `auto${++auto}`) => ref(col, id), ...query(col) }),
    batch() {
      const ops = [];
      return {
        set: (r, d, o) => ops.push(["set", r, structuredClone(d), o]),
        update: (r, d) => ops.push(["update", r, structuredClone(d)]),
        delete: (r) => ops.push(["delete", r]),
        commit: async () => { for (const [k, r, d, o] of ops) apply(k, r, d, o); },
      };
    },
    // Serialized, like contention retries would be.
    runTransaction(fn) {
      const run = async () => {
        const writes = []; let wrote = false;
        const tx = {
          get: async (r) => { if (wrote) throw new Error("Firestore transactions require all reads before writes"); return snapOf(r); },
          set: (r, d, o) => { wrote = true; writes.push(["set", r, structuredClone(d), o]); },
          update: (r, d) => { wrote = true; writes.push(["update", r, structuredClone(d)]); },
        };
        const result = await fn(tx);
        for (const [k, r, d, o] of writes) apply(k, r, d, o);
        return result;
      };
      const p = lock.then(run); lock = p.catch(() => {}); return p;
    },
  };
}
