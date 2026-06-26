import mongoose from 'mongoose';

// Flexible schema for sync configuration
const RecordSchema = new mongoose.Schema({
  config: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
  },
}, {
  strict: false, // Allow flexible schema
  collection: process.env.COLLECTION_NAME || 'Configuration',
});

export default mongoose.models.Record || mongoose.model('Record', RecordSchema);
