import React, { useEffect, useCallback, useState } from "react";
import { squares, medianSquareSize } from "./squares";

const Grid = (props) => {
  const [letterCanvas, setLetterCanvas] = useState(null);
  const [cursorCanvas, setCursorCanvas] = useState(null);
  const [letterContext, setLetterContext] = useState(null);
  const [cursorContext, setCursorContext] = useState(null);

  const letterCanvasInitializer = useCallback((canvas) => {
    if (canvas === null || !canvas.getContext) {
      return;
    }

    const letterContext = canvas.getContext("2d");
    letterContext.font = `bold ${medianSquareSize}px sans`;
    letterContext.textAlign = "center";

    setLetterContext(letterContext);
    setLetterCanvas(canvas);
  }, []);

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

  const drawCursor = useCallback(
    (rc) => {
      const sq = squares[rc[0]][rc[1]];
      const [x, y, w, h] = sq.c;
      if (sq.t) {
        cursorContext.strokeStyle = "rgb(255, 0, 0)";
      } else {
        cursorContext.strokeStyle = "rgb(0, 255, 0)";
      }
      cursorContext.strokeRect(x, y, w, h);
      cursorContext.strokeStyle = "rgb(0, 0, 0)";
    },
    [cursorContext]
  );

  useEffect(() => {
    if (!cursorReady()) {
      return;
    }
    cursorContext.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
    if (props.showCursor) drawCursor(props.cursorPosition);
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

    const getSq = (r, c) => squares[r][c];
    props.letters.forEach(({ letter, row, column }) => {
      const sq = getSq(row, column); // squares[r][c].c;
      const [x, y, w, h] = sq.c;

      letterContext.globalCompositeOperation = "destination-out";
      letterContext.fillRect(x, y, w, h);
      letterContext.globalCompositeOperation = "source-over";

      if (letter && !sq.t) {
        letterContext.fillText(
          letter,
          x + w / 2,
          y + h - 0.14 * medianSquareSize
        );
      }
    });
  }, [props.letters, letterContext, letterReady]);

  return (
    <div>
      <canvas
        width={1193}
        height={1664}
        ref={letterCanvasInitializer}
        className="crossword"
      ></canvas>
      <canvas
        width={1193}
        height={1664}
        ref={cursorCanvasInitializer}
        className="crossword"
      ></canvas>
    </div>
  );
};

export default Grid;
