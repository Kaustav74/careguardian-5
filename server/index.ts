import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from "cors";

const app = express();

// Configure CORS for development
app.use(cors({
  origin: ['http://localhost:5000', 'http://localhost:5173', 'https://careguardian-healthcare.replit.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
    console.error("Server error:", err);
    
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Add specific error details for debugging in development
    const errorResponse: any = { 
      message,
      status
    };
    
    // Add more details in development mode
    if (app.get("env") === "development") {
      errorResponse.stack = err.stack;
      if (err.errors) {
        errorResponse.errors = err.errors;
      }
    }

    res.status(status).json(errorResponse);
    
    // Don't throw the error again as it will crash the server
    // in production and create unhandled promise rejections
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Get port from environment variable or use default
  // Replit workflow looks for port 5000 by default
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  
  // Use 0.0.0.0 to allow connections from all interfaces
  server.listen(port, '0.0.0.0', () => {
    log(`Server running on port ${port}`);
    log(`- Local: http://localhost:${port}`);
    log(`- External: Access via your network IP on port ${port}`);
  });
})();
