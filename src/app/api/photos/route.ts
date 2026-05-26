import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Curated list of high-quality university/farewell memories from Unsplash as fallbacks
const FALLBACK_MEMORIES = [
  {
    url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800&auto=format&fit=crop',
    title: 'The Beginning of the Journey',
    caption: 'Remembering our first day on campus, filled with dreams and curiosity.'
  },
  {
    url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=800&auto=format&fit=crop',
    title: 'Late Night Coffee Sessions',
    caption: 'Tackling tough assignments together, laughing through the fatigue.'
  },
  {
    url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop',
    title: 'Nostalgic Campus Walks',
    caption: 'Strolling through the historic pathways that witnessed our growth.'
  },
  {
    url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=800&auto=format&fit=crop',
    title: 'The Final Triumph',
    caption: 'Throwing our caps high in the sky, ready to conquer the world.'
  },
  {
    url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=800&auto=format&fit=crop',
    title: 'Unforgettable Festivals',
    caption: 'Dancing like nobody was watching during the annual Eclectica cultural night.'
  },
  {
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800&auto=format&fit=crop',
    title: 'The Group Projects',
    caption: 'When research turned into lifelong inside jokes and memories.'
  },
  {
    url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=800&auto=format&fit=crop',
    title: 'Capturing Every Moment',
    caption: 'Sticky notes and Polaroids of a beautiful chapter we will cherish forever.'
  },
  {
    url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop',
    title: 'Farewell Hugs & Tears',
    caption: 'Saying goodbye is hard, but the bonds we forged are unbreakable.'
  }
];

export async function GET() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const folder = process.env.CLOUDINARY_FOLDER || 'farewell';

  // If Cloudinary keys are fully configured, fetch dynamically from Cloudinary Admin/Search API
  if (cloudName && apiKey && apiSecret) {
    try {
      // Base64 encode credentials
      const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
      
      // Fetch resources from the specified folder
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${auth}`,
          },
          body: JSON.stringify({
            expression: `folder:${folder} AND resource_type:image`,
            max_results: 30,
            sort_by: [{ created_at: 'asc' }],
            with_field: ['context']
          }),
          // Next.js caching control
          next: { revalidate: 60 } 
        }
      );

      if (response.ok) {
        const data = await response.json();
        const images = data.resources.map((res: any, idx: number) => ({
          url: res.secure_url,
          title: res.context?.title || `Memory #${idx + 1}`,
          caption: res.context?.caption || `A beautiful moment captured from ${folder} event.`,
          publicId: res.public_id // Expose public_id for easy deletions!
        }));

        if (images.length > 0) {
          return NextResponse.json({ success: true, images });
        }
      }
    } catch (error) {
      console.error('Error fetching images from Cloudinary:', error);
      // Fall through to fallback images
    }
  }

  // Return standard premium university memories as fallback
  return NextResponse.json({
    success: true,
    images: FALLBACK_MEMORIES,
    source: 'fallback'
  });
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get('publicId');

    if (!publicId) {
      return NextResponse.json(
        { success: false, error: 'Missing publicId parameter' },
        { status: 400 }
      );
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { success: false, error: 'Cloudinary credentials are not fully configured' },
        { status: 500 }
      );
    }

    const timestamp = Math.round(new Date().getTime() / 1000).toString();
    
    // Alphabetically sorted parameters for signature: public_id, timestamp.
    // Hash: "public_id=<public_id>&timestamp=<timestamp><api_secret>"
    const signature = crypto
      .createHash('sha256')
      .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex');

    const formData = new URLSearchParams();
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp);
    formData.append('api_key', apiKey);
    formData.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    );

    if (response.ok) {
      const result = await response.json();
      if (result.result === 'ok') {
        return NextResponse.json({ success: true, result });
      }
      return NextResponse.json(
        { success: false, error: result.result || 'Failed to destroy resource' },
        { status: 400 }
      );
    }

    const errText = await response.text();
    return NextResponse.json({ success: false, error: errText }, { status: response.status });
  } catch (error: any) {
    console.error('Error destroying image from Cloudinary:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

