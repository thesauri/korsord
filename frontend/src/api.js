import { useState, useRef, useEffect } from "react";
import { config } from "./Constants";

export const useApi = (url) => {
  const socket = useRef(null);
  const onExternalDraw = useRef(() => {
    console.error("No draw function set");
  });
  const [readyState, setReadyState] = useState("CONNECTING");

  useEffect(() => {
    console.log(`WS_URL: ${config.WS_URL}`);
    socket.current = new WebSocket(config.WS_URL);

    const sendURL = () => {
      const payload = JSON.stringify({
        url,
        event: {
          action: "OPEN_CONNECTION",
        },
      });
      socket.current.send(payload);
    };

    const requestDrawingHistory = () => {
      const payload = JSON.stringify({
        url,
        event: {
          action: "REQUEST_DRAWING_HISTORY",
        },
      });
      socket.current.send(payload);
    };

    socket.current.addEventListener("open", () => {
      setReadyState(socket.current.readyState);
      sendURL();
      requestDrawingHistory();
    });

    socket.current.addEventListener("close", () => {
      setReadyState(socket.current.readyState);
    });

    socket.current.addEventListener("message", (data) => {
      const event = JSON.parse(data.data);
      if (event.action === "DRAWING_EVENTS") {
        onExternalDraw.current(event.drawingEvents);
      } else if (event.action === "DRAWING_HISTORY") {
        event.drawingHistory.forEach((event) => {
          onExternalDraw.current(event.drawingEvents);
        });
      }
    });
  }, [url]);

  const sendEvent = (data) => {
    if (!socket.current || socket.current.readyState !== WebSocket.OPEN) {
      console.error("Unable to send event: connection not open");
      return;
    }
    const payload = JSON.stringify({
      url,
      event: data,
    });
    socket.current.send(payload);
  };

  return [readyState, onExternalDraw, sendEvent];
};
