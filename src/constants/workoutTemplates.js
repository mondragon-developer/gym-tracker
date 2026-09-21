/**
 * Ready-made weekly plans a user or trainer can apply to a week.
 *
 * Every exercise references the library by dbId so demos, equipment and
 * instructions resolve exactly as for exercises added by hand. Day names use
 * the same muscle-group labels the day editor offers (up to three, joined by
 * " & ", or "Rest"). Weights start empty; completion starts cleared.
 */

import { EXERCISE_DATABASE } from './index.js';
import workoutService from '../services/workoutService.js';

const byId = new Map(EXERCISE_DATABASE.map(ex => [ex.id, ex]));

// Strength: sets x reps. Cardio: minutes in `sets`, reps left empty, which
// is how the app stores time-based exercises.
const ex = (dbId, sets, reps = '') => {
    const entry = byId.get(dbId);
    if (!entry) throw new Error(`Unknown exercise id ${dbId} in workout template`);
    return {
        id: `tpl-${dbId}`,
        dbId,
        name: entry.name,
        sets: String(sets),
        reps: String(reps),
        weight: '',
        effectiveSets: '',
        status: 'incomplete'
    };
};

const day = (name, exercises = []) => ({ name, exercises });
const rest = () => day('Rest', []);

const upperLower = () => ({
    Monday: day('Chest & Back & Shoulders', [
        ex(1, 4, '6-8'),      // Barbell Bench Press
        ex(89, 4, '6-8'),     // Bent-Over Barbell Rows
        ex(94, 3, '8-10'),    // Overhead Press
        ex(88, 3, '10-12'),   // Lat Pulldowns
        ex(38, 3, '10-12'),   // Barbell Curls
        ex(30, 3, '10-12')    // Rope Pushdowns
    ]),
    Tuesday: day('Legs', [
        ex(60, 4, '6-8'),     // Barbell Squats
        ex(66, 3, '8-10'),    // Romanian Deadlifts
        ex(61, 3, '10-12'),   // Leg Press
        ex(137, 3, '10-12'),  // Lying Leg Curls
        ex(144, 4, '12-15'),  // Standing Calf Raises
        ex(71, 3, '10-15')    // Hanging Leg Raises
    ]),
    Wednesday: day('Cardio & Abs', [
        ex(194, 20),          // Stationary Bike, 20 min
        ex(183, 3, '10'),     // Dead Bug
        ex(184, 3, '10')      // Bird Dog
    ]),
    Thursday: day('Chest & Back & Shoulders', [
        ex(2, 4, '8-10'),     // Incline Dumbbell Press
        ex(11, 4, '8-10'),    // Seated Cable Rows
        ex(95, 3, '10-12'),   // Arnold Press
        ex(9, 3, '6-10'),     // Pull-ups
        ex(40, 3, '10-12'),   // Hammer Curls
        ex(108, 3, '10-12')   // Overhead Dumbbell Extension
    ]),
    Friday: day('Legs', [
        ex(132, 4, '5'),      // Deadlifts
        ex(134, 3, '8'),      // Front Squats
        ex(131, 3, '10'),     // Bulgarian Split Squats
        ex(138, 3, '12'),     // Seated Leg Curls
        ex(145, 4, '15'),     // Seated Calf Raises
        ex(57, 3, '15')       // Cable Crunches
    ]),
    Saturday: rest(),
    Sunday: rest()
});

const fullBodyThree = () => ({
    Monday: day('Legs & Chest & Back', [
        ex(60, 3, '8'),       // Barbell Squats
        ex(1, 3, '8'),        // Barbell Bench Press
        ex(89, 3, '8'),       // Bent-Over Barbell Rows
        ex(94, 2, '10'),      // Overhead Press
        ex(57, 2, '15')       // Cable Crunches
    ]),
    Tuesday: rest(),
    Wednesday: day('Legs & Chest & Back', [
        ex(132, 3, '6'),      // Deadlifts
        ex(2, 3, '10'),       // Incline Dumbbell Press
        ex(88, 3, '10'),      // Lat Pulldowns
        ex(128, 2, '12'),     // Lunges
        ex(71, 2, '12')       // Hanging Leg Raises
    ]),
    Thursday: rest(),
    Friday: day('Legs & Chest & Shoulders', [
        ex(61, 3, '12'),      // Leg Press
        ex(81, 3, '10'),      // Dumbbell Press
        ex(11, 3, '10'),      // Seated Cable Rows
        ex(19, 2, '15'),      // Lateral Raises
        ex(177, 3, '30-60s')  // Plank, each set is a timed hold
    ]),
    Saturday: rest(),
    Sunday: rest()
});

// No equipment at all: floor, a wall and a sturdy chair or step.
const homeBodyweight = () => ({
    Monday: day('Chest & Legs & Abs', [
        ex(82, 3, '10-15'),   // Push-Ups
        ex(131, 3, '10'),     // Bulgarian Split Squats
        ex(126, 3, '15'),     // Glute Bridges
        ex(177, 3, '30-60s'), // Plank
        ex(180, 3, '20')      // Mountain Climbers
    ]),
    Tuesday: rest(),
    Wednesday: day('Back & Legs & Triceps', [
        ex(225, 3, '12'),     // Superman
        ex(224, 3, '12'),     // Bodyweight Back Extensions
        ex(174, 3, '12'),     // Walking Lunges
        ex(111, 3, '10'),     // Bench Dips
        ex(182, 3, '30s')     // Side Plank
    ]),
    Thursday: rest(),
    Friday: day('Legs & Chest & Abs', [
        ex(176, 3, '45s'),    // Wall Sits
        ex(241, 3, '8-12'),   // Decline Push-Ups
        ex(243, 3, '10'),     // Single-Leg Glute Bridges
        ex(183, 3, '10'),     // Dead Bug
        ex(179, 3, '15')      // Bicycle Crunches
    ]),
    Saturday: rest(),
    Sunday: rest()
});

// One pair of dumbbells, upper/lower split.
const dumbbellOnly = () => ({
    Monday: day('Chest & Back & Shoulders', [
        ex(81, 4, '8-10'),    // Dumbbell Press
        ex(235, 4, '8-10'),   // Bent-Over Dumbbell Rows
        ex(234, 3, '8-10'),   // Dumbbell Shoulder Press
        ex(236, 3, '10-12'),  // Dumbbell Pullovers
        ex(40, 3, '10-12'),   // Hammer Curls
        ex(239, 3, '12')      // Dumbbell Triceps Kickbacks
    ]),
    Tuesday: day('Legs', [
        ex(173, 4, '8-10'),   // Goblet Squats
        ex(229, 3, '10'),     // Dumbbell Romanian Deadlifts
        ex(230, 3, '10'),     // Dumbbell Lunges
        ex(231, 3, '10'),     // Dumbbell Step-Ups
        ex(237, 4, '15')      // Dumbbell Calf Raises
    ]),
    Wednesday: rest(),
    Thursday: day('Chest & Back & Shoulders', [
        ex(2, 4, '8-10'),     // Incline Dumbbell Press
        ex(90, 4, '10'),      // Single-Arm Dumbbell Rows
        ex(95, 3, '10'),      // Arnold Press
        ex(19, 3, '12-15'),   // Lateral Raises
        ex(113, 3, '10-12'),  // Dumbbell Curls
        ex(108, 3, '10-12')   // Overhead Dumbbell Extension
    ]),
    Friday: day('Legs & Abs', [
        ex(232, 4, '10'),     // Dumbbell Squats
        ex(131, 3, '10'),     // Bulgarian Split Squats
        ex(243, 3, '12'),     // Single-Leg Glute Bridges
        ex(102, 3, '30-40s'), // Farmer's Walk
        ex(178, 3, '20')      // Russian Twists
    ]),
    Saturday: rest(),
    Sunday: rest()
});

/**
 * Template ids are stable: they are used as translation keys and may end up
 * in analytics or support conversations.
 */
export const WORKOUT_TEMPLATES = [
    {
        id: 'ppl',
        name: 'Classic Push / Pull / Legs',
        description: '6 days a week. Push, pull and legs twice each, Sunday off. About 45-60 minutes per session.',
        daysPerWeek: 6,
        minutes: '45-60',
        build: () => workoutService.getInitialPlan()
    },
    {
        id: 'upper-lower',
        name: 'Upper / Lower with active recovery',
        description: '4 days a week. Upper body Monday and Thursday, lower body Tuesday and Friday, light cardio and core on Wednesday. About 45-60 minutes per session.',
        daysPerWeek: 4,
        recoveryDays: 1,
        minutes: '45-60',
        build: upperLower
    },
    {
        id: 'full-body-3',
        name: 'Full body 3 days (busy schedule)',
        description: 'Monday, Wednesday and Friday. Five exercises per session, about 30-40 minutes.',
        daysPerWeek: 3,
        minutes: '30-40',
        build: fullBodyThree
    },
    {
        id: 'home-bodyweight',
        name: 'Home, no equipment',
        description: 'Monday, Wednesday and Friday with nothing but a floor, a wall and a chair. Five exercises per session, about 30 minutes.',
        daysPerWeek: 3,
        minutes: '25-35',
        build: homeBodyweight
    },
    {
        id: 'dumbbell-only',
        name: 'Dumbbells only',
        description: '4 days a week with one pair of dumbbells. Upper body Monday and Thursday, lower body Tuesday and Friday. About 40-50 minutes.',
        daysPerWeek: 4,
        minutes: '40-50',
        build: dumbbellOnly
    }
];

export const getWorkoutTemplate = (id) => WORKOUT_TEMPLATES.find(tpl => tpl.id === id) ?? null;
