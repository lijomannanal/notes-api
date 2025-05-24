// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import User from "../models/User";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new Error("Token missing!");
    }
    const decoded = jwt.verify(
      token,
      process.env.JWT_KEY as Secret
    ) as JwtPayload;
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new Error("User not found!");
    }
    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    res.status(401).send({ error: "Authentication failed." });
  }
};
