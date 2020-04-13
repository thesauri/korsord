import React from "react";
import "./ConnectionErrorPopup.css";

const ErrorMessagePopup = (props) => (
  <div className="dim-background">
    <div className="error-popup">
      <i className="fa fa-exclamation-triangle fa-3x"></i>
      <p className="error-header">{props.title}</p>
      <p className="error-message">{props.message}</p>
    </div>
  </div>
);

export const ConnectionErrorPopup = () => (
  <ErrorMessagePopup
    title="Anslutningen avbröts"
    message="Prova att ladda om sidan på nytt"
  />
);
