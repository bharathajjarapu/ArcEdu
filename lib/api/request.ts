const DEFAULT_MAX_BODY_CHARS = 80_000;

export async function readJsonBody(
  request: Request,
  maxBodyChars: number = DEFAULT_MAX_BODY_CHARS,
): Promise<any> {
  const raw = await request.text();
  if (!raw.trim()) {
    throw new Error("Invalid JSON body");
  }
  if (raw.length > maxBodyChars) {
    throw new Error("Request body too large");
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON body");
  }
}

export function asString(
  value: unknown,
  maxLength: number,
  fieldName: string,
  { optional = false, trim = true }: { optional?: boolean; trim?: boolean } = {},
): string {
  if (value == null) {
    if (optional) return "";
    throw new Error(`${fieldName} is required`);
  }

  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string`);
  }

  const normalized = trim ? value.trim() : value;
  if (!optional && normalized.length === 0) {
    throw new Error(`${fieldName} is required`);
  }
  if (normalized.length > maxLength) {
    throw new Error(`${fieldName} is too long`);
  }

  return normalized;
}

export function asNumber(
  value: unknown,
  fieldName: string,
  {
    fallback,
    min,
    max,
    integer = true,
  }: {
    fallback: number;
    min: number;
    max: number;
    integer?: boolean;
  },
): number {
  const normalized = value == null ? fallback : Number(value);
  if (!Number.isFinite(normalized)) {
    throw new Error(`${fieldName} must be a number`);
  }
  if (integer && !Number.isInteger(normalized)) {
    throw new Error(`${fieldName} must be an integer`);
  }
  if (normalized < min || normalized > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}`);
  }
  return normalized;
}

export function asBoolean(value: unknown): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") {
    throw new Error("Boolean flags must be true or false");
  }
  return value;
}

export function asEnum<T extends string>(
  value: unknown,
  values: readonly T[],
  fallback: T,
  fieldName: string,
): T {
  if (value == null || value === "") return fallback;
  if (typeof value !== "string" || !values.includes(value as T)) {
    throw new Error(`${fieldName} is invalid`);
  }
  return value as T;
}
