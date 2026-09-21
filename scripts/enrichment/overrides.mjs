/**
 * Manual overrides for the enrichment matcher.
 *
 * Maps our EXERCISE_DATABASE.id -> a specific exercises-dataset record id, for
 * exercises the automatic name matcher misses because our generic name and the
 * dataset's name share no tokens (synonyms, different phrasing). Each entry was
 * hand-verified against the dataset (correct movement + muscle).
 *
 * Exercises with no genuine dataset equivalent are intentionally left out
 * (combat drills, swimming, gripper/plate-pinch grip work, ab-only holds, etc.)
 * so we never attach misleading instructions.
 */
export const OVERRIDES = {
  // --- strength ---
  90: '0292',  // Single-Arm Dumbbell Rows -> dumbbell one arm bent-over row
  98: '0602',  // Reverse Pec Deck Flyes   -> lever seated reverse fly (machine rear-delt)
  127: '3142', // Squats (Wide Stance)     -> smith sumo squat (wide stance == sumo)
  181: '0857', // Ab Wheel Rollouts        -> wheel rollerout
  170: '2133', // Farmer's Carry           -> farmers walk (same movement, forearms variant)
  86: '0596',  // Pec Deck Machine         -> lever seated fly (same machine movement)
  92: '0203',  // Face Pulls               -> cable rear delt row with rope (a face pull by another name)
  105: '0095', // Trap Bar Shrugs          -> barbell shrug (same shrug, different implement)
  124: '0859', // Wrist Roller             -> wrist rollerer
  125: '1409', // Barbell Hip Thrusts      -> barbell glute bridge (same barbell glute pattern)
  142: '3193', // Nordic Ham Curls         -> glute-ham raise (same hamstring eccentric)

  // --- cardio ---
  193: '0685', // Treadmill Running -> run
  197: '2311', // Stair Climber     -> walking on stepmill
  198: '0128', // Battle Ropes      -> battling ropes
  209: '2142', // Ski Erg           -> ski ergometer
  202: '2138', // Cycling           -> stationary bike run v. 3
  203: '3224', // Jumping Jacks     -> jack jump
  126: '3013', // Glute Bridges            -> low glute bridge on floor (our entry is the body-weight bridge; hip thrusts are the barbell one)
  223: '0489', // Hyperextensions          -> hyperextension (bench back extension)
  243: '3645', // Single-Leg Glute Bridges -> single leg bridge with outstretched leg
  111: '0129', // Bench Dips               -> bench dip (knees bent), body weight rather than the weighted variant
  179: '0003', // Bicycle Crunches         -> air bike (body weight; the band variant matched by name)
  19: '0334', // Lateral Raises           -> dumbbell lateral raise (name matched the cable variant)
};
