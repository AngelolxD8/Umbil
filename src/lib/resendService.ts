// src/lib/resendService.ts

import { Resend } from 'resend';
import { generateStreakReminderEmail, generateStreakReminderPlainText, type StreakEmailData} from './emailTemplate';

// use resend with API keys
const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendStreakReminderParams {
  to: string;
  userName: string;
  currentStreak: number;
  longestStreak: number;
  appUrl: string;
}

// Send streak reminder email to user

export async function sendStreakReminderEmail(params: SendStreakReminderParams): Promise<{ success:boolean; error?: string }> {
  try {
    const { to, userName, currentStreak, longestStreak, appUrl } = params;

    // Validate email address first
    if (!to || !isValidEmail(to)) {
      console.error('Invalid email address:', to);
      return { success: false,  error: 'Invalid email address' };
    }

    // Prep email data
    const emailData: StreakEmailData = {
      userName,
      currentStreak,
      longestStreak,
      appUrl
    };

    const htmlContent = generateStreakReminderEmail(emailData);
    const textContent = generateStreakReminderPlainText(emailData);

    // Subject line
    let subject = '🔥 Keep Your Streak Alive!';
    if (currentStreak === 0) {
      subject = '🌟 Start Your Streak Today!';
    } else if (currentStreak >= longestStreak) {
      subject = `⏰ Don\'t Lose Your ${currentStreak}-day Streak - Log Your CPD Today!`;
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_SENDER_EMAIL || 'yes-reply@notifications.umbil.co.uk',
      to: [to],
      subject,
      html: htmlContent,
      text: textContent,

      // tracking tags
      tags: [
        { name: 'category', value: 'streak-reminder' },
        { name: 'streak', value: currentStreak.toString() }
      ],
    });

    if (error) {
      console.error('Resend API error:', error);
      return { success: false, error: error.message };
    }

    console.log('Streak reminder sent succesfully:', { to, messageId: data?.id });
    return { success: true };
  } catch (error) {
    console.error('Failed to send streak reminder email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Bulk send and rate limiting
export async function sendBulkStreakReminders(
  reminders: SendStreakReminderParams[]
): Promise <{ sent: number; failed: number; errors: Array<{ email: string; error: string }> }> {
  let sent = 0;
  let failed = 0;
  const errors: Array<{ email: string; error: string }> = [];

  // Batch processing to avoid rate limits
  const BATCH_SIZE = 10;
  const BATCH_DELAY = 1000; // 1 second

  for (let i = 0; i < reminders.length; i += BATCH_SIZE) {
    const batch = reminders.slice(i, i + BATCH_SIZE);

    const results = await Promise.all(
      batch.map(reminder => sendStreakReminderEmail(reminder))
    );

    results.forEach((result, index) => {
      if (result.success) {
        sent++;
      } else {
        failed++;
        errors.push({
          email: batch[index].to,
          error: result.error || 'Unknown error'
        });
      }
    });

    // Delay between batches
    if (i + BATCH_SIZE < reminders.length) {
      await delay(BATCH_DELAY);
    }
  }

  return { sent, failed, errors };
}

// Email format validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Delay helper
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}