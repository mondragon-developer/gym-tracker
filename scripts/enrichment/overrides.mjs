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

  // --- cardio ---
  193: '0685', // Treadmill Running -> run
  197: '2311', // Stair Climber     -> walking on stepmill
  198: '0128', // Battle Ropes      -> battling ropes
  209: '2142', // Ski Erg           -> ski ergometer
  202: '2138', // Cycling           -> stationary bike run v. 3
  203: '3224', // Jumping Jacks     -> jack jump
};
