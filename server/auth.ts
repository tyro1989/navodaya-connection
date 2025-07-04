import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";
import type { User } from "@shared/schema";

// Configure Passport strategies
export function configureAuth() {
  // Local Strategy for email/password login
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email: string, password: string, done) => {
      try {
        const user = await storage.verifyUserPassword(email, password);
        if (user) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'Invalid email or password' });
        }
      } catch (error) {
        return done(error);
      }
    }
  ));

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await storage.getUserBySocialId('google', profile.id);
        
        if (user) {
          return done(null, user);
        }

        // Check if user exists with same email
        if (profile.emails && profile.emails.length > 0) {
          user = await storage.getUserByEmail(profile.emails[0].value);
          if (user) {
            // Link Google account to existing user
            await storage.updateUser(user.id, {
              googleId: profile.id,
              authProvider: 'google'
            });
            return done(null, user);
          }
        }

        // Create new user
        const newUserData: Partial<User> = {
          email: profile.emails?.[0]?.value || '',
          name: profile.displayName || '',
          googleId: profile.id,
          authProvider: 'google',
          profileImage: profile.photos?.[0]?.value || null,
          // Set required fields with defaults
          batchYear: new Date().getFullYear(),
          profession: 'Not specified',
          state: 'Not specified',
          district: 'Not specified',
          phone: null,
          facebookId: null,
          appleId: null,
          password: null,
          emailVerified: true,
          gender: null,
          professionOther: null,
          currentState: null,
          currentDistrict: null,
          pinCode: null,
          gpsLocation: null,
          gpsEnabled: false,
          helpAreas: [],
          helpAreasOther: null,
          expertiseAreas: [],
          isExpert: false,
          dailyRequestLimit: 3,
          phoneVisible: false,
          upiId: null,
          bio: null,
          isActive: true,
          lastActive: new Date(),
          createdAt: new Date()
        };

        user = await storage.createUserWithSocialAuth(newUserData);
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));
  }

  // Facebook OAuth Strategy
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "/api/auth/facebook/callback",
      profileFields: ['id', 'displayName', 'email', 'photos']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Similar logic to Google strategy
        let user = await storage.getUserBySocialId('facebook', profile.id);
        
        if (user) {
          return done(null, user);
        }

        if (profile.emails && profile.emails.length > 0) {
          user = await storage.getUserByEmail(profile.emails[0].value);
          if (user) {
            await storage.updateUser(user.id, {
              facebookId: profile.id,
              authProvider: 'facebook'
            });
            return done(null, user);
          }
        }

        const newUserData: Partial<User> = {
          email: profile.emails?.[0]?.value || '',
          name: profile.displayName || '',
          facebookId: profile.id,
          authProvider: 'facebook',
          profileImage: profile.photos?.[0]?.value || null,
          batchYear: new Date().getFullYear(),
          profession: 'Not specified',
          state: 'Not specified',
          district: 'Not specified',
          phone: null,
          googleId: null,
          appleId: null,
          password: null,
          emailVerified: true,
          gender: null,
          professionOther: null,
          currentState: null,
          currentDistrict: null,
          pinCode: null,
          gpsLocation: null,
          gpsEnabled: false,
          helpAreas: [],
          helpAreasOther: null,
          expertiseAreas: [],
          isExpert: false,
          dailyRequestLimit: 3,
          phoneVisible: false,
          upiId: null,
          bio: null,
          isActive: true,
          lastActive: new Date(),
          createdAt: new Date()
        };

        user = await storage.createUserWithSocialAuth(newUserData);
        return done(null, user);
      } catch (error) {
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