import AsyncStorage from '@react-native-async-storage/async-storage';

type Validator<T> = (value: unknown) => value is T;

const pendingWrites = new Map<string, Promise<unknown>>();

export async function readCollection<T>(key: string, isItem: Validator<T>): Promise<T[]> {
  console.log(`[storage.readCollection] Reading from key: ${key}`);
  const raw = await AsyncStorage.getItem(key);
  console.log(`[storage.readCollection] Raw storage value for ${key}:`, raw ? `[${raw.length} chars]` : 'null');
  
  if (raw === null) {
    console.log(`[storage.readCollection] No data found for ${key}, returning empty array`);
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error(`[storage.readCollection] Failed to parse JSON for ${key}`);
    throw new Error('Stored clinic data could not be read.');
  }

  if (!Array.isArray(parsed)) {
    console.error(`[storage.readCollection] Parsed data is not an array for ${key}:`, typeof parsed);
    throw new Error('Stored clinic data has an unsupported format.');
  }
  
  const validItems = parsed.filter(isItem);
  console.log(`[storage.readCollection] Validated items for ${key}: ${validItems.length}/${parsed.length}`);
  
  if (validItems.length !== parsed.length) {
    console.warn(`[storage.readCollection] Some items failed validation for ${key}. Invalid items:`, 
      parsed.filter(item => !isItem(item)));
  }
  
  return validItems;
}

export function mutateCollection<T, Result>(
  key: string,
  isItem: Validator<T>,
  mutation: (items: T[]) => { items: T[]; result: Result },
): Promise<Result> {
  console.log(`[storage.mutateCollection] Starting mutation for key: ${key}`);
  const previous = pendingWrites.get(key) ?? Promise.resolve();
  const task = previous
    .catch(() => undefined)
    .then(async () => {
      const current = await readCollection(key, isItem);
      console.log(`[storage.mutateCollection] Current items for ${key}: ${current.length}`);
      const { items, result } = mutation(current);
      console.log(`[storage.mutateCollection] After mutation for ${key}: ${items.length} items`);
      await AsyncStorage.setItem(key, JSON.stringify(items));
      console.log(`[storage.mutateCollection] Saved ${items.length} items to ${key}`);
      return result;
    });

  pendingWrites.set(key, task);
  void task.finally(() => {
    if (pendingWrites.get(key) === task) pendingWrites.delete(key);
  });
  return task;
}
