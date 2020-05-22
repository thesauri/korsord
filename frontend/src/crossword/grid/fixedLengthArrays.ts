// Define array type that only accepts a specified number of elements
// https://stackoverflow.com/a/59906630
type ArrayLengthMutationKeys =
  | "splice"
  | "push"
  | "pop"
  | "shift"
  | "unshift"
  | number;
type ArrayItems<T extends Array<any>> = T extends Array<infer TItems>
  ? TItems
  : never;
type FixedLengthArray<T extends any[]> = Pick<
  T,
  Exclude<keyof T, ArrayLengthMutationKeys>
> & { [Symbol.iterator]: () => IterableIterator<ArrayItems<T>> };

export type Vec2 = FixedLengthArray<[number, number]>;
export type Vec4 = FixedLengthArray<[number, number, number, number]>;
