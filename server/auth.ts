import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
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

  // Google OAuth Strategy (only if credentials are provided)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/api/auth/google/callback`
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

      // Create incomplete user profile for first-time Google users
      // They will need to complete registration with required Navodaya fields
      const newUserData: Partial<User> = {
        email: profile.emails?.[0]?.value || '',
        name: profile.displayName || '',
        googleId: profile.id,
        authProvider: 'google',
        profileImage: profile.photos?.[0]?.value || null,
        facebookId: null,
        appleId: null,
        password: null,
        emailVerified: true,
        // Mark as incomplete - requires additional info
        batchYear: 0, // Will be updated on first login
        profession: '',
        state: '',
        district: '',
        phone: null,
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