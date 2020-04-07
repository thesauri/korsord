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

## Adding crosswords

Crossword files (images and square metadata) are stored in the `backend/uploads/` directory. Entries in the `Crosswords` table refer to these files and provide extra data such newspaper and published date.

Adding crosswords is currently only possible by manually transfering the files to the server and calling the API.

First, transfer the crossword image file and the associated square metadata file to the `uploads/` directory. This can be done with e.g. SCP.

Then, do a POST request to `/api/crossword`:

```
curl -X POST backendurl.tld:port/api/crossword -H "Content-Type: application/json" --data '{ "newspaper": "HBL", "publishedDate": "2020-04-03", "imageUrl": "uploads/blablabla.jpg", "metadataUrl": "uploads/blablabla.json", "adminToken": "secret here" }'
```

`adminToken` is an access token that is set according to the `ADMIN_TOKEN` environment variable on the server.
