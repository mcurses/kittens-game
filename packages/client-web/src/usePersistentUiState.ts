import React from "react";

export function usePersistentUiState<T>(
  key: string,
  defaultValue: T,
  isValid?: (value: unknown) => value is T,
): readonly [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = React.useState<T>(() =>
    readStoredValue(key, defaultValue, isValid ?? createDefaultValidator(defaultValue)),
  );

  React.useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

function readStoredValue<T>(
  key: string,
  defaultValue: T,
  isValid: (value: unknown) => value is T,
): T {
  const raw = window.localStorage.getItem(key);
  if (raw === null) {
    return defaultValue;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isValid(parsed) ? parsed : defaultValue;
  } catch {
    return defaultValue;
  }
}

function createDefaultValidator<T>(defaultValue: T): (value: unknown) => value is T {
  if (typeof defaultValue === "boolean") {
    return (value: unknown): value is T => typeof value === "boolean";
  }
  if (typeof defaultValue === "string") {
    return (value: unknown): value is T => typeof value === "string";
  }
  if (typeof defaultValue === "number") {
    return (value: unknown): value is T => typeof value === "number";
  }
  return (_value: unknown): _value is T => true;
}
