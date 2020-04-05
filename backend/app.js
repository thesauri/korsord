"use strict";

const WebSocket = require("ws");
const express = require("express");
const http = require("http");

const {
  addDrawEvent,
  getAllDrawEvents,
  addWriteEvent,
  getLatestWriteEvents,
  closeDB
} = require("./db");

const app = express();
app.use("/", express.static("../frontend/build/"));
app.use("*", express.static("../frontend/build/"));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = {};

wss.on("connection", (ws) => {
  ws.on("message", (msgString) => {
    const msg = JSON.parse(msgString);
    if (!msg.event || !msg.url) {
      console.error("Invalid msg: \n" + JSON.stringify(msg));
      return;
    }

    const event = msg.event;
    const url = msg.url;

    if (event.action === "OPEN_CONNECTION") {
      if (clients[url] === undefined) {
        clients[url] = [];
      }
      clients[url].push({ ws: ws, writeIdx: -1 });
      return;
    }

    if (clients[url] === undefined) {
      console.error("Drawing action to nonexistent url");
      return;
    }

    if (clients[url].find((c) => c.ws === ws) === undefined) {
      console.error("Drawing action to incorrect url");
      return;
    }

    if (event.action === "DRAWING_EVENTS") {
      addDrawEvent(url, JSON.stringify(event));

      clients[url].forEach((obj) => {
        const client = obj.ws;
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(event));
        }
      });
    } else if (event.action === "REQUEST_DRAWING_HISTORY") {
      getAllDrawEvents(url, (drawingHistoryString) => {
        const drawingHistory = JSON.parse(drawingHistoryString);
        const payload = JSON.stringify({
          action: "DRAWING_HISTORY",
          drawingHistory
        });
        ws.send(payload);
      });
    } else if (event.action === "WRITE_EVENT") {
      addWriteEvent(url, JSON.stringify(event.event));
    }
  });
});

const intervalTimeout = setInterval(() => {
  Object.keys(clients).forEach((url) => {
    const urlClients = clients[url];
    urlClients.forEach(({ ws, writeIdx }, i) => {
      getLatestWriteEvents(url, writeIdx, (rows) => {
        if (rows.length > 0) {
          const latestId = rows[rows.length - 1].id;
          clients[url][i].writeIdx = latestId;

          const payload = JSON.stringify({
            action: "WRITE_HISTORY",
            writeHistory: rows.map((row) => JSON.parse(row.event))
          });
          ws.send(payload);
        }
      });
    });
  });
}, 500);

server.listen(process.env.SERVER_PORT || 8080, () =>
  console.log(`Server started on port ${server.address().port}`)
);

process.on("SIGINT", function () {
  clearInterval(intervalTimeout);
  closeDB().then(() => process.exit());

  setTimeout(() => process.exit(), 100);
});
