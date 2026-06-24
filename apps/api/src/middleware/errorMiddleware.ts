import type { ErrorRequestHandler } from "express";

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  const message = error instanceof Error ? error.message : "Unknown server error";
  res.status(500).json({
    error: {
      code: "internal_error",
      message
    }
  });
};
