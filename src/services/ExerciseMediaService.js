/**
 * Exercise Media Service — demonstration images for exercises.
 *
 * PILOT: maps our EXERCISE_DATABASE ids (the `dbId` carried on plan exercises)
 * to start/end demonstration frames from the free, public-domain dataset
 * yuhonas/free-exercise-db, served via the jsDelivr CDN.
 *
 * The source is intentionally abstracted behind BASE_URL + a folder map, so
 * scaling to all exercises (or swapping to self-hosted animated clips on
 * Supabase Storage) is a one-line change here — nothing else in the app cares
 * where the frames come from.
 */

const BASE_URL = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises';

// dbId (EXERCISE_DATABASE.id) -> source folder in the free dataset.
// Each folder holds 0.jpg (start of the movement) and 1.jpg (end).
// 122 of our 147 exercises are mapped to a correct or same-movement demo;
// the rest (a few oddballs and most pure cardio) intentionally have none and
// fall back to no demo — better than showing the wrong exercise.
const MEDIA_FOLDERS = {
  // Chest
  1: 'Barbell_Bench_Press_-_Medium_Grip',
  2: 'Incline_Dumbbell_Press',
  3: 'Flat_Bench_Cable_Flyes',
  81: 'Dumbbell_Bench_Press',
  82: 'Pushups',
  83: 'Leverage_Chest_Press',
  84: 'Dumbbell_Flyes',
  85: 'Cable_Crossover',
  87: 'Floor_Press',
  150: 'Decline_Barbell_Bench_Press',
  152: 'Dips_-_Chest_Version',

  // Back
  9: 'Pullups',
  11: 'Seated_Cable_Rows',
  88: 'Wide-Grip_Lat_Pulldown',
  89: 'Bent_Over_Barbell_Row',
  90: 'One-Arm_Dumbbell_Row',
  91: 'T-Bar_Row_with_Handle',
  92: 'Face_Pull',
  93: 'Straight-Arm_Pulldown',
  100: 'Barbell_Shrug',
  101: 'Dumbbell_Shrug',
  102: 'Farmers_Walk',
  103: 'Rack_Pulls',
  104: 'Cable_Shrugs',
  105: 'Barbell_Shrug',
  154: 'Chin-Up',
  155: 'Bent_Over_Barbell_Row',
  156: 'Inverted_Row',

  // Shoulders
  17: 'Standing_Military_Press',
  19: 'Side_Lateral_Raise',
  94: 'Standing_Military_Press',
  95: 'Arnold_Dumbbell_Press',
  96: 'Front_Dumbbell_Raise',
  97: 'Upright_Barbell_Row',
  98: 'Reverse_Machine_Flyes',
  99: 'Push_Press',
  158: 'Standing_Bradford_Press',
  159: 'Cable_Seated_Lateral_Raise',
  160: 'Cable_Rope_Rear-Delt_Rows',
  161: 'Handstand_Push-Ups',

  // Biceps
  38: 'Barbell_Curl',
  40: 'Hammer_Curls',
  113: 'Dumbbell_Bicep_Curl',
  114: 'Machine_Preacher_Curls',
  115: 'EZ-Bar_Curl',
  116: 'Concentration_Curls',
  117: 'Incline_Dumbbell_Curl',
  118: 'High_Cable_Curls',
  162: 'Spider_Curl',
  163: 'Barbell_Curl',
  164: 'Drag_Curl',
  165: 'Cable_Hammer_Curls_-_Rope_Attachment',

  // Triceps
  30: 'Triceps_Pushdown_-_Rope_Attachment',
  106: 'Triceps_Pushdown',
  107: 'Close-Grip_Barbell_Bench_Press',
  108: 'Standing_Dumbbell_Triceps_Extension',
  110: 'Dips_-_Triceps_Version',
  111: 'Bench_Dips',
  112: 'Tate_Press',
  166: 'JM_Press',
  167: 'Cable_Rope_Overhead_Triceps_Extension',
  168: 'Cable_One_Arm_Tricep_Extension',

  // Forearms
  119: 'Seated_Palm-Up_Barbell_Wrist_Curl',
  120: 'Seated_Palms-Down_Barbell_Wrist_Curl',
  121: 'Plate_Pinch',
  123: 'Reverse_Barbell_Curl',
  124: 'Wrist_Roller',
  170: 'Farmers_Walk',
  172: 'Finger_Curls',

  // Legs
  60: 'Barbell_Full_Squat',
  61: 'Leg_Press',
  66: 'Romanian_Deadlift',
  80: 'Standing_Calf_Raises',
  125: 'Barbell_Hip_Thrust',
  126: 'Barbell_Glute_Bridge',
  127: 'Wide_Stance_Barbell_Squat',
  128: 'Dumbbell_Lunges',
  129: 'Dumbbell_Step_Ups',
  130: 'One-Legged_Cable_Kickback',
  131: 'Split_Squats',
  132: 'Barbell_Deadlift',
  133: 'Leg_Extensions',
  134: 'Front_Squats_With_Two_Kettlebells',
  135: 'Hack_Squat',
  137: 'Lying_Leg_Curls',
  138: 'Seated_Leg_Curl',
  139: 'Good_Morning',
  140: 'Glute_Ham_Raise',
  142: 'Natural_Glute_Ham_Raise',
  143: 'One-Arm_Kettlebell_Swings',
  144: 'Standing_Calf_Raises',
  145: 'Seated_Calf_Raise',
  146: 'Donkey_Calf_Raises',
  147: 'Calf_Press_On_The_Leg_Press_Machine',
  148: 'Rope_Jumping',
  149: 'Front_Box_Jump',
  173: 'Goblet_Squat',
  174: 'Bodyweight_Walking_Lunge',
  175: 'Kettlebell_Pistol_Squat',

  // Abs
  57: 'Cable_Crunch',
  71: 'Hanging_Leg_Raise',
  177: 'Plank',
  178: 'Russian_Twist',
  179: 'Air_Bike',
  180: 'Mountain_Climbers',
  181: 'Barbell_Ab_Rollout',
  182: 'Side_Bridge',
  183: 'Dead_Bug',
  187: 'Pallof_Press',
  189: 'Standing_Cable_Wood_Chop',
  190: 'Flutter_Kicks',
  191: 'Scissor_Kick',
  192: 'Toe_Touchers',

  // Cardio (only the ones with a genuine demo in the dataset)
  193: 'Running_Treadmill',
  194: 'Bicycling_Stationary',
  195: 'Rowing_Stationary',
  196: 'Elliptical_Trainer',
  197: 'Step_Mill',
  198: 'Battling_Ropes',
  202: 'Bicycling',
  207: 'Sled_Push',
  210: 'Rope_Jumping'
};

/**
 * Whether we have demonstration media for a given exercise.
 * @param {number|string|undefined|null} dbId
 * @returns {boolean}
 */
export function hasExerciseMedia(dbId) {
  return dbId != null && Boolean(MEDIA_FOLDERS[dbId]);
}

/**
 * The demonstration frames for an exercise, or null when we have none
 * (custom exercises have no dbId; others may simply not be mapped yet).
 * @param {number|string|undefined|null} dbId
 * @returns {{ frames: string[] } | null}
 */
export function getExerciseMedia(dbId) {
  const folder = dbId != null ? MEDIA_FOLDERS[dbId] : undefined;
  if (!folder) return null;
  return { frames: [`${BASE_URL}/${folder}/0.jpg`, `${BASE_URL}/${folder}/1.jpg`] };
}
