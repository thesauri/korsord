const socket = new WebSocket("ws://localhost:8080");
let drawingListener = null;

socket.addEventListener("message", (data) => {
  const event = JSON.parse(data.data);
  if (event.action === "START_DRAWING" || event.action === "DRAWING") {
    drawingListener(event);
  }
});

export const sendEvent = (event) => socket.send(JSON.stringify(event));
export const setDrawingListener = (drawingListenerFunc) => drawingListener = drawingListenerFunc;