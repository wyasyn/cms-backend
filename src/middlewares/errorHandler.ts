import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map(
      (error: any) => error.message
    );
    return res
      .status(400)
      .json({ message: "Validation Error", errors: messages });
  }

  if (err.code === 11000) {
    return res.status(400).json({ message: "Duplicate entry" });
  }

  res.status(500).json({ message: "Internal server error" });
};
