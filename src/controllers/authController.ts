import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import jwt, { Secret, JwtPayload } from "jsonwebtoken";
import User, { IUser } from "../models/User";

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const registerSchema = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string()
      .pattern(new RegExp("^(?=.*?[A-Z])(?=.*?[#?!@$%^&*-]).{6,10}$"))
      .messages({
        "string.pattern.base":
          "Password must contain least one upper case letter, one special character and should be between 6 to 10 characters",
      })
      .required(),
    confirmPassword: Joi.any()
      .equal(Joi.ref("password"))
      .required()
      .label("Confirm Password")
      .messages({ "any.only": "{{#label}} does not match" }),
  }).required();
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }
    const { name, username, password } = req.body;
    const userExist = await User.findOne({ username });
    if (userExist) {
      res.status(404).json({
        status: 400,
        success: false,
        error: "username already exist!",
      });
      return;
    }
    const user = new User({ name, username, password });
    await user.save();
    console.log("User registered:", user);
    res.status(201).json(user);
    return;
  } catch (error) {
    res.status(500).json({ error: `Something went wrong! ${error}` });
    return;
  }
};

const generateAccessToken = (user: IUser) => {
  const token = jwt.sign(
    { userId: user._id, name: user.name, username: user.username },
    process.env.JWT_KEY as Secret,
    {
      expiresIn: "30m",
    }
  );
  return token;
};

const generateRefreshToken = (user: IUser) => {
  const refreshToken = jwt.sign(
    { userId: user._id, username: user.username },
    process.env.REFRESH_JWT_KEY as Secret,
    {
      expiresIn: "90d",
    }
  );
  return refreshToken;
};

export const loginUser = async (req: Request, res: Response) => {
  const loginSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  }).required();
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      res.status(404).json({
        status: 404,
        success: false,
        error: "User not found",
      });
      return;
    }
    const isMatched = await user.isValidPassword(password);
    if (!isMatched) {
      res.status(400).json({
        status: 400,
        success: false,
        error: "Invalid credentials",
      });
      return;
    }
    const token = generateAccessToken(user as unknown as IUser);
    const refreshToken = generateRefreshToken(user as unknown as IUser);

    res.status(200).json({
      success: true,
      token,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ error: `Something went wrong! ${error}` });
    return;
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const schema = Joi.object({
    refreshToken: Joi.string().required(),
  }).required();
  try {
    const { error } = schema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }
    const { refreshToken } = req.body;
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_JWT_KEY as Secret
    ) as JwtPayload;
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new Error("User not found!");
    }
    const token = generateAccessToken(user as unknown as IUser);

    res.status(200).json({
      success: true,
      token,
    });
  } catch (error) {
    res.status(500).json({ error: `Something went wrong! ${error}` });
    return;
  }
};
