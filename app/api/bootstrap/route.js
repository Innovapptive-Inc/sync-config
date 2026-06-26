import { NextResponse } from 'next/server';

// POST - Trigger BASE_MASTER bootstrap dump
export async function POST(request) {
  try {
    const { domain, isCascade, plantIds } = await request.json();

    if (!domain) {
      return NextResponse.json(
        { success: false, message: 'Domain is required' },
        { status: 400 }
      );
    }

    if (!plantIds || !Array.isArray(plantIds) || plantIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one Plant ID is required' },
        { status: 400 }
      );
    }

    // Build the URL from the user-provided domain
    const url = `https://${domain}.innovapptive.com/mobilesyncapi/bootstrap/BASE_MASTER`;
    const baseMasterKey = process.env.BASE_MASTER_XAPI_KEY;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': baseMasterKey,
      },
      body: JSON.stringify({
        isCascade: Boolean(isCascade),
        plantIds: plantIds.filter((id) => id.trim() !== ''),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: `API returned ${response.status}`, data },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error triggering bootstrap:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to trigger bootstrap' },
      { status: 500 }
    );
  }
}
