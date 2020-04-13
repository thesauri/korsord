import React, { useEffect } from "react";
import { useCallback } from "react";
import { useState } from "react";

import "./Crossword.css";
import { useWsApi } from "./wsApi";

import Grid, { createLetterArray, createCoordinateGrid } from "./Grid.jsx";
import Sidebar from "./Sidebar.jsx";

const ERASERSIZE = 8;
const BRUSHSIZE = 1;

export const DRAW = 0;
export const WRITE = 1;
export const ERASE = 2;

// Writing direction
export const writeModes = {
  STATIONARY: 0,
  RIGHT: 1,
  DOWN: 2
};

const Crossword = (props) => {
  const [canvas, setCanvas] = useState(null);
  const [context, setContext] = useState(null);

  const [readyState, onExternalDraw, onExternalWrite, sendEvent] = useWsApi(
    props.url
  );

  const [mode, setMode] = useState(DRAW);

  const [cursorPosition, setCursorPosition] = useState(null);
  const [writeMode, setWriteMode] = useState(writeModes.STATIONARY);
  const [coordGrid, setCoordGrid] = useState(null);
  const [letters, setLetters] = useState(null); //createLetterArray());

  useEffect(() => {
    setCursorPosition([0, 0]);
    setCoordGrid(createCoordinateGrid(props.metadata.squares.grid));
    setLetters(createLetterArray(props.metadata.squares.grid));
  }, [props.metadata.squares]);

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

  const updateCursor = useCallback(
    (relativeR, relativeC) => {
      const row = cursorPosition[0] + relativeR;
      const column = cursorPosition[1] + relativeC;

      if (
        row >= 0 &&
        row < props.metadata.squares.grid.length &&
        column >= 0 &&
        column < props.metadata.squares.grid[row].length
      )
        setCursorPosition([row, column]);
    },
    [props.metadata.squares.grid, cursorPosition, setCursorPosition]
  );

  const cursorKey = useCallback(
    (key) => {
      if (key === "ArrowDown" || key === "Down") {
        updateCursor(1, 0);
      } else if (key === "ArrowUp" || key === "Up") {
        updateCursor(-1, 0);
      } else if (key === "ArrowLeft" || key === "Left") {
        updateCursor(0, -1);
      } else if (key === "ArrowRight" || key === "Right") {
        updateCursor(0, 1);
      } else {
        return false;
      }

      return true;
    },
    [updateCursor]
  );

  const writeModeSwitch = useCallback(
    (key) => {
      if (key === "Escape" || key === "Esc") {
        setWriteMode(writeModes.STATIONARY);
        setMode(DRAW);
        return true;
      } else if (key === "Tab") {
        setWriteMode((writeMode + 1) % Object.keys(writeModes).length);
        return true;
      }

      return false;
    },
    [setMode, writeMode, setWriteMode]
  );

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

      let movement = 0;
      if (isLetter) {
        updateAndSend(key.toUpperCase());
        movement = 1;
      } else if (key === "Backspace") {
        updateAndSend("");
        movement = -1;
      } else {
        return false;
      }

      if (movement !== 0) {
        if (writeMode === writeModes.DOWN) {
          updateCursor(movement, 0);
        } else if (writeMode === writeModes.RIGHT) {
          updateCursor(0, movement);
        }
      }

      return true;
    },
    [coordGrid, updateCursor, cursorPosition, letters, sendEvent, writeMode]
  );

  useEffect(() => {
    if (!context) {
      return;
    }
    if (mode === DRAW) {
      context.globalCompositeOperation = "source-over";
      context.lineWidth = (props.image.width / 1200.0) * BRUSHSIZE;
    } else if (mode === ERASE) {
      context.globalCompositeOperation = "destination-out";
      context.lineWidth = (props.image.width / 1200.0) * ERASERSIZE;
    } else if (mode === WRITE) {
    } else {
      console.error(`Unknown mode: ${mode}`);
    }
  }, [context, mode, props.image.width]);

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

    const getTouchLocation = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.touches[0].clientX - rect.left;
      const y = event.touches[0].clientY - rect.top;
      return [x, y];
    };

    let isDrawing = false;
    let lastTo = [-1, -1];

    const handleKey = (event) => {
      if (
        mode === WRITE &&
        ([32, 37, 38, 39, 40].indexOf(event.keyCode) > -1 ||
          event.key === "Backspace" ||
          event.key === "Tab")
      ) {
        event.preventDefault();
      }

      if (mode !== WRITE) {
        if (event.key === "Enter") {
          setMode(WRITE);
          stopDrawing();
        } else if (event.key === "e") {
          setMode(ERASE);
          console.log("eraser selected");
        } else if (event.key === "b") {
          setMode(DRAW);
          console.log("brush selected");
        }
      } else {
        cursorKey(event.key) ||
          writeModeSwitch(event.key) ||
          letterKey(event.key);
      }
    };

    let unsentDrawingEvents = [];

    const startDrawing = (x, y) => {
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

    const draw = (x, y) => {
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

    const stopDrawing = () => {
      isDrawing = false;
      if (batchedExternalDrawEvents.length > 0) {
        flushExternalDrawingEvents();
      }
      if (unsentDrawingEvents.length > 0) {
        sendEvent({
          action: "DRAWING_EVENTS",
          drawingEvents: unsentDrawingEvents
        });
        unsentDrawingEvents = [];
      }
    };

    const handleMouseDown = (event) => {
      if (mode === WRITE) {
        const [mouseX, mouseY] = getMouseLocation(event);

        const row = props.metadata.squares.grid.findIndex((squareRow) => {
          const [, y, , h] = squareRow[0].c;
          return mouseY >= y && mouseY <= y + h;
        });
        if (row === -1) return;

        const column = props.metadata.squares.grid[row].findIndex((square) => {
          const [x, , w] = square.c;
          return mouseX >= x && mouseX <= x + w;
        });
        if (column === -1) return;

        setCursorPosition([row, column]);
      } else {
        const [x, y] = getMouseLocation(event);
        startDrawing(x, y);
      }
    };

    const handleMouseMove = (event) => {
      if (!isDrawing) {
        return;
      }
      const [x, y] = getMouseLocation(event);
      draw(x, y);
    };

    const handleMouseUp = () => {
      stopDrawing();
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

    const handleExternalDrawing = (drawingEvents) => {
      drawingEvents.forEach((drawingEvent) => {
        batchedExternalDrawEvents.push(drawingEvent);
      });
      if (!isDrawing) {
        flushExternalDrawingEvents();
      }
    };

    onExternalDraw.current = handleExternalDrawing;

    const handleExternalWrite = (writeHistory) => {
      const newLetters = [...letters];
      writeHistory.forEach(({ letter, row, column }, i) => {
        newLetters[coordGrid[row][column]].letter = letter;
      });
      setLetters(newLetters);
    };
    onExternalWrite.current = handleExternalWrite;

    const handleTouchStart = (event) => {
      if (event.touches.length > 1) {
        // Start panning
        if (isDrawing) {
          stopDrawing();
        }
        return;
      }
      const [x, y] = getTouchLocation(event);
      startDrawing(x, y);
    };

    const handleTouchMove = (event) => {
      if (event.touches.length > 1 || !isDrawing) {
        // Panning
        return;
      }
      const [x, y] = getTouchLocation(event);
      draw(x, y);
      event.preventDefault();
    };

    const handleTouchEnd = (event) => {
      if (isDrawing && event.touches.length === 0) {
        stopDrawing();
      }
    };

    window.onkeydown = handleKey;
    canvas.onmousedown = handleMouseDown;
    canvas.onmousemove = handleMouseMove;
    canvas.onmouseup = handleMouseUp;
    canvas.ontouchstart = handleTouchStart;
    canvas.ontouchmove = handleTouchMove;
    canvas.ontouchend = handleTouchEnd;
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
    letters,
    props.image,
    writeModeSwitch,
    coordGrid,
    props.metadata.squares.grid
  ]);

  return (
    <div>
      <canvas
        width={props.image.width}
        height={props.image.height}
        ref={backgroundInitializer}
        className="crossword"
      ></canvas>
      {props.image &&
        cursorPosition &&
        props.metadata.squares &&
        coordGrid &&
        letters && (
          <Grid
            cursorPosition={cursorPosition}
            letters={letters}
            showCursor={mode === WRITE}
            squares={props.metadata.squares}
            width={props.image.width}
            height={props.image.height}
            writeMode={writeMode}
            className="crossword"
          />
        )}
      <canvas
        width={props.image.width}
        height={props.image.height}
        ref={canvasInitializer}
        className="crossword"
      ></canvas>
      <Sidebar mode={mode} setMode={setMode} />
    </div>
  );
};

export default Crossword;
