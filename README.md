# korsord

Solve crosswords collaboratively.

## Development 
In the backend directory, install the dependencies using `yarn` and run using `yarn start`. Keep the backend running the background.

In the frontend directory, install the dependencies using `yarn` and run using `yarn start`. View the page on `http://localhost:3000`.

## Deployment
Build the frontend using `yarn build`. The built files will appear in `frontend/build/`. 

The backend server acts as production server and serves static files from `../frontend/build`.

Run it using `yarn start`. If desired, specify the server port using the environment variable `SERVER_PORT`.

## Stack overview
The project consists of two parts: a frontend and a backend server. The frontend and backend communicate using WebSockets and all traffic passes through the backend (i.e., the clients do not communicate directly with each other).

### Frontend
React. The crosswords as well as any lines and text are drawn on canvases.

### Backend
Node. Express for serving static files. Data is persisted with SQLite.
