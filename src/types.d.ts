import User from "./models/User"; // Adjust this path

declare global {
  namespace Express {
    interface Request {
      user?: User; // Add the type for your user here
      io: any;
    }
  }
}
