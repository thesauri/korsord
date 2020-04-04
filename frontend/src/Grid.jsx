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

  const letterReady = () => letterCanvas && letterContext;
  const cursorReady = () => cursorCanvas && cursorContext;

  const drawCursor = (rc) => {
    const sq = squares[rc[0]][rc[1]];
    const [x, y, w, h] = sq.c;
    if (sq.t) {
      cursorContext.strokeStyle = "rgb(255, 0, 0)";
    } else {
      cursorContext.strokeStyle = "rgb(0, 255, 0)";
    }
    cursorContext.strokeRect(x, y, w, h);
    cursorContext.strokeStyle = "rgb(0, 0, 0)";
  };

  useEffect(() => {
    if (!cursorReady()) {
      return;
    }
    cursorContext.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
    if (props.showCursor) drawCursor(props.cursorRC);
  }, [props.cursorRC, props.showCursor]);

  useEffect(() => {
    if (!letterReady()) {
      return;
    }

    const getSq = (r, c) => squares[r][c];
    props.letters.forEach(({ l, r, c }) => {
      const sq = getSq(r, c);
      const [x, y, w, h] = sq.c; // squares[r][c].c;

      letterContext.globalCompositeOperation = "destination-out";
      letterContext.fillRect(x, y, w, h);
      letterContext.globalCompositeOperation = "source-over";

      if (l && !sq.t) {
        letterContext.fillText(l, x + w / 2, y + h - 5);
      }
    });
  }, [props.letters]);

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
