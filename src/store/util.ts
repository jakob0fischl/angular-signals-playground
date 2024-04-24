

export function shallow<T>(objA: T, objB: T): boolean {
  if (Object.is(objA, objB)) {
    return true;
  }

  if (
    objA == null ||
    objB == null ||
    typeof objA !== 'object' ||
    typeof objB !== 'object'
  ) {
    return false;
  }

  const keysA = Object.keys(objA);
  if (keysA.length !== Object.keys(objB).length) {
    return false;
  }

  for (const key of keysA) {
    if (
      !Object.prototype.hasOwnProperty.call(objB, key) ||
      !Object.is(objA[key as keyof T], objB[key as keyof T])
    ) {
      return false;
    }
  }
  return true;
}
