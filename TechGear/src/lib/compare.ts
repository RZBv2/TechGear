const KEY = "techgear_compare_products";
const EVENT = "techgear:compare-updated";
const MAX_COMPARE = 4;

function readIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(value)
      ? value
          .filter((id): id is string => typeof id === "string")
          .slice(0, MAX_COMPARE)
      : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(ids.slice(0, MAX_COMPARE)));
  window.dispatchEvent(new Event(EVENT));
}

export function getCompareIds() {
  return readIds();
}
export function isCompared(id: string) {
  return readIds().includes(id);
}
export function toggleCompare(id: string) {
  const ids = readIds();
  if (ids.includes(id)) {
    writeIds(ids.filter((item) => item !== id));
    return { added: false, limitReached: false };
  }
  if (ids.length >= MAX_COMPARE) return { added: false, limitReached: true };
  writeIds([...ids, id]);
  return { added: true, limitReached: false };
}
export function removeCompare(id: string) {
  writeIds(readIds().filter((item) => item !== id));
}
export function clearCompare() {
  writeIds([]);
}
export function subscribeCompare(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const onChange = () => listener();
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
