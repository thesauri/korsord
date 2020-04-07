const prod = {
  BACKEND_URL: `${window.location.protocol}//${window.location.host}`,
  WS_URL: `ws://${window.location.host}`
};

const dev = {
  BACKEND_URL: `${window.location.protocol}//${window.location.hostname}:${
    process.env.SERVER_PORT || 8080
  }`,
  WS_URL: `ws://${window.location.hostname}:${process.env.SERVER_PORT || 8080}`
};

export const config = process.env.NODE_ENV === "development" ? dev : prod;
