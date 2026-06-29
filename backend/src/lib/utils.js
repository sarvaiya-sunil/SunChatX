import jwt from "jsonwebtoken";
import { ENV } from "./env.js";

const isProduction = ENV.NODE_ENV === "production";

export const getCookieOptions = () => ({
  maxAge: 7 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: isProduction,
  sameSite: "none",
});

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, ENV.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, getCookieOptions());

  return token;
};
