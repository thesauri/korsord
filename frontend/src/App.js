import React, { useState, useEffect } from "react";
import Crossword from "./crossword/Crossword";
import "./App.css";
import { useParams, useHistory } from "react-router-dom";
import { config } from "./Constants";
import { getCrosswordForGame, getMetadata } from "./restApi";

function App() {
  const [crosswordImage, setCrosswordImage] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const { url } = useParams();
  const history = useHistory();

  useEffect(() => {
    const getGameAndImage = async () => {
      let crossword;
      try {
        crossword = await getCrosswordForGame(url);
      } catch (error) {
        console.error("Game not found, redirecting to home page");
        history.push("/");
        return;
      }
      const metadata = await getMetadata(crossword.metadataUrl);
      setMetadata(metadata);
      const crosswordImage = new Image();
      crosswordImage.src = `${config.BACKEND_URL}/${crossword.imageUrl}`;
      crosswordImage.onload = () => {
        setCrosswordImage(crosswordImage);
      };
    };
    getGameAndImage();
  }, [url, history]);

  return (
    <div className="app">
      {crosswordImage && metadata && url && (
        <Crossword image={crosswordImage} metadata={metadata} url={url} />
      )}
    </div>
  );
}

export default App;
