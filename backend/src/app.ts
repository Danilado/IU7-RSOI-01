import express, { Express, NextFunction, Request, Response } from "express";
import path from "path";
import { PersonRepository } from "./person/model";
import { personRouter } from "./person/router";

export interface AppOptions {
  /** Directory with the built frontend; when omitted only the API is served. */
  staticDir?: string;
}

export function createApp(repository: PersonRepository, options: AppOptions = {}): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json());

  app.use((error: unknown, _request: Request, response: Response, next: NextFunction) => {
    if (error instanceof SyntaxError) {
      response.status(400).json({ message: "Invalid data", errors: { body: "must be a valid JSON" } });
      return;
    }
    next(error);
  });

  app.get("/manage/health", (_request: Request, response: Response) => {
    response.status(200).json({ status: "UP" });
  });

  app.use("/api/v1/persons", personRouter(repository));

  app.use("/api", (_request: Request, response: Response) => {
    response.status(404).json({ message: "Unknown endpoint" });
  });

  if (options.staticDir) {
    const staticDir = options.staticDir;
    app.use(express.static(staticDir));
    app.get("*", (_request: Request, response: Response) => {
      response.sendFile(path.join(staticDir, "index.html"));
    });
  }

  return app;
}
