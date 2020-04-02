import { useState, useRef, useEffect } from "react";

export const useApi = () => {
  const socket = useRef(null);
  const onExternalDraw = useRef(() => { console.error("No draw function set" )});
  const [readyState, setReadyState] = useState("CONNECTING");

  const requestDrawingHistory = () => {
    socket.current.send(JSON.stringify({ action: "REQUEST_DRAWING_HISTORY" }));
  };

  useEffect(() => {
    socket.current = new WebSocket("ws://localhost:8080");

    socket.current.addEventListener("open", () => {
      setReadyState(socket.current.readyState);
      requestDrawingHistory();
    });

    socket.current.addEventListener("close", () => {
      setReadyState(socket.current.readyState);
    });

    socket.current.addEventListener("message", (data) => {
      const event = JSON.parse(data.data);
      if (event.action === "START_DRAWING" || event.action === "DRAWING") {
        onExternalDraw.current(event);
      } else if (event.action === "DRAWING_HISTORY") {
        event.drawingHistory.forEach(drawingEvent => {
          onExternalDraw.current(drawingEvent);
        });
      }
    });
  }, []);

  const sendEvent = (data) => {
    if (!socket.current || socket.current.readyState !== WebSocket.OPEN) {
      console.error("Unable to send event: connection not open");
      return;
    }
    socket.current.send(JSON.stringify(data));
  }

  return [readyState, onExternalDraw, sendEvent];
};
