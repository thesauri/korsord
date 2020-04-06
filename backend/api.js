"use strict";
const router = require("express").Router();
const jsonParser = require("express").json();

const enableCORS = (res) => {
  // TODO: Update the origin list once we use the API for something important
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
};

router.use((req, res, next) => {
  enableCORS(res);
  next();
});

router.use(jsonParser);

router.get("/crosswords", (req, res) => {
  const response = [
    {
      crosswordId: 2,
      newspaper: "HBL",
      date: "2020-04-03",
      image_url: "uploads/2020-04-03/crossword.jpg",
      metadata_url: "uploads/2020-04-04/squares.json"
    },
    {
      crosswordId: 1,
      newspaper: "HBL",
      date: "2020-03-27",
      image_url: "uploads/2020-03-27/crossword.jpg",
      metadata_url: "uploads/2020-03-27/squares.json"
    }
  ];
  res.contentType = "application/json";
  res.send(JSON.stringify(response));
});

router.post("/game", (req, res) => {
  const { crosswordId } = req.body;
  const response = {
    gameId: "test-fox-blue",
    crosswordId: crosswordId
  };
  res.contentType = "application/json";
  res.send(JSON.stringify(response));
});

module.exports = router;
