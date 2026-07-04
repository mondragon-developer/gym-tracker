import { WeeklyProgress } from '../../types/Progress';

export interface IProgressService {
  getWeeklyProgress(): Promise<WeeklyProgress>;
  resetWeeklyProgress(): Promise<void>;
}
