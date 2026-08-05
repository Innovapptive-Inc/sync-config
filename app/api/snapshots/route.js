import { NextResponse } from 'next/server';
import { getXApiKeys } from '@/lib/xapiKeys';

// POST - Proxy the snapshot list request to the external API
export async function POST(request) {
  try {
    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json(
        { success: false, message: 'Domain is required' },
        { status: 400 }
      );
    }

    const keys = getXApiKeys(domain);
    if (!keys) {
      return NextResponse.json(
        { success: false, message: `Unknown environment: ${domain}` },
        { status: 400 }
      );
    }

    // Build the URL from the selected environment's domain
    const url = `https://${domain}.innovapptive.com/mobilesyncapi/snapshot/list`;
    const snapShotListApi = keys.snapshotKey;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': snapShotListApi,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        select: [
          'status',
          'eventId',
          'type',
          'progress.percent',
          'progress.totalCount',
          'progress.duration',
        ],
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
    console.error('Error fetching snapshots:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch snapshots' },
      { status: 500 }
    );
  }
}
