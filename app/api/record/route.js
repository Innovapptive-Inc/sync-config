import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Record from '@/models/Record';

// GET - Fetch the sync configuration record
export async function GET() {
  try {
    await connectDB();
    
    // Find the record with type: "syncCollections"
    const record = await Record.findOne({ type: 'syncCollections' });
    
    if (!record) {
      return NextResponse.json(
        { success: false, message: 'No sync configuration found' },
        { status: 404 }
      );
    }

    // Return the full config structure with safe serialization
    const cleanRecord = {
      id: record._id.toString(),
      type: record.type,
      config: record.config,
      createdAt: record.createdAt?.toISOString(),
      updatedAt: record.updatedAt?.toISOString(),
    };

    return NextResponse.json({ success: true, data: cleanRecord });
  } catch (error) {
    console.error('Error fetching record:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}

// PUT - Update the sync configuration record
export async function PUT(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.id) {
      return NextResponse.json(
        { success: false, message: 'Record ID is required' },
        { status: 400 }
      );
    }

    if (!body.config) {
      return NextResponse.json(
        { success: false, message: 'Configuration is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find and update the record
    const updatedRecord = await Record.findByIdAndUpdate(
      body.id,
      {
        config: body.config,
        type: body.type || 'syncCollections',
        updatedAt: new Date(),
      },
      { new: true, runValidators: false }
    );

    if (!updatedRecord) {
      return NextResponse.json(
        { success: false, message: 'Configuration not found' },
        { status: 404 }
      );
    }

    const cleanRecord = {
      id: updatedRecord._id.toString(),
      type: updatedRecord.type,
      config: updatedRecord.config,
      createdAt: updatedRecord.createdAt?.toISOString(),
      updatedAt: updatedRecord.updatedAt.toISOString(),
    };

    return NextResponse.json({ 
      success: true, 
      message: 'Configuration saved successfully',
      data: cleanRecord 
    });
  } catch (error) {
    console.error('Error updating configuration:', error);
    
    return NextResponse.json(
      { success: false, message: 'Unable to save changes. Please try again.' },
      { status: 500 }
    );
  }
}
