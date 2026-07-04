import { DayNotes } from '../../types/Exercise';

/**
 * Persistence contract for per-day notes (e.g. "Rest Day", personal reminders).
 * Async so it can be backed by a remote database.
 */
export interface IDayNotesRepository {
  getNotes(): Promise<DayNotes>;
  saveNotes(notes: DayNotes): Promise<void>;
  getDayNotes(dayId: string): Promise<string>;
  saveDayNotes(dayId: string, notes: string): Promise<void>;
}
