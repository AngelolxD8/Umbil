// src/app/api/cron/streak-reminders/route.ts

/**
 * API Route for Vercel Cron to send streak reminder emails
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateStreaks } from '@/lib/streakCalculatorServer';
import { sendBulkStreakReminders, type SendStreakReminderParams } from '@/lib/resendService';
import { exec } from 'child_process';
import { send } from 'process';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// POST handler with cron secret validation
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if(!cronSecret) {
      console.error('CRON_SECRET environment variable is not set.');
      return NextResponse.json(
        { error: 'Server configuration error.' },
        { status: 500 }
      );
    }
    // cron secret verification
    if (authHeader !== 'Bearer ${cronSecret}') {
      console.warn('Unauthorrised cron job attempt.');
      return NextResponse.json(
        { error: 'Unauthorised' },
        { status: 401 }
      );
    }

    console.log('Starting streak reminder cron job...');
    const startTime = Date.now();

    // Fetch users who opted in for streak reminders
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email_reminders_enabled', true);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users.'},
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      console.log('No users with email reminders enabled.');
      return NextResponse.json({
        success: true,
        message: 'No users to process.',
        processed: 0,
        sent: 0
      });
    }

    console.log(`Processing ${users.length} users...`);

    // 3. Process each user & determine if they need a reminder
    const remindersToSend: SendStreakReminderParams[] = [];

    for (const user of users) {
      try {
        // Fetch CPD logs
        const { data: cpd_entries, error: cpdError } = await supabase
          .from('cpd_entries')
          .select('timestamp')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false });

        if (cpdError) {
          console.error(`Error fetching CPD entries for user ${user.email}:`, cpdError);
          continue;
        }

        // Calculate streaks & send reminder if not logged today
        const timestamps = cpd_entries?.map(n => n.timestamp) || [];
        const streakData = calculateStreaks(timestamps);

        if (!streakData.hasLoggedToday) {
          remindersToSend.push({
            to: user.email,
            userName: user.name || user.email.split('@')[0],
            currentStreak: streakData.currentStreak,
            longestStreak: streakData.longestStreak,
            appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://umbil.co.uk'
          });
        }
      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error);
        continue;
      }
    }

    console.log(`Sending ${remindersToSend.length} streak reminder emails...`);

    // 4. Bulk send
    const result = await sendBulkStreakReminders(remindersToSend);

    // 5. Log completion
    await supabase.from('cron_job_logs').insert({
      job_name: 'streak-reminders',
      processed_users: users.length,
      reminders_sent: result.sent,
      reminders_failed: result.failed,
      execution_time_ms: Date.now() - startTime,
      errors: result.errors.length > 0 ? JSON.stringify(result.errors) : null
    });

    console.log('Cron job completed successfully:', {
      processed: users.length,
      sent: result.sent,
      failed: result.failed,
      duration: `${Date.now() - startTime}ms `
    });

    // 6. Return response
    return NextResponse.json({
      success: true,
      processed: users.length,
      sent: result.sent,
      failed: result.failed,
      errors: result.errors,
      duration: Date.now() - startTime
    });

  } catch (error) {
    console.error(`Cron job failed:`, error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Prevent Next.js from caching this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;