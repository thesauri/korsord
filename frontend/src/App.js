import React, { useState, useEffect } from "react";
import Crossword from "./Crossword";
import "./App.css";
import { useParams } from "react-router-dom";
import { config } from "./Constants";

function App() {
  const [crosswordImage, setCrosswordImage] = useState(null);
  const { url } = useParams();

  useEffect(() => {
    const getGameAndImage = async () => {
      const crossword = await getGame(url);
      const crosswordImage = new Image();
      crosswordImage.src = `${config.BACKEND_URL}/${crossword["image_url"]}`;
      crosswordImage.onload = () => {
        setCrosswordImage(crosswordImage);
      };
    };
    getGameAndImage();
  }, []);

  return (
    <div className="app">
      {crosswordImage && url && <Crossword image={crosswordImage} url={url} />}
    </div>
  );
}

const getGame = async (gameId) => {
  const response = await fetch(`${config.BACKEND_URL}/api/game/${gameId}`);
  const { crossword } = await response.json();
  return crossword;
};

export default App;
