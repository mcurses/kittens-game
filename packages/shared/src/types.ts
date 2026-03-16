/**
 * Core shared types used across all packages.
 * Keep this file free of any business logic.
 */

/** Opaque brand helper — use to create nominal types */
export type Brand<T, B extends string> = T & { readonly __brand: B };

/** Tick number — monotonically increasing integer */
export type Tick = Brand<number, "Tick">;

/** ISO 8601 timestamp string */
export type ISOTimestamp = Brand<string, "ISOTimestamp">;

/** A plain-object game snapshot safe to JSON-serialize */
export type Serializable =
  | null
  | boolean
  | number
  | string
  | Serializable[]
  | { [key: string]: Serializable };
