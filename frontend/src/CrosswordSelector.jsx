import React, { useState, useEffect } from "react";
import moment from "moment";
import { config } from "./Constants";
import "./CrosswordSelector.css";

const useCrosswords = () => {
  const [crosswords, setCrosswords] = useState([]);

  const fetchAndUpdateCrosswords = async () => {
    const crosswords = await (
      await fetch(`${config.BACKEND_URL}/api/crosswords`)
    ).json();
    setCrosswords(crosswords);
  };

  useEffect(() => {
    fetchAndUpdateCrosswords();
  }, []);

  return crosswords;
};

const CrosswordSelector = () => {
  const crosswords = useCrosswords();
  return (
    <div className="crosswordselector">
      {crosswords.map((crossword) => (
        <a
          className="crosswordselector-card"
          key={`${crossword.newspaper} ${crossword.date}`}
        >
          <img
            className="crosswordselector-card-image"
            src={`${config.BACKEND_URL}/${crossword.image_url}`}
          />
          <p className="crosswordselector-card-link" href="#">
            {crossword.newspaper} {moment(crossword.date).format("DD.MM.YYYY")}
          </p>
        </a>
      ))}
    </div>
  );
};

export default CrosswordSelector;
