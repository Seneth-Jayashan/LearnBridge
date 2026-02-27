import { z } from "zod";

export const validate = (schema) => (req, res, next) => {
  try {
    // Parse the request body against the schema
    // strip() removes unknown keys to prevent pollution
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format Zod errors into a readable array (Zod exposes errors via `issues`)
      const errors = error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return res.status(400).json({ message: "Validation Error", errors });
    }
    next(error);
  }
};