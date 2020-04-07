import React from "react";
import CrosswordSelector from "./CrosswordSelector";
import "./Home.css";

const Home = () => {
  return (
    <section className="home">
      <h1>TF:s fredagskorsord</h1>
      <CrosswordSelector />
      <p className="home-divider">eller</p>
      <p>
        Be en kompis skicka en länk till sitt korsord och öppna den i din
        webbläsare
      </p>
    </section>
  );
};

export default Home;
