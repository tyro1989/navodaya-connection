import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { storage } from "./storage";
import type { User } from "@shared/schema";

// Configure Passport strategies
export function configureAuth() {
  // Local Strategy for phone/password login
  passport.use(new LocalStrategy(
    { usernameField: 'phone' },
    async (phone: string, password: string, done) => {
      try {
        console.log("LocalStrategy verifying:", { phone, passwordLength: password?.length });
        const user = await storage.verifyUserPassword(phone, password);
        console.log("Password verification result:", user ? "SUCCESS" : "FAILED");
        if (user) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'Invalid phone or password' });
        }
      } catch (error) {
        console.error("LocalStrategy error:", error);
        return done(error);
      }
    }
  ));

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && 
      process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id_here') {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `http://localhost:${process.env.PORT || 3000}/api/auth/google/callback`
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google OAuth profile:", profile.id, profile.displayName, profile.emails?.[0]?.value);
        
        // Check if user already exists with this Google ID
        let user = await storage.findUserByGoogleId(profile.id);
        
        if (!user) {
          // Check if user exists with the same email
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = await storage.findUserByEmail(email);
            if (user) {
              // Link Google account to existing user
              await storage.linkGoogleAccount(user.id, profile.id);
              user = await storage.getUserById(user.id);
            }
          }
        }
        
        if (!user) {
          // Create new user with Google data (phone number will be required later)
          const userData = {
            name: profile.displayName || 'Google User',
            email: profile.emails?.[0]?.value,
            googleId: profile.id,
            authProvider: 'google',
            batchYear: 0, // Will be set during profile completion
            state: '', // Will be set during profile completion
            district: '', // Will be set during profile completion
            isActive: true
            // phoneVerified will default to false in database
          };
          
          user = await storage.createUser(userData);
        }
        
        return done(null, user);
      } catch (error) {
        console.error("Google OAuth error:", error);
        return done(error);
      }
    }));
  }

  // Facebook OAuth Strategy
  if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET && 
      process.env.FACEBOOK_CLIENT_ID !== 'your_facebook_app_id_here') {
    passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: `http://localhost:${process.env.PORT || 3000}/api/auth/facebook/callback`,
      profileFields: ['id', 'displayName', 'emails']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Facebook OAuth profile:", profile.id, profile.displayName, profile.emails?.[0]?.value);
        
        // Check if user already exists with this Facebook ID
        let user = await storage.findUserByFacebookId(profile.id);
        
        if (!user) {
          // Check if user exists with the same email
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = await storage.findUserByEmail(email);
            if (user) {
              // Link Facebook account to existing user
              await storage.linkFacebookAccount(user.id, profile.id);
              user = await storage.getUserById(user.id);
            }
          }
        }
        
        if (!user) {
          // Create new user with Facebook data (phone number will be required later)
          const userData = {
            name: profile.displayName || 'Facebook User',
            email: profile.emails?.[0]?.value,
            facebookId: profile.id,
            authProvider: 'facebook',
            batchYear: 0, // Will be set during profile completion
            state: '', // Will be set during profile completion
            district: '', // Will be set during profile completion
            isActive: true
            // phoneVerified will default to false in database
          };
          
          user = await storage.createUser(userData);
        }
        
        return done(null, user);
      } catch (error) {
        console.error("Facebook OAuth error:", error);
        return done(error);
      }
    }));
  }

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