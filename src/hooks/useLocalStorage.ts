import { useState, useCallback } from "react";

/**
 * Custom hook to persist state in localStorage
 * @param key - The localStorage key
 * @param initialValue - Initial value if no stored value exists
 * @returns Tuple of [storedValue, setValue, removeValue]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Get initial value from localStorage or use provided initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;
      try {
        return JSON.parse(item) as T;
      } catch {
        // Keep compatibility with values written by older non-JSON clients.
        return (typeof initialValue === "string" ? item : initialValue) as T;
      }
    } catch {
      return initialValue;
    }
  });

  // Persist value to localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue((prevStoredValue) => {
          const valueToStore =
            value instanceof Function ? value(prevStoredValue) : value;
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          return valueToStore;
        });
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key]
  );

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
