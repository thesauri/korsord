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

db.run(
  "create table if not exists writeEvents (" +
    "id integer primary key," +
    "url text," +
    "event text" +
    ");",
  (err) => {
    if (err) console.log(err);
  }
);

const addDrawEvent = (url, event) => {
  db.run(
    "insert into events(url, event) values(?, ?);",
    [url, event],
    (err) => {
      if (err) console.log(err);
    }
  );
};

const getAllDrawEvents = (url, callback) => {
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

const addWriteEvent = (url, event) => {
  db.run(
    "insert into writeEvents(url, event) values(?, ?);",
    [url, event],
    (err) => {
      if (err) console.log(err);
    }
  );
};

const getLatestWriteEvents = (url, writeIdx, callback) => {
  db.all(
    "select id, event from writeEvents where url = ? and id > ? order by id asc;",
    [url, writeIdx],
    (err, rows) => {
      if (err) console.log(err);
      callback(rows);
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
    urlClients = clients[url];
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
}, 2000);

server.listen(process.env.SERVER_PORT || 8080, () =>
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
  clearInterval(intervalTimeout);

  setTimeout(() => process.exit(), 100);
});
