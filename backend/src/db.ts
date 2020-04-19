import sqlite3 from "sqlite3";
import { Crossword } from "types";

export const db = new sqlite3.Database("./app.db", (err) => {
  if (err) {
    console.error(err.message);
    process.exit();
  }
  console.log("Connected to the SQlite database.");
});

export const closeDB = () => {
  return new Promise((resolve, _) => {
    db.close((err) => {
      if (err) {
        console.error(err.message);
      } else {
        console.log("Closed the database connection.");
      }

      resolve();
    });
  });
};

db.serialize(() => {
  db.run(
    "create table if not exists eventTypes(" +
      "typeId integer primary key," +
      "type text unique not null" +
      ");",
    (err) => {
      if (err) console.error(err);
    }
  );
  db.run(
    "insert or ignore into eventTypes(typeId, type) values (0, 'DRAW');",
    (err) => {
      if (err) console.error(err);
    }
  );
  db.run(
    "insert or ignore into eventTypes(typeId, type) values (1, 'WRITE');",
    (err) => {
      if (err) console.error(err);
    }
  );

  db.run(
    "create table if not exists events (" +
      "id integer primary key," +
      "url text," +
      "eventType int," +
      "event text," +
      "foreign key(eventType) references eventTypes(typeId)" +
      ");",
    (err) => {
      if (err) console.error(err);
    }
  );

  db.run(
    "create table if not exists crosswords (" +
      "crosswordId integer primary key," +
      "newspaper text not null," +
      "publishedDate text not null," +
      "imageUrl text not null," +
      "metadataUrl text not null" +
      ");",
    (err) => {
      if (err) console.error(err);
    }
  );

  db.run(
    "create table if not exists games (" +
      "url text primary key," +
      "crossword integer not null," +
      "foreign key(crossword) references crosswords(crosswordId)" +
      ");",
    (err) => {
      if (err) console.error(err);
    }
  );
});

export const addDrawEvent = (url: string, event: string) => {
  db.run(
    "insert into events(url, event, eventType) values(?, ?, 0);",
    [url, event],
    (err) => {
      if (err) console.log(err);
    }
  );
};

export const getAllDrawEvents = (
  url: string,
  callback: (drawEvents: string) => void
) => {
  db.all(
    "select event from events where url = ? and eventType = 0 order by id asc;",
    url,
    (err, rows) => {
      if (err) console.log(err);
      const rowsString = "[" + rows.map((r) => r.event).join(",") + "]";
      callback(rowsString);
    }
  );
};

export const addWriteEvent = (url: string, event: string) => {
  db.run(
    "insert into events(url, event, eventType) values(?, ?, 1);",
    [url, event],
    (err) => {
      if (err) console.log(err);
    }
  );
};

export const getLatestWriteEvents = (
  url: string,
  writeIdx: number,
  callback: (writeEvents: { id: number; event: string }[]) => void
) => {
  db.all(
    "select id, event from events where url = ? and id > ? and eventType = 1 order by id asc;",
    [url, writeIdx],
    (err, rows) => {
      if (err) console.log(err);
      callback(rows);
    }
  );
};

export const addCrossword = (
  crossword: Crossword,
  callback: (error: Error | null) => void
) => {
  const { newspaper, publishedDate, imageUrl, metadataUrl } = crossword;
  db.run(
    "insert into crosswords(newspaper, publishedDate, imageUrl, metadataUrl) values (?, ?, ?, ?);",
    [newspaper, publishedDate, imageUrl, metadataUrl],
    (err) => {
      if (err) console.log(err);
      callback(err);
    }
  );
};

export const getCrossword = (
  crosswordId: number,
  callback: (error: Error | null, crossword: Crossword | null) => void
) => {
  db.all(
    "select crosswordId, newspaper, publishedDate, imageUrl, metadataUrl from crosswords where crosswordId = ?;",
    [crosswordId],
    (err, rows: Crossword[]) => {
      if (err || rows.length !== 1) {
        console.log(err);
        callback(err, null);
        return;
      }
      callback(null, rows[0]);
    }
  );
};

export const getCrosswords = (callback: (crosswords: Crossword[]) => void) => {
  db.all(
    "select crosswordId, newspaper, publishedDate, imageUrl, metadataUrl from crosswords order by publishedDate desc;",
    (err, rows) => {
      if (err) console.log(err);
      callback(rows);
    }
  );
};

export const addGame = (
  url: string,
  crosswordId: number,
  callback: (error: Error | null) => void
) => {
  db.run(
    "insert into games(url, crossword) values (?, ?);",
    [url, crosswordId],
    (err) => {
      if (err) console.log(err);
      callback(err);
    }
  );
};

export const getGame = (
  url: string,
  callback: (
    error: Error | null,
    game: { url: string; crossword: number } | null
  ) => void
) => {
  db.all(
    "select url, crossword from games where url = ?;",
    [url],
    (err, rows) => {
      if (err || rows.length !== 0) {
        console.log(err);
        callback(err, null);
        return;
      }
      callback(null, rows[0]);
    }
  );
};
