import React, { useEffect, useRef } from "react";
import { useCallback } from "react";
import { useState } from "react";

import "./Crossword.css";
import { useApi } from "./api";
import { squares, createLetterArr, createCoordGrid } from "./squares";

const coordGrid = createCoordGrid();

const ERASERSIZE = 12;
const BRUSHSIZE = 4;

const DRAW = 0;
const WRITE = 1;

const Crossword = (props) => {
  const [canvas, setCanvas] = useState(null);
  const [context, setContext] = useState(null);

  const [readyState, onExternalDraw, sendEvent] = useApi(props.url);

  const [mode, setMode] = useState(WRITE);

  const [cursorRC, setCursorRC] = useState([0, 0]);
  const [letters, setLetters] = useState(createLetterArr());

  const backgroundInitializer = useCallback(
    (backgroundCanvas) => {
      if (backgroundCanvas === null || !backgroundCanvas.getContext) {
        return;
      }
      const context = backgroundCanvas.getContext("2d");
      context.drawImage(props.image, 0, 0);
    },
    [props.image]
  );

  const canvasInitializer = useCallback((canvas) => {
    if (canvas === null || !canvas.getContext) {
      return;
    }
    setContext(canvas.getContext("2d"));
    setCanvas(canvas);
  }, []);

  const cursorKey = (key) => {
    let newRC = [...cursorRC];

    if (key === "ArrowDown" || key === "Down") {
      newRC[0] += 1;
    } else if (key === "ArrowUp" || key === "Up") {
      newRC[0] -= 1;
    } else if (key === "ArrowLeft" || key === "Left") {
      newRC[1] -= 1;
    } else if (key === "ArrowRight" || key === "Right") {
      newRC[1] += 1;
    } else {
      return false;
    }

    setCursorRC(newRC);
    return true;
  };

  const escSwitchMode = (key) => {
    if (key === "Escape" || key === "Esc") {
      setMode(DRAW);
      return true;
    }

    return false;
  };

  const letterKey = (key) => {
    const newLetters = [...letters];
    newLetters[coordGrid[cursorRC[0]][cursorRC[1]]].l = key;
    setLetters(newLetters);

    return true;
  };

  useEffect(() => {
    if (!canvas || !context || readyState !== WebSocket.OPEN) {
      return;
    }

    const getMouseLocation = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      return [x, y];
    };

    let isDrawing = false;
    let lastTo = [-1, -1];

    const handleKey = (event) => {
      console.log(event.key);

      if (mode == DRAW) {
        if (event.key === "Enter") {
          setMode(WRITE);
        } else if (event.key === "e") {
          selectEraser();
          console.log("eraser selected");
        } else if (event.key === "b") {
          selectBrush();
          console.log("brush selected");
        }
      } else {
        cursorKey(event.key) ||
          escSwitchMode(event.key) ||
          letterKey(event.key);
      }
    };

    const selectEraser = () => {
      context.globalCompositeOperation = "destination-out";
      context.lineWidth = ERASERSIZE;
    };

    const selectBrush = () => {
      context.globalCompositeOperation = "source-over";
      context.lineWidth = BRUSHSIZE;
    };

    let unsentDrawingEvents = [];

    const startDrawing = (event) => {
      const [x, y] = getMouseLocation(event);
      context.moveTo(x, y);
      lastTo = [x, y];
      context.beginPath();
      isDrawing = true;
      unsentDrawingEvents.push({
        x,
        y,
        globalCompositeOperation: context.globalCompositeOperation,
        lineWidth: context.lineWidth,
        action: "START_DRAWING"
      });
    };

    const draw = (event) => {
      if (!isDrawing) {
        return;
      }
      const [x, y] = getMouseLocation(event);
      context.lineTo(x, y);
      lastTo = [x, y];
      context.stroke();
      unsentDrawingEvents.push({
        x,
        y,
        globalCompositeOperation: context.globalCompositeOperation,
        lineWidth: context.lineWidth,
        action: "DRAWING"
      });
    };

    let batchedExternalDrawEvents = [];

    const flushExternalDrawingEvents = () => {
      const currentGlobalCompositeOperation = context.globalCompositeOperation;
      const currentLineWidth = context.lineWidth;
      batchedExternalDrawEvents.forEach((drawingEvent) => {
        const {
          x,
          y,
          globalCompositeOperation,
          lineWidth,
          action
        } = drawingEvent;
        context.globalCompositeOperation = globalCompositeOperation;
        context.lineWidth = lineWidth;
        if (action === "DRAWING") {
          context.lineTo(x, y);
          context.stroke();
        } else if (action === "START_DRAWING") {
          context.moveTo(x, y);
          context.beginPath();
        }
      });
      context.stroke();
      context.globalCompositeOperation = currentGlobalCompositeOperation;
      context.lineWidth = currentLineWidth;
      const [lastX, lastY] = lastTo;
      context.moveTo(lastX, lastY);
      batchedExternalDrawEvents = [];
    };

    const stopDrawing = () => {
      isDrawing = false;
      if (batchedExternalDrawEvents.length > 0) {
        flushExternalDrawingEvents();
      }
      sendEvent({
        action: "DRAWING_EVENTS",
        drawingEvents: unsentDrawingEvents
      });
      unsentDrawingEvents = [];
    };

    const handleExternalDrawing = (drawingEvents) => {
      drawingEvents.forEach((drawingEvent) => {
        batchedExternalDrawEvents.push(drawingEvent);
      });
      if (!isDrawing) {
        flushExternalDrawingEvents();
      }
    };

    selectBrush();

    onExternalDraw.current = handleExternalDrawing;

    window.onkeyup = handleKey;
    canvas.onmousedown = startDrawing;
    canvas.onmousemove = draw;
    canvas.onmouseup = stopDrawing;
  }, [canvas, context, readyState, sendEvent, onExternalDraw]);

  return (
    <div>
      <canvas
        width={1193}
        height={1664}
        ref={backgroundInitializer}
        className="crossword"
      ></canvas>
      <Grid cursorRC={cursorRC} letters={letters} showCursor={mode === WRITE} />
      <canvas
        width={1193}
        height={1664}
        ref={canvasInitializer}
        className="crossword"
      ></canvas>
    </div>
  );
};

const Grid = (props) => {
  const [letterCanvas, setLetterCanvas] = useState(null);
  const [cursorCanvas, setCursorCanvas] = useState(null);
  const [letterContext, setLetterContext] = useState(null);
  const [cursorContext, setCursorContext] = useState(null);

  const letterCanvasInitializer = useCallback((canvas) => {
    if (canvas === null || !canvas.getContext) {
      return;
    }
    setLetterContext(canvas.getContext("2d"));
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
        letterContext.font = "48px serif";
        letterContext.fillText(l, x, y + h);
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

export default Crossword;
