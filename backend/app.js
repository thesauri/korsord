const WebSocket = require("ws");
const express = require("express");
const http = require("http");

const app = express();
app.use("/", express.static("../frontend/build/"));
app.use("*", express.static("../frontend/build/"));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./app.db", (err) => {
  if (err) {
    console.error(err.message);
    process.exit();
  }
  console.log("Connected to the SQlite database.");
});

db.run(
  "create table if not exists events (" +
    "id integer primary key," +
    "url text," +
    "event text" +
    ");",
  (err) => {
    if (err) console.log(err);
  }
);

const addEvent = (url, event) => {
  db.run(
    "insert into events(url, event) values(?, ?);",
    [url, event],
    (err) => {
      if (err) console.log(err);
    }
  );
};

const getAllEvents = (url, callback) => {
  db.all(
    "select event from events where url = ? order by id asc;",
    url,
    (err, rows) => {
      if (err) console.log(err);
      const rowsString = "[" + rows.map((r) => r.event).join(",") + "]";
      callback(rowsString);
    }
  );
};

clients = {};

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
      clients[url].push(ws);
      return;
    }

    if (clients[url] === undefined) {
      console.error("Drawing action to nonexistent url");
      return;
    }

    if (clients[url].find((w) => w === ws) === undefined) {
      console.error("Drawing action to incorrect url");
      return;
    }

    if (event.action === "START_DRAWING" || event.action === "DRAWING") {
      addEvent(url, JSON.stringify(event));

      clients[url].forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(event));
        }
      });
    } else if (event.action === "REQUEST_DRAWING_HISTORY") {
      getAllEvents(url, (drawingHistoryString) => {
        const drawingHistory = JSON.parse(drawingHistoryString);
        const payload = JSON.stringify({
          action: "DRAWING_HISTORY",
          drawingHistory,
        });
        ws.send(payload);
      });
    }
  });
});

server.listen(process.env.PORT || 8080, () =>
  console.log(`Server started on port ${server.address().port}`)
);

process.on("SIGINT", function () {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log("Close the database connection.");
    }

    process.exit();
  });

  setTimeout(() => process.exit(), 100);
});
