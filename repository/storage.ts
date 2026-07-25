import AsyncStorage from '@react-native-async-storage/async-storage';

type Validator<T> = (value: unknown) => value is T;

const pendingWrites = new Map<string, Promise<unknown>>();

export async function readCollection<T>(key: string, isItem: Validator<T>): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  if (raw === null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Stored clinic data could not be read.');
  }

  if (!Array.isArray(parsed) || !parsed.every(isItem)) {
    throw new Error('Stored clinic data has an unsupported format.');
  }
  return parsed;
}

export function mutateCollection<T, Result>(
  key: string,
  isItem: Validator<T>,
  mutation: (items: T[]) => { items: T[]; result: Result },
): Promise<Result> {
  const previous = pendingWrites.get(key) ?? Promise.resolve();
  const task = previous
    .catch(() => undefined)
    .then(async () => {
      const current = await readCollection(key, isItem);
      const { items, result } = mutation(current);
      await AsyncStorage.setItem(key, JSON.stringify(items));
      return result;
    });

  pendingWrites.set(key, task);
  void task.finally(() => {
    if (pendingWrites.get(key) === task) pendingWrites.delete(key);
  });
  return task;
}
