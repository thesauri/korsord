export interface Crossword {
  crosswordId?: number;
  newspaper: string;
  publishedDate: string;
  imageUrl: string;
  metadataUrl: string;
}

export interface DrawingEvent {
  x: number;
  y: number;
  globalCompositeOperation: string;
  lineWidth: number;
  action: string;
}

export interface WebSocketPayload {
  action: EventTypes;
  event?: LetterType;
  drawingEvents?: DrawingEvent[];
  // TODO: implement when converting app.js to typescript
  drawingHistory?: any;
  writeHistory?: any;
}

export type EventTypes = "DRAWING_EVENTS" | "DRAWING_HISTORY" | "WRITE_HISTORY";

export type LetterType = { letter: string; row: number; column: number };

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
export type Vec3 = FixedLengthArray<[number, number, number]>;
export type Vec4 = FixedLengthArray<[number, number, number, number]>;

export type Square = {
  c: Vec4; // [x, y, width, height]
  t: 0 | 1; // fillable or not
};

export enum EditMode {
  DRAW = 0,
  WRITE = 1,
  ERASE = 2
}

export enum WriteMode {
  STATIONARY = 0,
  RIGHT = 1,
  DOWN = 2
}
