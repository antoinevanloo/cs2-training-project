import { NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/utils';
import { getDemosByUserId } from '@/lib/db/queries/demos';

export async function GET(request: Request) {
  try {
    const user = await requireAuthAPI();

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const orderBy = searchParams.get('orderBy') || 'matchDate';
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc';

    const result = await getDemosByUserId(user.id, {
      page,
      limit,
      orderBy,
      order,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching demos:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des demos' },
      { status: 500 }
    );
  }
}
