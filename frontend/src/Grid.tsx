import React, { useEffect, useCallback, useState } from "react";
import "./Grid.css";
import "./Crossword.css";

import { WriteMode } from "./Crossword";

// Define array type that only accepts a specified number of elements
// https://stackoverflow.com/a/59906630
type ArrayLengthMutationKeys = 'splice' | 'push' | 'pop' | 'shift' | 'unshift' | number
type ArrayItems<T extends Array<any>> = T extends Array<infer TItems> ? TItems : never
type FixedLengthArray<T extends any[]> =
  Pick<T, Exclude<keyof T, ArrayLengthMutationKeys>>
  & { [Symbol.iterator]: () => IterableIterator<ArrayItems<T>> }

export type Vec2 = FixedLengthArray<[number, number]>
export type Vec3 = FixedLengthArray<[number, number, number]>
export type Vec4 = FixedLengthArray<[number, number, number, number]>

interface GridProps {
  squares: {
    medianLen: number,
    grid: Square[][],
  };
  letters: LetterType[];
  cursorPosition: Vec2;
  writeMode: WriteMode;
  showCursor: boolean;
  width: number;
  height: number;
}

const Grid: React.FC<GridProps> = (props) => {
  const [letterCanvas, setLetterCanvas] = useState<HTMLCanvasElement>();
  const [cursorCanvas, setCursorCanvas] = useState<HTMLCanvasElement>();
  const [letterContext, setLetterContext] = useState<CanvasRenderingContext2D>();
  const [cursorContext, setCursorContext] = useState<CanvasRenderingContext2D>();

  const letterCanvasInitializer = useCallback(
    (canvas) => {
      if (canvas !== null && canvas.getContext) {
        const letterContext = canvas.getContext("2d");
        letterContext.font = `bold ${props.squares.medianLen}px sans`;
        letterContext.textAlign = "center";

        setLetterContext(letterContext);
        setLetterCanvas(canvas);
      }
    },
    [props.squares.medianLen]
  );

  const cursorCanvasInitializer = useCallback((canvas) => {
    if (canvas !== null && canvas.getContext) {
      const context = canvas.getContext("2d");
      context.lineWidth = 3;
      setCursorContext(context);
      setCursorCanvas(canvas);
    }
  }, []);

  const letterReady = useCallback(() => letterCanvas && letterContext, [
    letterCanvas,
    letterContext
  ]);
  const cursorReady = useCallback(() => cursorCanvas && cursorContext, [
    cursorCanvas,
    cursorContext
  ]);

  const drawCursor = useCallback(() => {
    if (cursorContext !== undefined && cursorContext !== null) {
      const sq =
        props.squares.grid[props.cursorPosition[0]][props.cursorPosition[1]];
      const [x, y, w, h] = sq.c;

      const style = sq.t ? "rgb(255,0,0)" : "rgb(0,255,0)";
      cursorContext.strokeStyle = style;
      cursorContext.fillStyle = style;
      cursorContext.strokeRect(x, y, w, h);

      if (props.writeMode !== WriteMode.STATIONARY) {
        const base = 0.27 * props.squares.medianLen;
        const height = 0.21 * props.squares.medianLen;
        if (props.writeMode === WriteMode.RIGHT) {
          cursorContext.beginPath();
          cursorContext.moveTo(x + w, y + h / 2 - base);
          cursorContext.lineTo(x + w + height, y + h / 2);
          cursorContext.lineTo(x + w, y + h / 2 + base);
          cursorContext.fill();
        } else if (props.writeMode === WriteMode.DOWN) {
          cursorContext.beginPath();
          cursorContext.moveTo(x + w / 2 - base, y + h);
          cursorContext.lineTo(x + w / 2, y + h + height);
          cursorContext.lineTo(x + w / 2 + base, y + h);
          cursorContext.fill();
        }
      }
    }
  }, [
    cursorContext,
    props.squares.grid,
    props.cursorPosition,
    props.writeMode,
    props.squares.medianLen
  ]);

  useEffect(() => {
    if (!cursorReady()) {
      return;
    }
    if (cursorContext && cursorCanvas) {
      cursorContext.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
    }
    if (props.showCursor) drawCursor();
  }, [
    props.cursorPosition,
    props.showCursor,
    cursorCanvas,
    cursorContext,
    drawCursor,
    cursorReady
  ]);

  useEffect(() => {
    if (!letterReady()) {
      return;
    }
    const getSq = (r: number, c: number) => props.squares.grid[r][c];

    props.letters.forEach(({ letter, row, column }) => {
      if (letterContext) {
        const sq: Square = getSq(row, column);
        const [x, y, w, h] = sq.c;

        letterContext.globalCompositeOperation = "destination-out";
        letterContext.fillRect(x, y, w, h);
        letterContext.globalCompositeOperation = "source-over";

        if (letter && !sq.t) {
          letterContext.fillText(
            letter,
            x + w / 2,
            y + h - 0.14 * props.squares.medianLen
          );
        }
      } else {
        console.log("Could not find letter context.")
      }
    });
  }, [props.letters, letterContext, letterReady, letterCanvas, props.squares]);

  return (
    <div className="crossword">
      <canvas
        width={props.width}
        height={props.height}
        ref={letterCanvasInitializer}
        className="grid"
      ></canvas>
      <canvas
        width={props.width}
        height={props.height}
        ref={cursorCanvasInitializer}
        className="grid"
      ></canvas>
    </div>
  );
};

export default Grid;

export type Square = {
  c: Vec4, // [x, y, width, height]
  t: 0 | 1 // fillable or not
}

export const createCoordinateGrid = (squares: Square[][]): number[][] => {
  const grid: number[][] = [];
  let idx = 0;
  squares.forEach((row) => {
    grid.push([]);
    row.forEach((_) => {
      grid[grid.length - 1].push(idx);
      idx += 1;
    });
  });
  return grid;
};

export type LetterType = { letter: string, row: number, column: number }

export const createLetterArray = (squares: Square[][]) => {
  const arr: LetterType[] = [];

  squares.forEach((rowArr, row) => {
    rowArr.forEach((_, column) => {
      arr.push({ letter: "", row, column });
    });
  });
  return arr;
};
