import { clearLastSearch } from './last-search';
import { clearAllInterest } from './place-interest';

/**
 * Clear all local "resume" hints (last search + place interest). Tapping Clear on
 * either home resume card dismisses the whole thing — only a pending payment,
 * which is a real obligation, is left alone.
 */
export async function clearResume(): Promise<void> {
  await Promise.all([clearLastSearch(), clearAllInterest()]);
}
