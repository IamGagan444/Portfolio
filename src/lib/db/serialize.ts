import { Types } from "mongoose";

type Serialized<T> = T extends Date
  ? string
  : T extends Types.ObjectId
    ? string
    : T extends (infer U)[]
      ? Serialized<U>[]
      : T extends object
        ? { [K in keyof T as K extends "_id" | "__v" ? never : K]: Serialized<T[K]> } & (T extends {
            _id: unknown;
          }
            ? { id: string }
            : unknown)
        : T;

/**
 * Converts a lean Mongoose document into a JSON-safe plain object:
 * `_id` → `id`, ObjectIds → strings, Dates → ISO strings, `__v` removed.
 */
export function serialize<T>(value: T): Serialized<T> {
  return convert(value) as Serialized<T>;
}

function convert(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Types.ObjectId) return value.toString();
  if (Array.isArray(value)) return value.map(convert);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (key === "__v") continue;
      if (key === "_id") {
        out.id = convert(val);
        continue;
      }
      out[key] = convert(val);
    }
    return out;
  }
  return value;
}
