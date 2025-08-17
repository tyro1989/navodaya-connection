#!/usr/bin/env tsx

import "dotenv/config";
import { Pool } from 'pg';

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔄 Running database migrations...');
    
    // Create all tables in the correct order
    const migrations = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT,
        name TEXT NOT NULL,
        phone TEXT UNIQUE,
        google_id TEXT,
        facebook_id TEXT,
        apple_id TEXT,
        auth_provider TEXT NOT NULL,
        password TEXT,
        email_verified BOOLEAN DEFAULT FALSE,
        phone_verified BOOLEAN DEFAULT FALSE,
        gender TEXT,
        batch_year INTEGER NOT NULL,
        profession TEXT,
        profession_other TEXT,
        state TEXT NOT NULL,
        district TEXT NOT NULL,
        pin_code TEXT,
        gps_location TEXT,
        gps_enabled BOOLEAN DEFAULT FALSE,
        help_areas TEXT[],
        help_areas_other TEXT,
        expertise_areas TEXT[],
        is_expert BOOLEAN DEFAULT FALSE,
        daily_request_limit INTEGER DEFAULT 3,
        phone_visible BOOLEAN DEFAULT FALSE,
        upi_id TEXT,
        bio TEXT,
        profile_image TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // Requests table
      `CREATE TABLE IF NOT EXISTS requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        expertise_required TEXT,
        urgency TEXT NOT NULL,
        help_type TEXT NOT NULL,
        help_location_state TEXT,
        help_location_district TEXT,
        help_location_area TEXT,
        help_location_gps TEXT,
        help_location_not_applicable BOOLEAN DEFAULT FALSE,
        target_expert_id INTEGER REFERENCES users(id),
        status TEXT DEFAULT 'open',
        attachments TEXT[],
        resolved BOOLEAN DEFAULT FALSE,
        best_response_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // Responses table
      `CREATE TABLE IF NOT EXISTS responses (
        id SERIAL PRIMARY KEY,
        request_id INTEGER NOT NULL REFERENCES requests(id),
        expert_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        attachments TEXT[],
        is_helpful BOOLEAN,
        helpful_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // Private messages table
      `CREATE TABLE IF NOT EXISTS private_messages (
        id SERIAL PRIMARY KEY,
        request_id INTEGER NOT NULL REFERENCES requests(id),
        sender_id INTEGER NOT NULL REFERENCES users(id),
        receiver_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        attachments TEXT[],
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // Reviews table
      `CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        request_id INTEGER NOT NULL REFERENCES requests(id),
        expert_id INTEGER NOT NULL REFERENCES users(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        rating INTEGER NOT NULL,
        comment TEXT,
        gratitude_amount DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // Response reviews table
      `CREATE TABLE IF NOT EXISTS response_reviews (
        id SERIAL PRIMARY KEY,
        response_id INTEGER NOT NULL REFERENCES responses(id),
        request_id INTEGER NOT NULL REFERENCES requests(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // Expert stats table
      `CREATE TABLE IF NOT EXISTS expert_stats (
        id SERIAL PRIMARY KEY,
        expert_id INTEGER NOT NULL REFERENCES users(id),
        total_responses INTEGER DEFAULT 0,
        average_rating DECIMAL(3, 2),
        total_reviews INTEGER DEFAULT 0,
        helpful_responses INTEGER DEFAULT 0,
        today_responses INTEGER DEFAULT 0,
        last_reset_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // Email verifications table
      `CREATE TABLE IF NOT EXISTS email_verifications (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // OTP verifications table
      `CREATE TABLE IF NOT EXISTS otp_verifications (
        id SERIAL PRIMARY KEY,
        phone TEXT NOT NULL,
        otp TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // Notifications table
      `CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        entity_type TEXT,
        entity_id INTEGER,
        action_user_id INTEGER REFERENCES users(id),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // Session table (for express-session)
      `CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL COLLATE "default",
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      ) WITH (OIDS=FALSE);`,

      // Create unique index on session table
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_session_sid" ON session USING btree (sid COLLATE "default");`,

      // Create indexes for better performance
      `CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);`,
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
      `CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);`,
      `CREATE INDEX IF NOT EXISTS idx_responses_request_id ON responses(request_id);`,
      `CREATE INDEX IF NOT EXISTS idx_responses_expert_id ON responses(expert_id);`,
      `CREATE INDEX IF NOT EXISTS idx_private_messages_request_id ON private_messages(request_id);`,
      `CREATE INDEX IF NOT EXISTS idx_private_messages_sender_id ON private_messages(sender_id);`,
      `CREATE INDEX IF NOT EXISTS idx_private_messages_receiver_id ON private_messages(receiver_id);`,
      `CREATE INDEX IF NOT EXISTS idx_reviews_expert_id ON reviews(expert_id);`,
      `CREATE INDEX IF NOT EXISTS idx_response_reviews_response_id ON response_reviews(response_id);`,
      `CREATE INDEX IF NOT EXISTS idx_expert_stats_expert_id ON expert_stats(expert_id);`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);`,
    ];

    for (const migration of migrations) {
      await pool.query(migration);
    }

    console.log('✅ All migrations completed successfully');
    
    // Verify critical tables exist
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'requests', 'responses', 'notifications')
      ORDER BY table_name
    `);
    
    console.log('📋 Verified tables:', result.rows.map(row => row.table_name).join(', '));
    
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}

export { runMigrations };