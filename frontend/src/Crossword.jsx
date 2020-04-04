import React, { useEffect } from "react";
import { useCallback } from "react";
import { useState } from "react";

import "./Crossword.css";
import { useApi } from "./api";
import { squares, createLetterArr, createCoordGrid } from "./squares";

import Grid from "./Grid.jsx";

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

  const cursorKey = useCallback(
    (key) => {
      let [r, c] = cursorRC;

      if (key === "ArrowDown" || key === "Down") {
        r += 1;
      } else if (key === "ArrowUp" || key === "Up") {
        r -= 1;
      } else if (key === "ArrowLeft" || key === "Left") {
        c -= 1;
      } else if (key === "ArrowRight" || key === "Right") {
        c += 1;
      } else {
        return false;
      }

      if (r >= 0 && r < squares.length && c >= 0 && c < squares[r].length)
        setCursorRC([r, c]);
      return true;
    },
    [cursorRC]
  );

  const escSwitchMode = (key) => {
    if (key === "Escape" || key === "Esc") {
      setMode(DRAW);
      return true;
    }

    return false;
  };

  const letterKey = useCallback(
    (key) => {
      const isLetter =
        key.length === 1 && key.toUpperCase().match(/[A-Z|Å|Ä|Ö]/i);
      if (isLetter) {
        const newLetters = [...letters];
        newLetters[coordGrid[cursorRC[0]][cursorRC[1]]].l = key.toUpperCase();
        setLetters(newLetters);

        return true;
      }

      return false;
    },
    [cursorRC, letters]
  );

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
      if (mode === DRAW) {
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
  }, [
    canvas,
    context,
    readyState,
    sendEvent,
    onExternalDraw,
    mode,
    letterKey,
    cursorKey
  ]);

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

export default Crossword;
