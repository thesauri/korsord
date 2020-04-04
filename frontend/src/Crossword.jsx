import React, { useEffect, useRef } from "react";
import { useCallback } from "react";
import { useState } from "react";

import "./Crossword.css";
import { useApi } from "./api";
import { squares, createLetterArr, createCoordGrid } from "./squares";

const coordGrid = createCoordGrid();

const ERASERSIZE = 12;
const BRUSHSIZE = 4;

const Crossword = (props) => {
  const [canvas, setCanvas] = useState(null);
  const [context, setContext] = useState(null);
  const [cursorRC, setCursorRC] = useState([0, 0]);
  const [letters, setLetters] = useState(createLetterArr());
  const [readyState, onExternalDraw, sendEvent] = useApi(props.url);

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

  const eraseCursor = (rc) => {
    context.globalCompositeOperation = "destination-out";
    const [x, y, w, h] = squares[rc[0]][rc[1]].c;
    context.strokeRect(x, y, w, h);
    context.globalCompositeOperation = "source-over";
  };

  const drawCursor = (rc) => {
    const sq = squares[rc[0]][rc[1]];
    const [x, y, w, h] = sq.c;
    if (sq.t) {
      context.strokeStyle = "rgb(255, 0, 0)";
    } else {
      context.strokeStyle = "rgb(0, 255, 0)";
    }
    context.strokeRect(x, y, w, h);
    context.strokeStyle = "rgb(0, 0, 0)";
  };

  const prevCursorRC = useRef();
  useEffect(() => {
    if (!canvas || !context || readyState !== WebSocket.OPEN) {
      return;
    }

    if (prevCursorRC.current) eraseCursor(prevCursorRC.current);
    prevCursorRC.current = cursorRC;

    drawCursor(cursorRC);
  }, [cursorRC]);

  useEffect(() => {
    if (!canvas || !context || readyState !== WebSocket.OPEN) {
      return;
    }

    const getSq = (r, c) => squares[r][c];
    letters.forEach(({ l, r, c }) => {
      const [x, y, w, h] = getSq(r, c).c; // squares[r][c].c;

      context.globalCompositeOperation = "destination-out";
      context.fillRect(x, y, w, h);
      context.globalCompositeOperation = "source-over";

      if (l) {
        context.font = "48px serif";
        context.fillText(l, x, y + h);
      }
    });
  }, [letters]);

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

    const letterKey = (key) => {};

    const handleKey = (event) => {
      console.log(event.key);
      if (event.key === "e") {
        selectEraser();
        console.log("eraser selected");
      } else if (event.key === "b") {
        selectBrush();
        console.log("brush selected");
      } else {
        if (cursorKey(event.key)) return;

        const newLetters = [...letters];
        newLetters[coordGrid[cursorRC[0]][cursorRC[1]]].l = event.key;
        setLetters(newLetters);
        console.log(letters);
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
