import React from "react";
import "./ErrorPopupIfWebSocketClosed.css";

const ErrorPopupIfWebSocketClosed: React.FC<{
  readyState: number;
}> = (props) => {
  if (props.readyState !== WebSocket.CLOSED) {
    return null;
  }
  return (
    <ErrorMessagePopup
      title="Anslutningen avbröts"
      message="Prova att ladda om sidan på nytt"
    />
  );
};

const ErrorMessagePopup: React.FC<{ title: string; message: string }> = (
  props
) => (
  <div className="dim-background">
    <div className="error-popup">
      <i className="fa fa-exclamation-triangle fa-3x"></i>
      <p className="error-header">{props.title}</p>
      <p className="error-message">{props.message}</p>
    </div>
  </div>
);

export default ErrorPopupIfWebSocketClosed;
