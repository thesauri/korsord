const prod = {
  WS_URL: "ws://example.com"
};

const dev = {
  WS_URL: "ws://localhost:" + (process.env.SERVER_PORT || 8080)
};

export const config = process.env.NODE_ENV === "development" ? dev : prod;
