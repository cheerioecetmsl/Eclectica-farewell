export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function GET() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error('Missing Cloudinary configuration');
    return NextResponse.json({ success: false, error: 'Cloudinary configuration missing' }, { status: 500 });
  }

  try {
    const auth = btoa(`${apiKey}:${apiSecret}`);
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expression: 'folder:Cheerio/Archives/Images AND resource_type:image',
          sort_by: [{ created_at: 'desc' }],
          max_results: 500,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Cloudinary API returned an error');
    }

    const result = await response.json();
    const resources = result.resources || [];

    const urls = resources.map((r: any) => ({
      url: r.secure_url,
      baseId: r.public_id,
      type: r.resource_type,
      createdAt: r.created_at,
    }));

    return NextResponse.json({ success: true, data: urls });
  } catch (error: any) {
    console.error('Cloudinary fetch error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
