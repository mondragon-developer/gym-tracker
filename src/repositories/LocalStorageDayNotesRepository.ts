import { DayNotes } from '../types/Exercise';

export interface IDayNotesRepository {
  getNotes(): DayNotes;
  saveNotes(notes: DayNotes): void;
  getDayNotes(dayId: string): string;
  saveDayNotes(dayId: string, notes: string): void;
}

export class LocalStorageDayNotesRepository implements IDayNotesRepository {
  private readonly STORAGE_KEY = 'dayNotes';

  getNotes(): DayNotes {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading day notes:', error);
      return {};
    }
  }

  saveNotes(notes: DayNotes): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notes));
    } catch (error) {
      console.error('Error saving day notes:', error);
    }
  }

  getDayNotes(dayId: string): string {
    const allNotes = this.getNotes();
    return allNotes[dayId] || '';
  }

  saveDayNotes(dayId: string, notes: string): void {
    const allNotes = this.getNotes();
    allNotes[dayId] = notes;
    this.saveNotes(allNotes);
  }
}