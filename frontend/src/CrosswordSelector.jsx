import React, { useState, useEffect } from "react";
import moment from "moment";
import { config } from "./Constants";
import "./CrosswordSelector.css";
import { useHistory } from "react-router-dom";
import { getAllCrosswords, createNewGame } from "./restApi";

const CrosswordSelector = () => {
  const crosswords = useCrosswords();
  const [selectedCrossword, setSelectedCrossword] = useState(null);
  const history = useHistory();

  const onNewGame = (crosswordId) => {
    if (selectedCrossword !== null) {
      return;
    }
    const createAndStartNewGame = async () => {
      const { gameId } = await createNewGame(crosswordId);
      history.push(`/game/${gameId}`);
    };
    setSelectedCrossword(crosswordId);
    createAndStartNewGame();
  };

  return (
    <div className="crosswordselector">
      {crosswords.map((crossword) => (
        <a
          className="crosswordselector-card"
          key={crossword.crosswordId}
          onClick={() => onNewGame(crossword.crosswordId)}
        >
          <img
            className="crosswordselector-card-image"
            src={`${config.BACKEND_URL}/${crossword.imageUrl}`}
          />
          <p className="crosswordselector-card-link" href="#">
            {selectedCrossword === crossword.crosswordId
              ? "Öppnar..."
              : `${crossword.newspaper} ${moment(
                  crossword.publishedDate
                ).format("DD.MM.YYYY")}`}
          </p>
        </a>
      ))}
    </div>
  );
};

const useCrosswords = () => {
  const [crosswords, setCrosswords] = useState([]);

  const fetchAndUpdateCrosswords = async () => {
    const crosswords = await getAllCrosswords();
    setCrosswords(crosswords);
  };

  useEffect(() => {
    fetchAndUpdateCrosswords();
  }, []);

  return crosswords;
};

export default CrosswordSelector;
