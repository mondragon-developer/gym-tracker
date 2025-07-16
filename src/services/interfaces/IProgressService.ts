import { WeeklyProgress } from '../../types/Progress';

export interface IProgressService {
  getWeeklyProgress(): WeeklyProgress;
  resetWeeklyProgress(): void;
}