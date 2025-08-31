import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  try {
    const paramArray = params.params;
    const [width, height] = paramArray;
    const searchParams = request.nextUrl.searchParams;
    
    const text = searchParams.get('text') || 'Placeholder';
    const bg = searchParams.get('bg') || '1f2937';
    const color = searchParams.get('color') || 'ffffff';
    
    const w = parseInt(width) || 200;
    const h = parseInt(height) || 150;
    
    // Create SVG placeholder
    const svg = `
      <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#${bg}"/>
        <text 
          x="50%" 
          y="50%" 
          font-family="Arial, sans-serif" 
          font-size="${Math.min(w, h) / 8}" 
          font-weight="bold" 
          fill="#${color}" 
          text-anchor="middle" 
          dominant-baseline="middle"
        >
          ${text}
        </text>
      </svg>
    `;
    
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Placeholder API error:', error);
    return new NextResponse('Error generating placeholder', { status: 500 });
  }
}
