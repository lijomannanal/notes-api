# Notes app

## Prerequisites

- NodeJS v20
- Tyepscript v5.8
- MongoDB

## Steps to run the app

In the project directory,

1.  Install dependencies

### `npm install`

2. Configure environment variables by creating .env in the project root directory

   ```
   PORT=5000
   NODE_ENV=production
   JWT_KEY=<value>>
   REFRESH_JWT_KEY=<value>
   SOCKET_CLIENT_URL=http://localhost:5173
   DB_URL=mongodb://localhost:27017/notes-db

   ```

   Use proper secret values for JWT_KEY & REFRESH_JWT_KEY

3. Build the app

### `npm run build`

4. Run the app

### `npm start`
