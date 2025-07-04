import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";
import type { User } from "@shared/schema";

// Configure Passport strategies
export function configureAuth() {
  // Local Strategy for phone/password login
  passport.use(new LocalStrategy(
    { usernameField: 'phone' },
    async (phone: string, password: string, done) => {
      try {
        const user = await storage.verifyUserPassword(phone, password);
        if (user) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'Invalid phone or password' });
        }
      } catch (error) {
        return done(error);
      }
    }
  ));

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUserById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Not authenticated' });
}