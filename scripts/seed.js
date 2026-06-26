// Run this script to seed your MongoDB with a sample record
// Usage: node scripts/seed.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;
const COLLECTION_NAME = process.env.COLLECTION_NAME || 'records';

if (!MONGODB_URI || !DATABASE_NAME) {
  console.error('❌ Missing environment variables. Please check your .env.local file.');
  process.exit(1);
}

const RecordSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  status: String,
  notes: String,
  updatedAt: Date,
}, {
  timestamps: true,
  collection: COLLECTION_NAME,
});

const Record = mongoose.models.Record || mongoose.model('Record', RecordSchema);

async function seedDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      dbName: DATABASE_NAME,
    });
    console.log('✅ Connected to MongoDB');

    // Check if record already exists
    const existingRecord = await Record.findOne();
    
    if (existingRecord) {
      console.log('ℹ️  Record already exists:');
      console.log(existingRecord);
      console.log('\n💡 To update, use the web interface or delete the existing record first.');
    } else {
      // Create a sample record
      const sampleRecord = new Record({
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '(555) 123-4567',
        status: 'Active',
        notes: 'This is a sample record. Feel free to update this information.',
        updatedAt: new Date(),
      });

      await sampleRecord.save();
      console.log('✅ Sample record created successfully!');
      console.log(sampleRecord);
    }

    await mongoose.connection.close();
    console.log('\n🎉 Done! You can now run "npm run dev" to start the application.');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
