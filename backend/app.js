"use strict";

const WebSocket = require("ws");
const express = require("express");
const http = require("http");

const restApiRouter = require("./restApi");

const {
  addDrawEvent,
  getAllDrawEvents,
  addWriteEvent,
  getLatestWriteEvents,
  closeDB,
  db
} = require("./db");

const enableCORS = (res) => {
  // TODO: Update the origin list once we use the API for something important
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
};

const app = express();

app.use((req, res, next) => {
  enableCORS(res);
  next();
});

app.use("/", express.static("../frontend/build/"));
app.use("/api", restApiRouter);
app.use("/uploads", express.static("uploads/"));
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
    } else if (event.action === "REQUEST_HISTORY") {
      getAllDrawEvents(url, (drawingHistoryString) => {
        const drawingHistory = JSON.parse(drawingHistoryString);
        ws.send(
          JSON.stringify({
            action: "DRAWING_HISTORY",
            drawingHistory
          })
        );
      });

      getLatestWriteEvents(url, -1, (rows) => {
        if (rows.length > 0) {
          const latestId = rows[rows.length - 1].id;

          const currentClient = clients[url].find((client) => client.ws === ws);
          currentClient.writeIdx = latestId;

          const payload = JSON.stringify({
            action: "WRITE_HISTORY",
            writeHistory: rows.map((row) => JSON.parse(row.event))
          });
          ws.send(payload);
        }
      });
    } else if (event.action === "WRITE_EVENT") {
      db.serialize(() => {
        addWriteEvent(url, JSON.stringify(event.event));

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
      });
    }
  });
});

server.listen(process.env.SERVER_PORT || 8080, () =>
  console.log(`Server started on port ${server.address().port}`)
);

process.on("SIGINT", function () {
  closeDB().then(() => process.exit());

  setTimeout(() => process.exit(), 100);
});
