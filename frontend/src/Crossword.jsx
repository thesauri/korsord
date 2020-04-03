import React, { useEffect } from "react";
import { useCallback } from "react";
import { useState } from "react";
import "./Crossword.css";
import { useApi } from "./api";


const ERASERSIZE = 12;
const BRUSHSIZE = 4;

const Crossword = (props) => {
  const [canvas, setCanvas] = useState(null);
  const [context, setContext] = useState(null);
  const [readyState, onExternalDraw, sendEvent] = useApi(props.url);

  const backgroundInitializer = useCallback((backgroundCanvas) => {
    if (backgroundCanvas === null || !backgroundCanvas.getContext) {
      return;
    }
    const context = backgroundCanvas.getContext("2d");
    context.drawImage(props.image, 0, 0);
  }, [props.image]);

  const canvasInitializer = useCallback((canvas) => {
    if (canvas === null || !canvas.getContext) {
      return;
    }
    setContext(canvas.getContext("2d"));
    setCanvas(canvas);
  }, []);

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
    
    const changeTool = (event) => {
      if (event.key === 'e') {
        selectEraser();
        console.log("eraser selected")
      } else if (event.key === 'b') {
        selectBrush();
        console.log("brush selected")
      };
    };

    const selectEraser = () => {
      context.globalCompositeOperation = "destination-out";
      context.lineWidth = ERASERSIZE;
    };

    const selectBrush = () => {
      context.globalCompositeOperation = "source-over";
      context.lineWidth = BRUSHSIZE;
    };

    const startDrawing = (event) => {
      const [x, y] = getMouseLocation(event);
      context.moveTo(x, y);
      lastTo = [x, y];
      context.beginPath();
      isDrawing = true;
      sendEvent({
        x, 
        y, 
        globalCompositeOperation: context.globalCompositeOperation, 
        lineWidth: context.lineWidth,
        action: "START_DRAWING",
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
      sendEvent({
        x, 
        y, 
        globalCompositeOperation: context.globalCompositeOperation,
        lineWidth: context.lineWidth,
        action: "DRAWING",
      });
    };

    const batchedExternalDrawEvents = [];

    const flushExternalDrawingEvents = () => {
      const currentGlobalCompositeOperation = context.globalCompositeOperation;
      const currentLineWidth = context.lineWidth;
      batchedExternalDrawEvents.forEach(drawingEvent => {
        const { x, y, globalCompositeOperation, lineWidth, action } = drawingEvent;
        context.globalCompositeOperation = globalCompositeOperation;
        context.lineWidth = lineWidth;
        if (action === "DRAWING") {
          context.lineTo(x, y);
        } else if (action === "START_DRAWING") {
          context.stroke();
          context.moveTo(x, y);
          context.beginPath();
        }
      });
      context.stroke();
      context.globalCompositeOperation = currentGlobalCompositeOperation;
      context.lineWidth = currentLineWidth;
      const [x, y] = lastTo;
      context.moveTo(x, y);
    };

    const stopDrawing = () => {
      isDrawing = false;
      flushExternalDrawingEvents();
    };


    const handleExternalDrawing = (drawingEvent) => {
      batchedExternalDrawEvents.push(drawingEvent);
      if (!isDrawing) {
        flushExternalDrawingEvents();
      }
    }

    selectBrush();

    onExternalDraw.current = handleExternalDrawing;

    window.onkeyup = changeTool;
    canvas.onmousedown = startDrawing;
    canvas.onmousemove = draw;
    canvas.onmouseup = stopDrawing;
  }, [canvas, context, readyState, sendEvent, onExternalDraw])

  return (
    <div>
      <canvas width={1193} height={1664} ref={backgroundInitializer} className="crossword"></canvas>
      <canvas width={1193} height={1664} ref={canvasInitializer} className="crossword"></canvas>
    </div>
  )
};

export default Crossword;
