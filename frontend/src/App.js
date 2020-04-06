import React, { useState, useEffect } from "react";
import Crossword from "./Crossword";
import "./App.css";
import { useParams } from "react-router-dom";
import { config } from "./Constants";
import { getCrosswordForGame } from "./restApi";

function App() {
  const [crosswordImage, setCrosswordImage] = useState(null);
  const { url } = useParams();

  useEffect(() => {
    const getGameAndImage = async () => {
      const crossword = await getCrosswordForGame(url);
      const crosswordImage = new Image();
      crosswordImage.src = `${config.BACKEND_URL}/${crossword.imageUrl}`;
      crosswordImage.onload = () => {
        setCrosswordImage(crosswordImage);
      };
    };
    getGameAndImage();
  }, [url]);

  return (
    <div className="app">
      {crosswordImage && url && <Crossword image={crosswordImage} url={url} />}
    </div>
  );
}

export default App;
