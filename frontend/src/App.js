import React, { useState, useEffect } from 'react';
import Crossword from "./Crossword";
import crosswordUrl from "./crossword.jpg";
import './App.css';

function App() {
  const [crosswordImage, setCrosswordImage] = useState(null);

  useEffect(() => {
    const crossword = new Image();
    crossword.src = crosswordUrl;
    crossword.onload = () => {
      setCrosswordImage(crossword);
    };
  }, []);

  return (
    <div className="app">
      { crosswordImage && <Crossword image={crosswordImage} /> }
    </div>
  );
}

export default App;
