import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const contracts = await prisma.contracts.findMany({
      include: {
        organization: { select: { name: true } },
        creator: { select: { name: true } },
      },
      orderBy: { created_at: 'desc' },
    });
    return NextResponse.json({ contracts });
  } catch (error) {
    console.error('Error fetching admin contracts:', error);
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
  }
}
