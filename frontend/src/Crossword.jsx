import React, { useEffect } from "react";
import { useCallback } from "react";
import { useState } from "react";
import "./Crossword.css"


const ERASERSIZE = 18;
const BRUSHSIZE = 6;

const Crossword = (props) => {
  const [canvas, setCanvas] = useState(null);
  const [context, setContext] = useState(null);

  const backgroundInitializer = useCallback((backgroundCanvas) => {
    if (backgroundCanvas === null || !backgroundCanvas.getContext) {
      return;
    }
    const context = backgroundCanvas.getContext("2d");
    context.drawImage(props.image, 0, 0);
  }, []);

  const canvasInitializer = useCallback((canvas) => {
    if (canvas === null || !canvas.getContext) {
      return;
    }
    setContext(canvas.getContext("2d"));
    setCanvas(canvas);
  }, []);

  useEffect(() => {
    if (!canvas || !context) {
      return;
    }

    const getMouseLocation = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      return [x, y];
    };

    let isDrawing = false;
    
    
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
      context.beginPath();
      isDrawing = true;
    };

    const draw = (event) => {
      if (!isDrawing) {
        return;
      }
      const [x, y] = getMouseLocation(event);
      context.lineTo(x, y);
      context.stroke();
    };

    const stopDrawing = (event) => {
      isDrawing = false;
    };

    selectBrush();

    window.onkeyup = changeTool;
    canvas.onmousedown = startDrawing;
    canvas.onmousemove = draw;
    canvas.onmouseup = stopDrawing;
  }, [canvas, context])

  return (
    <div>
      <canvas width={3508} height={4963} ref={backgroundInitializer} className="crossword"></canvas>
      <canvas width={3508} height={4963} ref={canvasInitializer} className="crossword"></canvas>
    </div>
  )
};

export default Crossword;
