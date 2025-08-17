import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import passport from "passport";
import { initializeDatabase, getPool } from "./db-conditional";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { configureAuth } from "./auth";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize database
initializeDatabase();

// Session configuration
let sessionConfig: any = {
  secret: process.env.SESSION_SECRET || 'navodaya-connection-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

// Use PostgreSQL session store if database is available, otherwise use memory store
const pool = getPool();
if (pool) {
  const PgSession = connectPgSimple(session);
  sessionConfig.store = new PgSession({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: true,
  });
  console.log("Using PostgreSQL session store");
} else {
  console.log("Using memory session store");
}

app.use(session(sessionConfig));

// Configure Passport authentication strategies
configureAuth();

// Initialize Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Extend session interface for TypeScript
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve the app on port from environment or default to 5000
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
  server.listen(port, "localhost", () => {
    log(`serving on http://localhost:${port}`);
  });
})();
