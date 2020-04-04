import React, { useState, useEffect } from "react";
import Crossword from "./Crossword";
import crosswordUrl from "./crossword.jpg";
import "./App.css";
import { useParams } from "react-router-dom";

function App() {
  const [crosswordImage, setCrosswordImage] = useState(null);
  const { url } = useParams();

  useEffect(() => {
    const crossword = new Image();
    crossword.src = crosswordUrl;
    crossword.onload = () => {
      setCrosswordImage(crossword);
    };
  }, []);

  return (
    <div className="app">
      {crosswordImage && url && <Crossword image={crosswordImage} url={url} />}
    </div>
  );
}

export default App;
