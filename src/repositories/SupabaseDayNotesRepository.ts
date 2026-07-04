import { DayNotes } from '../types/Exercise';
import { IDayNotesRepository } from './interfaces/IDayNotesRepository';
import { supabase } from '../lib/supabaseClient';
import { requireUserId } from '../lib/currentUser';

interface DayNoteRow {
  day_id: string;
  notes: string;
}

/**
 * Supabase-backed day-notes repository. One row per (user, day).
 */
export class SupabaseDayNotesRepository implements IDayNotesRepository {
  private static readonly TABLE = 'day_notes';

  async getNotes(): Promise<DayNotes> {
    const { data, error } = await supabase
      .from(SupabaseDayNotesRepository.TABLE)
      .select('day_id, notes');

    if (error) {
      console.error('Error loading day notes:', error);
      return {};
    }
    const notes: DayNotes = {};
    for (const row of data as DayNoteRow[]) {
      notes[row.day_id] = row.notes;
    }
    return notes;
  }

  async saveNotes(notes: DayNotes): Promise<void> {
    const entries = Object.entries(notes);
    if (entries.length === 0) return;
    await Promise.all(entries.map(([dayId, text]) => this.saveDayNotes(dayId, text)));
  }

  async getDayNotes(dayId: string): Promise<string> {
    const { data, error } = await supabase
      .from(SupabaseDayNotesRepository.TABLE)
      .select('notes')
      .eq('day_id', dayId)
      .maybeSingle();

    if (error) {
      console.error('Error loading day note:', error);
      return '';
    }
    return (data as DayNoteRow | null)?.notes ?? '';
  }

  async saveDayNotes(dayId: string, notes: string): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase
      .from(SupabaseDayNotesRepository.TABLE)
      .upsert(
        {
          user_id: userId,
          day_id: dayId,
          notes,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id,day_id' }
      );

    if (error) {
      console.error('Error saving day note:', error);
      throw error;
    }
  }
}
