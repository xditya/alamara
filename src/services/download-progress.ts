/**
 * OS-level progress for the embedding-model download — the one task in Alamara
 * long enough that the user is likely to leave the app mid-way.
 *
 * Android: an ongoing status-bar notification with a determinate progress bar.
 * iOS:     a Live Activity (lock screen + Dynamic Island).
 *
 * Nothing here is allowed to break the download it is reporting on, so every
 * call is best-effort and swallows its own failures. A missing notification is
 * a cosmetic problem; a rejected promise here would abort the model download.
 */

import notifee, { AndroidImportance } from '@notifee/react-native';
import * as LiveActivity from 'expo-live-activity';
import { Platform } from 'react-native';

const CHANNEL_ID = 'model-download';
const TITLE = 'Preparing semantic search';

/**
 * ActivityKit throttles frequent Live Activity updates, and every notifee
 * update is a bridge call — while executorch reports download progress far more
 * often than once per percent. Only push when the whole-number percentage
 * actually changes, and never more than twice a second.
 */
const MIN_UPDATE_INTERVAL_MS = 500;

let notificationId: string | null = null;
let activityId: string | null = null;
let lastPercent = -1;
let lastUpdateAt = 0;

function subtitleFor(percent: number): string {
  return `${percent}% of ~90 MB`;
}

async function ensureChannel(): Promise<string> {
  // LOW keeps it silent and out of the heads-up area: this is passive progress,
  // not something worth interrupting the user for.
  return notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Model download',
    importance: AndroidImportance.LOW,
  });
}

/** Shows the initial 0% notification / Live Activity. */
export async function beginDownloadProgress(): Promise<void> {
  lastPercent = -1;
  lastUpdateAt = 0;
  try {
    if (Platform.OS === 'android') {
      await notifee.requestPermission();
      const channelId = await ensureChannel();
      notificationId = await notifee.displayNotification({
        title: TITLE,
        body: subtitleFor(0),
        android: {
          channelId,
          // Not swipe-dismissable, and no re-alert on every progress tick.
          ongoing: true,
          onlyAlertOnce: true,
          progress: { max: 100, current: 0 },
          pressAction: { id: 'default' },
        },
      });
    } else if (Platform.OS === 'ios') {
      activityId =
        LiveActivity.startActivity(
          { title: TITLE, subtitle: subtitleFor(0), progressBar: { progress: 0 } },
          { progressViewTint: '#6366F1', deepLinkUrl: 'alamara://settings/ai' },
        ) ?? null;
    }
  } catch (err) {
    console.warn('[Alamara] could not start download progress UI:', err);
  }
}

/** Pushes a new progress value (0–1). Throttled; safe to call on every tick. */
export async function updateDownloadProgress(fraction: number): Promise<void> {
  const percent = Math.min(100, Math.max(0, Math.round(fraction * 100)));
  const now = Date.now();
  if (percent === lastPercent) return;
  // Always let the final frame through, however soon it arrives.
  if (percent < 100 && now - lastUpdateAt < MIN_UPDATE_INTERVAL_MS) return;
  lastPercent = percent;
  lastUpdateAt = now;

  try {
    if (Platform.OS === 'android' && notificationId) {
      await notifee.displayNotification({
        // Reusing the id updates the existing notification in place.
        id: notificationId,
        title: TITLE,
        body: subtitleFor(percent),
        android: {
          channelId: CHANNEL_ID,
          ongoing: true,
          onlyAlertOnce: true,
          progress: { max: 100, current: percent },
          pressAction: { id: 'default' },
        },
      });
    } else if (Platform.OS === 'ios' && activityId) {
      LiveActivity.updateActivity(activityId, {
        title: TITLE,
        subtitle: subtitleFor(percent),
        progressBar: { progress: fraction },
      });
    }
  } catch (err) {
    console.warn('[Alamara] could not update download progress UI:', err);
  }
}

/**
 * Clears the ongoing progress UI and leaves a final, dismissable result behind
 * so someone who backgrounded the app still finds out how it went.
 */
export async function endDownloadProgress(outcome: 'done' | 'failed'): Promise<void> {
  const title = outcome === 'done' ? 'Semantic search is ready' : 'Model download failed';
  const subtitle = outcome === 'done' ? 'Alamara can now search by meaning.' : 'Open Alamara to try again.';

  try {
    if (Platform.OS === 'android') {
      if (notificationId) await notifee.cancelNotification(notificationId);
      await notifee.displayNotification({
        title,
        body: subtitle,
        android: {
          channelId: CHANNEL_ID,
          pressAction: { id: 'default' },
        },
      });
    } else if (Platform.OS === 'ios' && activityId) {
      LiveActivity.stopActivity(activityId, { title, subtitle });
    }
  } catch (err) {
    console.warn('[Alamara] could not finish download progress UI:', err);
  } finally {
    notificationId = null;
    activityId = null;
    lastPercent = -1;
    lastUpdateAt = 0;
  }
}
