// src/lib/emailTemplate.ts

/**
 * Email templates for streak reminders
 */

export interface StreakEmailData {
  userName: string;
  currentStreak: number;
  longestStreak: number;
  appUrl: string;
}

// Generate HTML email content
export function generateStreakReminderEmail(data: StreakEmailData): string {
  const { userName, currentStreak, longestStreak, appUrl } = data;

  // Message baseed on streak status
  let streakMessage = '';
  let emoji = '💭';

  if (currentStreak === 0) {
    streakMessage = `Hi ${userName}, it's time to start your CPD journey! Log your first entry today and kickstart your learning streak.`;
    emoji = '🌟';
  } else if (currentStreak === 1) {
    streakMessage = `Great start, ${userName}! You've logged your first day of CPD. Keep the momentum going and log again today!`;
    emoji = '🔥';
  } else {
    streakMessage = `Don\'t break your ${currentStreak}-day streak! Keep logging your CPD daily to maintain your impressive streak.`;
    emoji = '🔥';
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Streak Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
              <div style="font-size: 48px; margin-bottom: 10px;">${emoji}</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${streakMessage}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi ${userName},
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                You haven't logged any CPD today yet. ${currentStreak > 0 ? 'Keep your momentum going!' : 'Start building your streak today!'}
              </p>

              <!-- Streak Stats -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td style="width: 50%; padding: 20px; background-color: #f8f9fa; border-radius: 8px; text-align: center;">
                    <div style="font-size: 36px; font-weight: 700; color: #667eea; margin-bottom: 5px;">${currentStreak}</div>
                    <div style="font-size: 14px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Current Streak</div>
                  </td>
                  <td style="width: 10px;"></td>
                  <td style="width: 50%; padding: 20px; background-color: #f8f9fa; border-radius: 8px; text-align: center;">
                    <div style="font-size: 36px; font-weight: 700; color: #764ba2; margin-bottom: 5px;">${longestStreak}</div>
                    <div style="font-size: 14px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Longest Streak</div>
                  </td>
                </tr>
              </table>

              ${currentStreak > 0 ? `
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>⚠️ Don't lose your streak!</strong> Log a CPD today to keep your ${currentStreak}-day streak going.
                </p>
              </div>
              ` : ''}

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.4);">
                      Log a CPD Now
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Keep learning, keep growing! 🚀
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.6;">
                You're receiving this email because you have streak reminders enabled.
              </p>
              <p style="margin: 10px 0 0; color: #999999; font-size: 12px;">
                <a href="${appUrl}/settings" style="color: #667eea; text-decoration: none;">Manage preferences</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version for email clients that don't support HTML
 */
export function generateStreakReminderPlainText(data: StreakEmailData): string {
  const { userName, currentStreak, longestStreak, appUrl } = data;
  
  let streakMessage = '';
  
  if (currentStreak === 0) {
    streakMessage = "Start a new streak today!";
  } else if (currentStreak === 1) {
    streakMessage = "Keep your 1-day streak alive!";
  } else {
    streakMessage = `Don't break your ${currentStreak}-day streak!`;
  }

  return `
${streakMessage}

Hi ${userName},

You haven't logged any notes today yet. ${currentStreak > 0 ? 'Keep your momentum going!' : 'Start building your streak today!'}

Your Stats:
- Current Streak: ${currentStreak} days
- Longest Streak: ${longestStreak} days

${currentStreak > 0 ? `Don't lose your streak! Log a note today to keep your ${currentStreak}-day streak going.` : ''}

Log a note now: ${appUrl}

Keep learning, keep growing!

---
You're receiving this email because you have streak reminders enabled.
Manage preferences: ${appUrl}/settings
  `.trim();
}