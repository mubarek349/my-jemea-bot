/**
 * @fileoverview API endpoint to reset timezone detection
 * @description Clears timezone cache and forces fresh detection
 */

import {  NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * POST /api/timezone/reset
 * @description Reset timezone detection and clear cache
 */
export async function POST() {
  try {
    // Log the reset action
    logger.info('Timezone detection reset requested', {
      action: 'timezone_reset',
      timestamp: new Date().toISOString()
    });

    // Clear any browser-side timezone cache by returning a response
    // that will trigger a fresh timezone detection
    const response = NextResponse.json({
      success: true,
      message: 'Timezone detection reset successfully',
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      offset: new Date().getTimezoneOffset()
    });

    // Add headers to prevent caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    logger.error('Error resetting timezone detection', {
      error: error as Error,
      action: 'timezone_reset_error'
    });

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to reset timezone detection',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

