import { useState, useRef, useEffect, MutableRefObject } from "react";
import { config } from "./Constants";
import { LetterType } from "./Grid";
import { DrawingEvent } from "./Crossword";

type EventTypes = "DRAWING_EVENTS" | "DRAWING_HISTORY" | "WRITE_HISTORY"

interface DataInterface {
  action: EventTypes,
  event?: LetterType,
  drawingEvents?: DrawingEvent[],
  // TODO: implement when converting app.js to typescript
  drawingHistory?: any, 
  writeHistory?: any,
}

export const useWsApi = (url: string): [
  number,
  MutableRefObject<(drawingEvents: DrawingEvent[]) => void>,
  MutableRefObject<(writeHistory: LetterType[]) => void>,
  (data: any) => void,
] => {
  const socket = useRef(new WebSocket(config.WS_URL));
  const onExternalDraw = useRef((_: any) => console.error("No draw function set"));
  const onExternalWrite = useRef((_: any) => console.error("No write function set"));
  const [readyState, setReadyState] = useState(WebSocket.CONNECTING);

  useEffect(() => {
    console.log(`WS_URL: ${config.WS_URL}`);

    const sendURL = () => {
      const payload = JSON.stringify({
        url,
        event: {
          action: "OPEN_CONNECTION"
        }
      });
      socket.current.send(payload);
    };

    const requestHistory = () => {
      const payload = JSON.stringify({
        url,
        event: {
          action: "REQUEST_HISTORY"
        }
      });
      socket.current.send(payload);
    };

    socket.current.addEventListener("open", () => {
      setReadyState(socket.current.readyState);
      sendURL();
      requestHistory();
    });

    socket.current.addEventListener("close", () => {
      setReadyState(socket.current.readyState);
    });

    socket.current.addEventListener("message", (data) => {
      const event: DataInterface = JSON.parse(data.data);
      if (event.action === "DRAWING_EVENTS") {
        onExternalDraw.current(event.drawingEvents);
      } else if (event.action === "DRAWING_HISTORY") {
        event.drawingHistory.forEach((event: { drawingEvents: DrawingEvent[] }) => {
          onExternalDraw.current(event.drawingEvents);
        });
      } else if (event.action === "WRITE_HISTORY") {
        onExternalWrite.current(event.writeHistory);
      }
    });
  }, [url]);

  const sendEvent = (data: DataInterface) => {
    if (!socket.current || socket.current.readyState !== WebSocket.OPEN) {
      console.error("Unable to send event: connection not open");
      return;
    }
    const payload = JSON.stringify({
      url,
      event: data
    });
    socket.current.send(payload);
  };

  return [readyState, onExternalDraw, onExternalWrite, sendEvent];
};
