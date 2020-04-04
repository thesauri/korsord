const prod = {
  WS_URL: `ws://${window.location.host}`
};

const dev = {
  WS_URL: `ws://${window.location.hostname}:${process.env.SERVER_PORT || 8080}`
};

export const config = process.env.NODE_ENV === "development" ? dev : prod;
