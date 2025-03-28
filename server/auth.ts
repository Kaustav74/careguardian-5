import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { hashPassword, comparePasswords } from "./utils/passwordUtils";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupAuth(app: Express) {
  // Ensure session secret is set
  const sessionSecret = process.env.SESSION_SECRET || "careguidian-secret-key";
  console.log("Session secret configured", sessionSecret ? "(from environment)" : "(using default)");

  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      httpOnly: true,
      secure: false, // Setting to false for development
      sameSite: 'lax',
      path: '/',
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log("LocalStrategy - Attempting to authenticate user:", username);
        
        if (!username || !password) {
          console.log("LocalStrategy - Missing username or password");
          return done(null, false, { message: "Username and password are required" });
        }
        
        try {
          const user = await storage.getUserByUsername(username);
          if (!user) {
            console.log("LocalStrategy - User not found:", username);
            return done(null, false, { message: "Invalid username or password" });
          }
          
          try {
            const passwordMatches = await comparePasswords(password, user.password);
            if (!passwordMatches) {
              console.log("LocalStrategy - Invalid password for user:", username);
              return done(null, false, { message: "Invalid username or password" });
            }
            
            console.log("LocalStrategy - Authentication successful for user:", username);
            return done(null, user);
          } catch (passwordError) {
            console.error("LocalStrategy - Error comparing passwords:", passwordError);
            return done(passwordError);
          }
        } catch (userLookupError: any) {
          console.error("LocalStrategy - Error retrieving user:", userLookupError);
          
          // Handle database connection errors specifically
          if (userLookupError.code === 'ECONNREFUSED' || 
              userLookupError.code === 'ECONNRESET' || 
              userLookupError.message?.includes('database') || 
              userLookupError.message?.includes('connection')) {
            
            console.error("LocalStrategy - Database connection error detected");
            return done(null, false, { 
              message: "Authentication service temporarily unavailable. Please try again later."
            });
          }
          
          return done(userLookupError);
        }
      } catch (error) {
        console.error("LocalStrategy - Unexpected error:", error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    console.log("Serializing user:", user.id);
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log("Deserializing user:", id);
      try {
        const user = await storage.getUser(id);
        if (!user) {
          console.error("Deserialize - User not found:", id);
          return done(null, false);
        }
        console.log("Deserialize - User found:", id);
        done(null, user);
      } catch (dbError: any) {
        console.error("Deserialize - Database error:", dbError);
        
        // For database connection errors, fail gracefully without throwing error
        if (dbError.code === 'ECONNREFUSED' || 
            dbError.code === 'ECONNRESET' || 
            dbError.message?.includes('database') || 
            dbError.message?.includes('connection')) {
          console.error("Deserialize - Database connection error detected");
          // Return false to indicate user not found, but don't throw an error that would crash the app
          return done(null, false);
        }
        
        // For other errors, pass the error up
        throw dbError;
      }
    } catch (error) {
      console.error("Deserialize - Unexpected error:", error);
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log("Registration request received:", JSON.stringify(req.body));
      
      // Extend the schema to validate password requirements
      const registerSchema = insertUserSchema.extend({
        password: z.string().min(6, "Password must be at least 6 characters long"),
        email: z.string().email("Invalid email format"),
      });
      
      try {
        var validatedData = registerSchema.parse(req.body);
      } catch (validationError) {
        console.error("Validation error:", validationError);
        if (validationError instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid registration data", errors: validationError.errors });
        }
        throw validationError;
      }
      
      // Check if username or email already exists
      try {
        const existingUsername = await storage.getUserByUsername(validatedData.username);
        if (existingUsername) {
          console.log("Username already exists:", validatedData.username);
          return res.status(400).json({ message: "Username already exists" });
        }
        
        const existingEmail = await storage.getUserByEmail(validatedData.email);
        if (existingEmail) {
          console.log("Email already exists:", validatedData.email);
          return res.status(400).json({ message: "Email already exists" });
        }
      } catch (lookupError) {
        console.error("Error checking existing user:", lookupError);
        throw lookupError;
      }

      try {
        const hashedPassword = await hashPassword(validatedData.password);
        const user = await storage.createUser({
          ...validatedData,
          password: hashedPassword,
        });
        
        console.log("User created successfully:", user.id);

        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error("Login error after registration:", loginErr);
            return next(loginErr);
          }
          console.log("User logged in after registration");
          return res.status(201).json(user);
        });
      } catch (createError) {
        console.error("Error creating user:", createError);
        throw createError;
      }
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Registration failed. Please try again later." });
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log("Login request received:", JSON.stringify(req.body));
    
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) {
        console.error("Authentication error:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("Authentication failed - invalid credentials");
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      console.log("User authenticated successfully:", user.id);
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Session login error:", loginErr);
          return next(loginErr);
        }
        console.log("User session created successfully");
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
