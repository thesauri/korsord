import React, { useEffect } from "react";
import { useCallback } from "react";
import { useState } from "react";

import "./Crossword.css";
import { useWsApi } from "./wsApi";

import Grid, {
  createLetterArray,
  createCoordinateGrid,
  Square,
  LetterType,
  Vec2
} from "./Grid";
import Sidebar from "./Sidebar";
import { ConnectionErrorPopup } from "./ConnectionErrorPopup";

const ERASERSIZE = 8;
const BRUSHSIZE = 1;

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

interface CrosswordProps {
  url: string;
  metadata: {
    squares: {
      medianLen: number;
      grid: Square[][];
    };
  };
  image: HTMLImageElement;
}

interface DrawingEvent {
  x: number;
  y: number;
  globalCompositeOperation: string;
  lineWidth: number;
  action: string;
}

const Crossword: React.FC<CrosswordProps> = (props) => {
  const [canvas, setCanvas] = useState<HTMLCanvasElement>();
  const [context, setContext] = useState<CanvasRenderingContext2D>();

  const [readyState, onExternalDraw, onExternalWrite, sendEvent] = useWsApi(
    props.url
  );

  const [mode, setMode] = useState<EditMode>(EditMode.DRAW);

  const [cursorPosition, setCursorPosition] = useState<Vec2>([0, 0]);
  const [writeMode, setWriteMode] = useState<WriteMode>(WriteMode.STATIONARY);
  const [coordGrid, setCoordGrid] = useState<number[][]>([]);
  const [letters, setLetters] = useState<LetterType[]>([]); //createLetterArray());

  useEffect(() => {
    setCursorPosition([0, 0]);
    setCoordGrid(createCoordinateGrid(props.metadata.squares.grid));
    setLetters(createLetterArray(props.metadata.squares.grid));
  }, [props.metadata.squares]);

  const backgroundRef = useCallback(
    (node) => {
      if (node !== null && node.getContext) {
        const context = node.getContext("2d");
        context.drawImage(props.image, 0, 0);
      }
    },
    [props.image]
  );

  const canvasRef = useCallback((node) => {
    if (node !== null) {
      setCanvas(node);
      setContext(node.getContext("2d"));
    }
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
        setWriteMode(WriteMode.STATIONARY);
        setMode(EditMode.DRAW);
        return true;
      } else if (key === "Tab") {
        // division by two because Object.keys return keys *and* values for enums
        setWriteMode((writeMode + 1) % (Object.keys(WriteMode).length / 2));
        return true;
      }

      return false;
    },
    [setMode, writeMode, setWriteMode]
  );

  const letterKey = useCallback(
    (key) => {
      const updateAndSend = (newValue: string) => {
        const [row, column] = cursorPosition;
        const newLetters = [...letters];
        newLetters[coordGrid[row][column]].letter = newValue;
        setLetters(newLetters);

        // @ts-ignore
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
        if (writeMode === WriteMode.DOWN) {
          updateCursor(movement, 0);
        } else if (writeMode === WriteMode.RIGHT) {
          updateCursor(0, movement);
        }
      }

      return true;
    },
    [coordGrid, updateCursor, cursorPosition, letters, sendEvent, writeMode]
  );

  useEffect(() => {
    if (context) {
      if (mode === EditMode.DRAW) {
        context.globalCompositeOperation = "source-over";
        context.lineWidth = (props.image.width / 1200.0) * BRUSHSIZE;
      } else if (mode === EditMode.ERASE) {
        context.globalCompositeOperation = "destination-out";
        context.lineWidth = (props.image.width / 1200.0) * ERASERSIZE;
      } else if (mode === EditMode.WRITE) {
      } else {
        console.error(`Unknown mode: ${mode}`);
      }
    }
  }, [context, mode, props.image.width]);

  useEffect(() => {
    // @ts-ignore
    if (!canvas || !context || readyState !== WebSocket.OPEN) {
      return;
    }

    const getMouseLocation = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      return [x, y];
    };

    const getTouchLocation = (event: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.touches[0].clientX - rect.left;
      const y = event.touches[0].clientY - rect.top;
      return [x, y];
    };

    let isDrawing = false;
    let lastTo = [-1, -1];

    const handleKey = (event: KeyboardEvent) => {
      if (
        mode === EditMode.WRITE &&
        ([32, 37, 38, 39, 40].indexOf(event.keyCode) > -1 ||
          event.key === "Backspace" ||
          event.key === "Tab")
      ) {
        event.preventDefault();
      }

      if (mode !== EditMode.WRITE) {
        if (event.key === "Enter") {
          setMode(EditMode.WRITE);
          stopDrawing();
        } else if (event.key === "e") {
          setMode(EditMode.ERASE);
          console.log("eraser selected");
        } else if (event.key === "b") {
          setMode(EditMode.DRAW);
          console.log("brush selected");
        }
      } else {
        cursorKey(event.key) ||
          writeModeSwitch(event.key) ||
          letterKey(event.key);
      }
    };

    let unsentDrawingEvents: DrawingEvent[] = [];

    const startDrawing = (x: number, y: number) => {
      context.moveTo(x, y);
      lastTo = [x, y];
      isDrawing = true;
      unsentDrawingEvents.push({
        x,
        y,
        globalCompositeOperation: context.globalCompositeOperation,
        lineWidth: context.lineWidth,
        action: "START_DRAWING"
      });
    };

    const draw = (x: number, y: number) => {
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
        // @ts-ignore
        sendEvent({
          action: "DRAWING_EVENTS",
          drawingEvents: unsentDrawingEvents
        });
        unsentDrawingEvents = [];
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (mode === EditMode.WRITE) {
        const [mouseX, mouseY] = getMouseLocation(event);

        const row = props.metadata.squares.grid.findIndex(
          (squareRow: Square[]) => {
            const [, y, , h] = squareRow[0].c;
            return mouseY >= y && mouseY <= y + h;
          }
        );
        if (row === -1) return;

        const column = props.metadata.squares.grid[row].findIndex(
          (square: Square) => {
            const [x, , w] = square.c;
            return mouseX >= x && mouseX <= x + w;
          }
        );
        if (column === -1) return;

        setCursorPosition([row, column]);
      } else {
        const [x, y] = getMouseLocation(event);
        startDrawing(x, y);
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDrawing) {
        return;
      }
      const [x, y] = getMouseLocation(event);
      draw(x, y);
    };

    const handleMouseUp = () => {
      stopDrawing();
    };

    let batchedExternalDrawEvents: DrawingEvent[] = [];

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

    const handleExternalDrawing = (drawingEvents: DrawingEvent[]) => {
      drawingEvents.forEach((drawingEvent) => {
        batchedExternalDrawEvents.push(drawingEvent);
      });
      if (!isDrawing) {
        flushExternalDrawingEvents();
      }
    };

    // @ts-ignore
    onExternalDraw.current = handleExternalDrawing;

    const handleExternalWrite = (writeHistory: LetterType[]) => {
      const newLetters = [...letters];
      writeHistory.forEach(({ letter, row, column }) => {
        newLetters[coordGrid[row][column]].letter = letter;
      });
      setLetters(newLetters);
    };
    // @ts-ignore
    onExternalWrite.current = handleExternalWrite;

    const handleTouchStart = (event: TouchEvent) => {
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

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 1 || !isDrawing) {
        // Panning
        return;
      }
      const [x, y] = getTouchLocation(event);
      draw(x, y);
      event.preventDefault();
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (isDrawing && event.touches.length === 0) {
        stopDrawing();
      }
    };

    window.onkeydown = handleKey;
    canvas.onmousedown = handleMouseDown;
    canvas.onmousemove = handleMouseMove;
    canvas.onmouseup = handleMouseUp;
    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchmove", handleTouchMove);
    canvas.addEventListener("touchend", handleTouchEnd);
    
    return function cleanup() {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    }
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
        ref={backgroundRef}
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
            showCursor={mode === EditMode.WRITE}
            squares={props.metadata.squares}
            width={props.image.width}
            height={props.image.height}
            writeMode={writeMode}
          />
        )}
      <canvas
        ref={canvasRef}
        width={props.image.width}
        height={props.image.height}
        className="crossword draw-layer"
      ></canvas>
      {
        // @ts-ignore
        readyState === WebSocket.CLOSED && <ConnectionErrorPopup />
      }
      <Sidebar mode={mode} setMode={setMode} />
    </div>
  );
};

export default Crossword;
