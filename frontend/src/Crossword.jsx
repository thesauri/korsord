import React, { useEffect } from "react";
import { useCallback } from "react";
import { useState } from "react";

import "./Crossword.css";
import { useApi } from "./api";
import { squares, createLetterArray, createCoordinateGrid } from "./squares";

import Grid from "./Grid.jsx";
import Sidebar from "./Sidebar.jsx"

const coordGrid = createCoordinateGrid();

const ERASERSIZE = 12;
const BRUSHSIZE = 4;

const DRAW = 0;
const WRITE = 1;

const Crossword = (props) => {
  const [canvas, setCanvas] = useState(null);
  const [context, setContext] = useState(null);

  const [readyState, onExternalDraw, onExternalWrite, sendEvent] = useApi(
    props.url
  );

  const [mode, setMode] = useState(DRAW);

  const [cursorPosition, setCursorRC] = useState([0, 0]);
  const [letters, setLetters] = useState(createLetterArray());

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
      let [row, column] = cursorPosition;

      if (key === "ArrowDown" || key === "Down") {
        row += 1;
      } else if (key === "ArrowUp" || key === "Up") {
        row -= 1;
      } else if (key === "ArrowLeft" || key === "Left") {
        column -= 1;
      } else if (key === "ArrowRight" || key === "Right") {
        column += 1;
      } else {
        return false;
      }

      if (
        row >= 0 &&
        row < squares.length &&
        column >= 0 &&
        column < squares[row].length
      )
        setCursorRC([row, column]);
      return true;
    },
    [cursorPosition]
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
      const updateAndSend = (newValue) => {
        const [row, column] = cursorPosition;
        const newLetters = [...letters];
        newLetters[coordGrid[row][column]].letter = newValue;
        setLetters(newLetters);

        sendEvent({
          action: "WRITE_EVENT",
          event: { letter: newValue, row, column }
        });
      };

      const isLetter =
        key.length === 1 && key.toUpperCase().match(/[A-Z|Å|Ä|Ö]/i);
      if (isLetter) {
        updateAndSend(key.toUpperCase());

        return true;
      } else if (key === "Backspace") {
        updateAndSend("");

        return true;
      }

      return false;
    },
    [cursorPosition, letters, sendEvent]
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

    const handleExternalWrite = (writeHistory) => {
      const newLetters = [...letters];
      writeHistory.forEach(({ letter, row, column }, i) => {
        newLetters[coordGrid[row][column]].letter = letter;
      });
      setLetters(newLetters);
    };
    onExternalWrite.current = handleExternalWrite;

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
    onExternalWrite,
    mode,
    letterKey,
    cursorKey,
    letters
  ]);

  // Prevent arrow key scrolling if mode === WRITE
  useEffect(() => {
    window.onkeydown = (event) => {
      if (
        mode === WRITE &&
        ([32, 37, 38, 39, 40].indexOf(event.keyCode) > -1 ||
          event.key === "Backspace")
      ) {
        event.preventDefault();
      }
    };
  }, [mode]);

  return (
    <div>
      
      <canvas
        width={1193}
        height={1664}
        ref={backgroundInitializer}
        className="crossword"
      ></canvas>
      <Grid
        cursorPosition={cursorPosition}
        letters={letters}
        showCursor={mode === WRITE}
      />
      <canvas
        width={1193}
        height={1664}
        ref={canvasInitializer}
        className="crossword"
      ></canvas>
      <Sidebar />
    </div>
  );
};

export default Crossword;
