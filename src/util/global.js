import dotenv from "dotenv";
import path from "path";

export const MODE = process.env.NODE_ENV || "production";

dotenv.config({
  path: path.join(path.resolve(), ".env"),
});
dotenv.config({
  path: path.join(path.resolve(), `.env.${MODE}`),
});

export const HOST = process.env.HOST;
export const PORT = Number(process.env.PORT) || 5000;
