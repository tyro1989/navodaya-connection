#!/usr/bin/env tsx

import { db } from './server/db.js';
import { users } from './shared/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { config } from 'dotenv';

// Load environment variables
config();

async function updateUserPassword() {
  const phoneNumber = '+919821489589'; // Include country code
  const newPassword = 'password123';
  
  try {
    console.log(`Looking for user with phone number: ${phoneNumber}`);
    
    // First, check if the user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.phone, phoneNumber));
    
    if (!existingUser) {
      console.error(`User with phone number ${phoneNumber} not found in the database.`);
      process.exit(1);
    }
    
    console.log(`Found user: ${existingUser.name} (ID: ${existingUser.id})`);
    
    // Hash the new password using the same method as the application
    console.log('Hashing new password...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the user's password
    console.log('Updating password in database...');
    const [updatedUser] = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.phone, phoneNumber))
      .returning();
    
    if (updatedUser) {
      console.log(`✅ Password successfully updated for user: ${updatedUser.name}`);
      console.log(`User ID: ${updatedUser.id}`);
      console.log(`Phone: ${updatedUser.phone}`);
      console.log(`New password: ${newPassword}`);
    } else {
      console.error('❌ Failed to update password');
    }
    
  } catch (error) {
    console.error('Error updating password:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    process.exit(0);
  }
}

// Run the script
updateUserPassword();