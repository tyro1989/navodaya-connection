#!/usr/bin/env tsx

import "dotenv/config";
import { Pool } from 'pg';

async function addPhoneVerifiedColumn() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔄 Adding phone_verified column to users table...');
    
    // Add the phone_verified column if it doesn't exist
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
    `);

    console.log('✅ Successfully added phone_verified column');
    
    // Set phone_verified to TRUE for users who already have a phone number
    // This assumes existing users with phone numbers are verified
    const result = await pool.query(`
      UPDATE users 
      SET phone_verified = TRUE 
      WHERE phone IS NOT NULL 
      AND phone != ''
      AND phone_verified IS NOT NULL;
    `);

    console.log(`✅ Updated ${result.rowCount} existing users with phone numbers to verified status`);
    
    // Verify the column was added
    const verifyResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'phone_verified';
    `);
    
    if (verifyResult.rows.length > 0) {
      console.log('📋 Column details:', verifyResult.rows[0]);
    } else {
      console.error('❌ Column was not created successfully');
    }
    
  } catch (error) {
    console.error('❌ Error adding phone_verified column:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addPhoneVerifiedColumn();
}

export { addPhoneVerifiedColumn };