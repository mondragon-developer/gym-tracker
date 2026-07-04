import React, { createContext, useContext, useReducer, useEffect, useMemo, ReactNode } from 'react';
import { ExerciseWithProgress, DayNotes } from '../types/Exercise';
import { WeeklyProgress } from '../types/Progress';
import { Day, DAYS } from '../types/Day';
import { SupabaseExerciseRepository } from '../repositories/SupabaseExerciseRepository';
import { SupabaseProgressRepository } from '../repositories/SupabaseProgressRepository';
import { SupabaseDayNotesRepository } from '../repositories/SupabaseDayNotesRepository';
import { IDayNotesRepository } from '../repositories/interfaces/IDayNotesRepository';
import { ExerciseService } from '../services/ExerciseService';
import { ProgressService } from '../services/ProgressService';

interface GymState {
  days: Day[];
  exercises: ExerciseWithProgress[];
  weeklyProgress: WeeklyProgress;
  currentOpenDay: string | null;
  isVideoModalOpen: boolean;
  videoExerciseName: string;
  videoExerciseUrl: string;
  isConfirmModalOpen: boolean;
  confirmMessage: string;
  confirmAction: (() => void) | null;
  dayNotes: DayNotes;
}

type GymAction =
  | { type: 'SET_EXERCISES'; payload: ExerciseWithProgress[] }
  | { type: 'SET_WEEKLY_PROGRESS'; payload: WeeklyProgress }
  | { type: 'TOGGLE_DAY'; payload: string }
  | { type: 'ADD_EXERCISE'; payload: ExerciseWithProgress }
  | { type: 'DELETE_EXERCISE'; payload: string }
  | { type: 'UPDATE_EXERCISE_STATUS'; payload: { exerciseId: string; completed: boolean; skipped: boolean } }
  | { type: 'UPDATE_EXERCISE_PROGRESS'; payload: { exerciseId: string; effectiveSets: number; reps: number; weight: number } }
  | { type: 'OPEN_VIDEO_MODAL'; payload: { name: string; url?: string } }
  | { type: 'CLOSE_VIDEO_MODAL' }
  | { type: 'SHOW_CONFIRM_MODAL'; payload: { message: string; action: () => void } }
  | { type: 'HIDE_CONFIRM_MODAL' }
  | { type: 'RESET_PROGRESS' }
  | { type: 'SAVE_DAY_NOTES'; payload: { dayId: string; notes: string } }
  | { type: 'LOAD_DAY_NOTES'; payload: DayNotes }
  | { type: 'RESTORE_DEFAULT_EXERCISES'; payload: string }
  | { type: 'MARK_AS_REST_DAY'; payload: string };

const initialState: GymState = {
  days: DAYS,
  exercises: [],
  weeklyProgress: { completedExercises: 0, totalExercises: 0, percentage: 0 },
  currentOpenDay: null,
  isVideoModalOpen: false,
  videoExerciseName: '',
  videoExerciseUrl: '',
  isConfirmModalOpen: false,
  confirmMessage: '',
  confirmAction: null,
  dayNotes: {}
};

const gymReducer = (state: GymState, action: GymAction): GymState => {
  switch (action.type) {
    case 'SET_EXERCISES':
      return { ...state, exercises: action.payload };

    case 'SET_WEEKLY_PROGRESS':
      return { ...state, weeklyProgress: action.payload };

    case 'TOGGLE_DAY':
      return {
        ...state,
        currentOpenDay: state.currentOpenDay === action.payload ? null : action.payload
      };

    case 'ADD_EXERCISE':
      return { ...state, exercises: [...state.exercises, action.payload] };

    case 'DELETE_EXERCISE':
      return {
        ...state,
        exercises: state.exercises.filter(ex => ex.id !== action.payload)
      };

    case 'UPDATE_EXERCISE_STATUS':
      return {
        ...state,
        exercises: state.exercises.map(ex =>
          ex.id === action.payload.exerciseId
            ? {
                ...ex,
                progress: {
                  ...ex.progress,
                  exerciseId: ex.id,
                  completed: action.payload.completed,
                  skipped: action.payload.skipped,
                  effectiveSets: ex.progress?.effectiveSets || 0,
                  reps: ex.progress?.reps || 0,
                  weight: ex.progress?.weight || 0
                }
              }
            : ex
        )
      };

    case 'UPDATE_EXERCISE_PROGRESS':
      return {
        ...state,
        exercises: state.exercises.map(ex =>
          ex.id === action.payload.exerciseId
            ? {
                ...ex,
                progress: {
                  ...ex.progress,
                  exerciseId: ex.id,
                  completed: ex.progress?.completed || false,
                  skipped: ex.progress?.skipped || false,
                  effectiveSets: action.payload.effectiveSets,
                  reps: action.payload.reps,
                  weight: action.payload.weight
                }
              }
            : ex
        )
      };

    case 'OPEN_VIDEO_MODAL':
      return {
        ...state,
        isVideoModalOpen: true,
        videoExerciseName: action.payload.name,
        videoExerciseUrl: action.payload.url || ''
      };

    case 'CLOSE_VIDEO_MODAL':
      return {
        ...state,
        isVideoModalOpen: false,
        videoExerciseName: '',
        videoExerciseUrl: ''
      };

    case 'SHOW_CONFIRM_MODAL':
      return {
        ...state,
        isConfirmModalOpen: true,
        confirmMessage: action.payload.message,
        confirmAction: action.payload.action
      };

    case 'HIDE_CONFIRM_MODAL':
      return {
        ...state,
        isConfirmModalOpen: false,
        confirmMessage: '',
        confirmAction: null
      };

    case 'RESET_PROGRESS':
      return {
        ...state,
        exercises: state.exercises.map(ex => ({
          ...ex,
          progress: undefined
        }))
      };

    case 'SAVE_DAY_NOTES':
      return {
        ...state,
        dayNotes: {
          ...state.dayNotes,
          [action.payload.dayId]: action.payload.notes
        }
      };

    case 'LOAD_DAY_NOTES':
      return {
        ...state,
        dayNotes: action.payload
      };

    case 'RESTORE_DEFAULT_EXERCISES':
      return state; // Will be handled by service call

    case 'MARK_AS_REST_DAY':
      return {
        ...state,
        dayNotes: {
          ...state.dayNotes,
          [action.payload]: state.dayNotes[action.payload] ? `${state.dayNotes[action.payload]}\n🛌 Rest Day` : '🛌 Rest Day'
        }
      };

    default:
      return state;
  }
};

interface GymContextType {
  state: GymState;
  dispatch: React.Dispatch<GymAction>;
  services: {
    exerciseService: ExerciseService;
    progressService: ProgressService;
    notesRepository: IDayNotesRepository;
  };
}

const GymContext = createContext<GymContextType | undefined>(undefined);

export const useGym = (): GymContextType => {
  const context = useContext(GymContext);
  if (!context) {
    throw new Error('useGym must be used within a GymProvider');
  }
  return context;
};

interface GymProviderProps {
  children: ReactNode;
}

export const GymProvider: React.FC<GymProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(gymReducer, initialState);

  // Initialize repositories and services once. useMemo keeps a single instance
  // for the lifetime of the provider (which is remounted per user via `key`).
  const services = useMemo(() => {
    const exerciseRepository = new SupabaseExerciseRepository();
    const progressRepository = new SupabaseProgressRepository();
    const notesRepository: IDayNotesRepository = new SupabaseDayNotesRepository();
    const exerciseService = new ExerciseService(exerciseRepository, progressRepository);
    const progressService = new ProgressService(exerciseRepository, progressRepository);
    return { exerciseService, progressService, notesRepository };
  }, []);

  const { exerciseService, progressService, notesRepository } = services;

  // Load initial data from the database (async).
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [exercises, progress, notes] = await Promise.all([
        exerciseService.getAllExercises(),
        progressService.getWeeklyProgress(),
        notesRepository.getNotes()
      ]);

      if (cancelled) return;

      dispatch({ type: 'SET_EXERCISES', payload: exercises });
      dispatch({ type: 'SET_WEEKLY_PROGRESS', payload: progress });
      dispatch({ type: 'LOAD_DAY_NOTES', payload: notes });

      // Open today's workout by default
      const today = new Date();
      const dayIndex = (today.getDay() + 6) % 7; // Convert to Monday=0, Tuesday=1, etc.
      const dayIds = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const todayId = dayIds[dayIndex] || 'monday';

      dispatch({ type: 'TOGGLE_DAY', payload: todayId });
    };

    load().catch(err => console.error('Failed to load gym data:', err));

    return () => {
      cancelled = true;
    };
  }, [exerciseService, progressService, notesRepository]);

  // Recompute progress whenever exercises change (async).
  useEffect(() => {
    let cancelled = false;
    progressService
      .getWeeklyProgress()
      .then(progress => {
        if (!cancelled) dispatch({ type: 'SET_WEEKLY_PROGRESS', payload: progress });
      })
      .catch(err => console.error('Failed to compute weekly progress:', err));
    return () => {
      cancelled = true;
    };
  }, [state.exercises, progressService]);

  return (
    <GymContext.Provider value={{ state, dispatch, services }}>
      {children}
    </GymContext.Provider>
  );
};
