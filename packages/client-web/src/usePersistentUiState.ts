import React from "react";

export function usePersistentUiState<T>(
  key: string,
  defaultValue: T,
  isValid: (value: unknown) => value is T,
): readonly [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = React.useState<T>(() => readStoredValue(key, defaultValue, isValid));

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
