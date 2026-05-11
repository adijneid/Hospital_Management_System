import { Transform } from 'class-transformer';

/**
 * Coerces empty-string payload values (`""`) to `undefined` before validation
 * runs. Combined with `@IsOptional()`, this lets `@IsUUID()` / `@IsEmail()` /
 * `@IsDateString()` / `@IsIn(...)` and friends accept "field omitted" as well
 * as "field empty" — which is what HTML forms typically send for unselected
 * dropdowns or unfilled text inputs.
 *
 * Apply BEFORE `@IsOptional()`:
 *   @EmptyToUndefined()
 *   @IsOptional()
 *   @IsUUID()
 *   room_id?: string;
 */
export function EmptyToUndefined() {
  return Transform(({ value }) => (value === '' ? undefined : value));
}
