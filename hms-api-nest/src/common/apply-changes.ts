/**
 * Like `Object.assign(target, changes)` but skips `undefined` values so a
 * partial-update DTO doesn't blank out existing fields on the entity.
 *
 * `class-transformer` (with `transform: true` + `whitelist: true` in our
 * global ValidationPipe) instantiates the DTO with *every* declared field
 * present — fields the client didn't send come through as `undefined`. A
 * naïve `Object.assign` then overwrites those columns on the entity with
 * `undefined`, which TypeORM either persists as NULL or just leaves the
 * in-memory object inconsistent — either way, the broadcast/echo carries
 * undefined values and downstream code breaks.
 */
export function applyChanges<T extends object>(
  target: T,
  changes: Partial<T>,
): T {
  for (const [key, value] of Object.entries(changes)) {
    if (value !== undefined) {
      (target as Record<string, unknown>)[key] = value;
    }
  }
  return target;
}
