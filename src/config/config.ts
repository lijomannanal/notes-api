import dotenv from "dotenv";

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  socketClientUrl: string;
  dbUrl: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  socketClientUrl: process.env.SOCKET_CLIENT_URL || "development",
  dbUrl: process.env.DB_URL || "mongodb://localhost:27017/notes-db",
};

export default config;
