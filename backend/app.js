const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

const eventHistory = [];

wss.on("connection", (ws) => {
  ws.on("message",  (eventString) => {
    const event = JSON.parse(eventString);
    if (event.action === "START_DRAWING" || event.action === "DRAWING") {
      eventHistory.push(event);
      wss.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(eventString);
        }
      });
    }


  });

  //ws.send(eventHistory);
});