import React from "react";
import { useCallback } from "react";
import { useState } from "react";

export const useCanvasAndContext = (): [
  (canvasElement: HTMLCanvasElement | null) => void,
  HTMLCanvasElement | undefined,
  CanvasRenderingContext2D | undefined
] => {
  const [canvas, setCanvas] = useState<HTMLCanvasElement>();
  const [context, setContext] = useState<CanvasRenderingContext2D>();
  const useRefToSetCanvasAndContext = useElementToSetCanvasAndContext(
    setCanvas,
    setContext
  );
  return [useRefToSetCanvasAndContext, canvas, context];
};

const useElementToSetCanvasAndContext = (
  setCanvas: React.Dispatch<
    React.SetStateAction<HTMLCanvasElement | undefined>
  >,
  setContext: React.Dispatch<
    React.SetStateAction<CanvasRenderingContext2D | undefined>
  >
) => {
  return useCallback(
    (canvasElement: HTMLCanvasElement | null) => {
      if (canvasElement === null) {
        return;
      }
      const context2d = canvasElement.getContext("2d");
      if (context2d === null) {
        console.error(`No context available: ${context2d}`);
        return;
      }
      setCanvas(canvasElement);
      setContext(context2d);
    },
    [setCanvas, setContext]
  );
};
