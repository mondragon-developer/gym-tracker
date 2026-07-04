import { DayNotes } from '../types/Exercise';
import { IDayNotesRepository } from './interfaces/IDayNotesRepository';

/**
 * Offline fallback for day notes, backed by localStorage. Async only to satisfy
 * the IDayNotesRepository interface.
 */
export class LocalStorageDayNotesRepository implements IDayNotesRepository {
  private readonly STORAGE_KEY = 'dayNotes';

  async getNotes(): Promise<DayNotes> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading day notes:', error);
      return {};
    }
  }

  async saveNotes(notes: DayNotes): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notes));
    } catch (error) {
      console.error('Error saving day notes:', error);
    }
  }

  async getDayNotes(dayId: string): Promise<string> {
    const allNotes = await this.getNotes();
    return allNotes[dayId] || '';
  }

  async saveDayNotes(dayId: string, notes: string): Promise<void> {
    const allNotes = await this.getNotes();
    allNotes[dayId] = notes;
    await this.saveNotes(allNotes);
  }
}
