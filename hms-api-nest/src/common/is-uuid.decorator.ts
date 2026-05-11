import { Matches } from 'class-validator';

/**
 * Loose UUID format check — matches the regex NestJS's `ParseUUIDPipe` uses
 * for `version: 'all'` (hex-format only, no version-byte enforcement).
 *
 * class-validator's stock `@IsUUID()` is stricter: even with version='all' it
 * requires the version nibble to be 1-5 or 7. That rejects test-fixture UUIDs
 * like `d4000000-0000-0000-0000-000000000001` (the seed data this project
 * uses), which causes a confusing mismatch where `GET /:id` (ParseUUIDPipe)
 * accepts an id but `POST` (`@IsUUID()` in the DTO) rejects the same value.
 *
 * Use this decorator on DTO fields that accept UUIDs from path/body so the
 * format rule stays consistent across pipes and DTOs.
 */
export function IsUuid() {
  return Matches(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    { message: '$property must be a UUID' },
  );
}
