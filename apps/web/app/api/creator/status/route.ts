import { NextResponse } from 'next/server';
import { loadCreatorProfile } from '@/lib/serverStore';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pubkey = searchParams.get('pubkey') || '';
  
  if (!pubkey) {
    return NextResponse.json({ error: 'pubkey required' }, { status: 400 });
  }

  try {
    const profile = await loadCreatorProfile(pubkey);
    
    // Calculate profile completeness
    const checks = {
      hasName: !!(profile?.name && profile.name.trim().length > 0),
      hasBio: !!(profile?.bio && profile.bio.trim().length > 0),
      hasSessionTitle: !!(profile?.sessionTitle && profile.sessionTitle.trim().length > 0),
      hasSessionDescription: !!(profile?.sessionDescription && profile.sessionDescription.trim().length > 0),
      hasAvailability: !!(profile?.availability && Object.keys(profile.availability).length > 0),
      hasPricing: !!(profile?.defaults && (profile.defaults.price || profile.defaults.startPrice)),
      hasAvatar: !!profile?.avatar,
    };

    const completed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    const percentage = Math.round((completed / total) * 100);
    
    // Determine status
    let status: 'new' | 'incomplete' | 'complete' = 'new';
    if (completed === 0) {
      status = 'new';
    } else if (completed < total) {
      status = 'incomplete';
    } else {
      status = 'complete';
    }

    // Determine suggested next step
    let nextStep = '/creator/onboard';
    if (!checks.hasName || !checks.hasBio) {
      nextStep = '/creator/onboard?step=1';
    } else if (!checks.hasSessionTitle || !checks.hasSessionDescription) {
      nextStep = '/creator/onboard?step=2';
    } else if (!checks.hasAvailability) {
      nextStep = '/creator/onboard?step=3';
    } else if (status === 'complete') {
      nextStep = '/creator/dashboard';
    }

    return NextResponse.json({
      status,
      percentage,
      completed,
      total,
      checks,
      nextStep,
      profile: profile || null,
    });
  } catch (err: any) {
    console.error('Status check failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
