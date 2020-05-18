import React from "react";
import { useCallback } from "react";

export const CrosswordImage: React.FC<{
  image: HTMLImageElement;
}> = (props) => {
  const drawBackgroundImage = useRefToDrawBackgroundImage(props.image);
  return (
    <canvas
      width={props.image.width}
      height={props.image.height}
      ref={drawBackgroundImage}
      className="crossword"
    ></canvas>
  );
};

const useRefToDrawBackgroundImage = (image: HTMLImageElement) =>
  useCallback(
    (node) => {
      if (node !== null && node.getContext) {
        const context = node.getContext("2d");
        context.drawImage(image, 0, 0);
      }
    },
    [image]
  );
