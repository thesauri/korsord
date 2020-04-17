# korsord

Solve crosswords collaboratively.

## Development

1. In the root directory, install the dependencies using `yarn`
2. Run the migration scripts in `backend/migrations` individually in alphabetical order with `sqlite3 backend/app.db backend/migrations/migration_name.sql`
3. Start continuous building of the types: `yarn types start`
4. In a new tab, start the backend server: `yarn backend start`
5. In a new tab, start the frontend: `yarn frontend start`
6. View the page at `http://localhost:3000`

## Deployment

1. In the root directory, build the project with `yarn build`
2. Run with `yarn backend start`
3. If desired, configure the server port using the environment variable `SERVER_PORT` or specify the secret token for publishing crosswords as `ADMIN_TOKEN`. Do this by specifying them in `.env` or as environment variables.

## Stack overview

The project consists of two parts: a frontend and a backend server. The frontend and backend communicate using an REST API and WebSockets where all traffic passes through the backend (i.e., the clients do not communicate directly with each other).

### Frontend

React. The crosswords as well as any lines and text are drawn on canvases.

### Backend

Node. Express for serving static files. Data is persisted with SQLite.

## Adding crosswords

Crossword files (images and square metadata) are stored in the `backend/uploads/` directory. Entries in the `Crosswords` table refer to these files and provide extra data such newspaper and published date.

Adding crosswords is currently only possible by manually transfering the files to the server and calling the API.

First, transfer the crossword image file and the associated square metadata file to the `uploads/` directory. This can be done with e.g. SCP.

Then, do a POST request to `/api/crossword`:

``` bash
# Add one of the example crosswords like this
curl -X POST localhost:8080/api/crossword -H "Content-Type: application/json" --data '{ "newspaper": "HBL", "publishedDate": "2020-04-03", "imageUrl": "uploads/2020-03-27/crossword.jpg", "metadataUrl": "uploads/2020-03-27/metadata.json", "adminToken": "simple_example_token" }'
```

`adminToken` is an access token that is set according to the `ADMIN_TOKEN` environment variable on the server.

Note that the backend has to be running when when adding crosswords, playing etc.
Either define the `ADMIN_TOKEN` in the command line with `ADMIN_TOKEN=my-token yarn start` or by changing it in the .env file file in the backend root directory. 
