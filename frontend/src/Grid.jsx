import React, { useEffect, useCallback, useState } from "react";
import "./Grid.css";
import "./Crossword.css";

import { writeModes } from "./Crossword.jsx";

const Grid = (props) => {
  const [letterCanvas, setLetterCanvas] = useState(null);
  const [cursorCanvas, setCursorCanvas] = useState(null);
  const [letterContext, setLetterContext] = useState(null);
  const [cursorContext, setCursorContext] = useState(null);

  const letterCanvasInitializer = useCallback(
    (canvas) => {
      if (canvas === null || !canvas.getContext) {
        return;
      }

      const letterContext = canvas.getContext("2d");
      letterContext.font = `bold ${props.squares.medianLen}px sans`;
      letterContext.textAlign = "center";

      setLetterContext(letterContext);
      setLetterCanvas(canvas);
    },
    [props.squares.medianLen]
  );

  const cursorCanvasInitializer = useCallback((canvas) => {
    if (canvas === null || !canvas.getContext) {
      return;
    }
    const context = canvas.getContext("2d");
    context.lineWidth = 3;
    setCursorContext(context);
    setCursorCanvas(canvas);
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
    const sq =
      props.squares.grid[props.cursorPosition[0]][props.cursorPosition[1]];
    const [x, y, w, h] = sq.c;

    const style = sq.t ? "rgb(255, 0, 0)" : "rgb(0, 255, 0)";
    cursorContext.strokeStyle = style;
    cursorContext.fillStyle = style;
    cursorContext.strokeRect(x, y, w, h);

    if (props.writeMode !== writeModes.STATIONARY) {
      const base = 0.27 * props.squares.medianLen;
      const height = 0.21 * props.squares.medianLen;
      if (props.writeMode === writeModes.RIGHT) {
        cursorContext.beginPath();
        cursorContext.moveTo(x + w, y + h / 2 - base);
        cursorContext.lineTo(x + w + height, y + h / 2);
        cursorContext.lineTo(x + w, y + h / 2 + base);
        cursorContext.fill();
      } else if (props.writeMode === writeModes.DOWN) {
        cursorContext.beginPath();
        cursorContext.moveTo(x + w / 2 - base, y + h);
        cursorContext.lineTo(x + w / 2, y + h + height);
        cursorContext.lineTo(x + w / 2 + base, y + h);
        cursorContext.fill();
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
    cursorContext.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
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

    const getSq = (r, c) => props.squares.grid[r][c];
    props.letters.forEach(({ letter, row, column }) => {
      const sq = getSq(row, column);
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

export const createCoordinateGrid = (squares) => {
  const grid = [];
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

export const createLetterArray = (squares) => {
  const arr = [];

  squares.forEach((rowArr, row) => {
    rowArr.forEach((_, column) => {
      arr.push({ letter: "", row, column });
    });
  });

  return arr;
};
