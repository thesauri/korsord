import React, { useRef, useEffect } from 'react';
import { useCallback } from 'react';
import { useState } from 'react';

const Crossword = (props) => {
  const [canvas, setCanvas] = useState(null);
  const [context, setContext] = useState(null);

  const initCrossword = (context) => {
    context.drawImage(props.image, 0, 0);
    setContext(context);
  };

  const canvasInitializer = useCallback((node) => {
    if (node !== null) {
      if (!node.getContext) {
        return;
      }
      initCrossword(node.getContext("2d"));
      setCanvas(node);
    }
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

    const startDrawing = (event) => {
      const [x, y] = getMouseLocation(event);
      context.moveTo(x, y);
      context.beginPath();
      context.lineWidth = 4;
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

    canvas.onmousedown = startDrawing;
    canvas.onmousemove = draw;
    canvas.onmouseup = stopDrawing;
  }, [canvas, context])

  return (
    <canvas width={3508} height={4963} ref={canvasInitializer}></canvas>
  )
};

export default Crossword;
