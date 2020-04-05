"use strict";
const router = require("express").Router();

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

router.get("/crosswords", (req, res) => {
  const response = [
    {
      newspaper: "HBL",
      date: "2020-04-03",
      image_url: "uploads/2020-04-03/crossword.jpg",
      metadata_url: "uploads/2020-04-04/squares.json"
    },
    {
      newspaper: "HBL",
      date: "2020-03-27",
      image_url: "uploads/2020-03-27/crossword.jpg",
      metadata_url: "uploads/2020-03-27/squares.json"
    }
  ];
  res.contentType = "application/json";
  res.send(JSON.stringify(response));
});

module.exports = router;
