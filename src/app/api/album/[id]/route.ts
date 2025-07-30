import { NextRequest, NextResponse } from 'next/server';
import { dataService } from '@/lib/data/data-service';

interface AlbumParams {
  id: string;
}

/**
 * GET /api/album/[id]
 * Retrieves detailed information about a specific album including track listing
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<AlbumParams> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { error: 'Album ID is required' },
        { status: 400 }
      );
    }

    // Use the service to get album details
    const albumDetails = await dataService.getAlbumWithTracks(id);

    return NextResponse.json({
      success: true,
      data: albumDetails,
    });

  } catch (error) {
    console.error('Error fetching album details:', error);
    
    if (error instanceof Error && error.message === 'Album not found') {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      );
    }
    
    if (error instanceof Error && error.message === 'Artist not found for this album') {
      return NextResponse.json(
        { error: 'Artist not found for this album' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

