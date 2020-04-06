import { config } from "./Constants";

export const createNewGame = async (crosswordId) => {
  const requestBody = JSON.stringify({
    crosswordId
  });
  const response = await fetch(`${config.BACKEND_URL}/api/game`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: requestBody
  });
  const responseData = await response.json();
  return responseData;
};

export const getAllCrosswords = async () => {
  const crosswords = await fetch(`${config.BACKEND_URL}/api/crosswords`);
  return await crosswords.json();
};

export const getCrosswordForGame = async (gameId) => {
  const response = await fetch(`${config.BACKEND_URL}/api/game/${gameId}`);
  const { crossword } = await response.json();
  return crossword;
};
