const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

const drawingHistory = [];

wss.on("connection", (ws) => {
  ws.on("message",  (eventString) => {
    const event = JSON.parse(eventString);
    if (event.action === "START_DRAWING" || event.action === "DRAWING") {
      drawingHistory.push(event);
      wss.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(eventString);
        }
      });
    } else if (event.action === "REQUEST_DRAWING_HISTORY") {
      ws.send(JSON.stringify({
        action: "DRAWING_HISTORY",
        drawingHistory
      }));
    }
  });

  //ws.send(eventHistory);
  console.log("Client connected!");
});