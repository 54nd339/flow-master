type ActionFn = (...args: never[]) => void;

const registry = new Map<string, ActionFn>();

/**
 * Register a named action. Returns a cleanup function that removes the
 * registration only if it still points to the same handler (prevents a
 * late cleanup from removing a newer registration).
 */
export function registerAction(name: string, fn: ActionFn): () => void {
  registry.set(name, fn);
  return () => {
    if (registry.get(name) === fn) registry.delete(name);
  };
}

/** Dispatch a named action. No-ops silently when nothing is registered. */
export function fireAction(name: string, ...args: unknown[]): void {
  (registry.get(name) as ((...a: unknown[]) => void) | undefined)?.(...args);
}
