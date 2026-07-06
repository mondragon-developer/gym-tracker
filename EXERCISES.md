# Exercise Library

Every exercise available in the Gym Tracker app, grouped by muscle group. Source of truth: `src/constants/index.js` (`EXERCISE_DATABASE`). Spanish names come from `src/translations/exercises.js` (`—` where the app has no translation yet).

**159 exercises across 11 categories.**

> **Note on Yoga / flexibility / sports:** The app has **no yoga, stretching, or mobility exercises**. There is an `EXERCISE_TYPES.FLEXIBILITY` constant defined, but no exercises use it — the two exercise types actually in use are **strength** and **cardio**. Running, swimming, cycling, and CrossFit-style movements live under the **Cardio** category; boxing and martial-arts work lives under **Combat** (both are time-based). Neither has demo images — the free dataset the demos come from is gym-only.

---

## Chest (14)

| Exercise | Ejercicio (ES) |
|---|---|
| Barbell Bench Press | Press de Banca con Barra |
| Incline Dumbbell Press | Press Inclinado con Mancuernas |
| Cable Flyes | Aperturas en Polea |
| Dumbbell Press | Press con Mancuernas |
| Push-Ups | Flexiones |
| Machine Chest Press | Press de Pecho en Máquina |
| Dumbbell Flyes | Aperturas con Mancuernas |
| Cable Crossovers | Cruces en Polea |
| Pec Deck Machine | Máquina Peck Deck |
| Floor Press | Press de Suelo |
| Decline Bench Press | Press Declinado |
| Diamond Push-Ups | Flexiones Diamante |
| Chest Dips | Fondos para Pecho |
| Landmine Press | Press con Mina Terrestre |

## Back (18)

| Exercise | Ejercicio (ES) |
|---|---|
| Pull-ups | Dominadas |
| Seated Cable Rows | Remo Sentado en Polea |
| Lat Pulldowns | Jalón al Pecho |
| Bent-Over Barbell Rows | Remo con Barra Inclinado |
| Single-Arm Dumbbell Rows | Remo con Mancuerna a Un Brazo |
| T-Bar Rows | Remo en T |
| Face Pulls | Jalón a la Cara |
| Straight-Arm Pulldowns | Pullover en Polea |
| Barbell Shrugs | Encogimientos con Barra |
| Dumbbell Shrugs | Encogimientos con Mancuernas |
| Farmer's Walk | Paseo del Granjero |
| Rack Pulls | Peso Muerto Parcial |
| Cable Shrugs | Encogimientos en Polea |
| Trap Bar Shrugs | Encogimientos con Barra Trap |
| Chin-ups | Dominadas Supinas |
| Pendlay Rows | Remo Pendlay |
| Inverted Rows | Remo Invertido |
| Meadows Rows | Remo Meadows |

## Shoulders (12)

| Exercise | Ejercicio (ES) |
|---|---|
| Military Press | Press Militar |
| Lateral Raises | Elevaciones Laterales |
| Overhead Press | Press sobre Cabeza |
| Arnold Press | Press Arnold |
| Front Raises | Elevaciones Frontales |
| Upright Rows | Remo al Mentón |
| Reverse Pec Deck Flyes | Aperturas Inversas en Máquina |
| Push Press | Press de Empuje |
| Bradford Press | Press Bradford |
| Cable Lateral Raises | Elevaciones Laterales en Polea |
| Rear Delt Rows | Remo de Deltoides Posterior |
| Handstand Push-Ups | Flexiones en Parada de Manos |

## Biceps (12)

| Exercise | Ejercicio (ES) |
|---|---|
| Barbell Curls | Curl con Barra |
| Hammer Curls | Curl Martillo |
| Dumbbell Curls | Curl con Mancuernas |
| Preacher Curls | Curl en Banco Scott |
| EZ-Bar Curls | Curl con Barra EZ |
| Concentration Curls | Curl Concentrado |
| Incline Dumbbell Curls | Curl Inclinado con Mancuernas |
| Cable Curls | Curl en Polea |
| Spider Curls | Curl Araña |
| 21s | 21s |
| Drag Curls | Curl de Arrastre |
| Cable Hammer Curls | Curl Martillo en Polea |

## Triceps (12)

| Exercise | Ejercicio (ES) |
|---|---|
| Skull Crushers | Rompe Cráneos |
| Rope Pushdowns | Extensión con Cuerda |
| Triceps Pushdowns | Extensión de Tríceps en Polea |
| Close-Grip Bench Press | Press de Banca Cerrado |
| Overhead Dumbbell Extension | Extensión sobre Cabeza con Mancuernas |
| Skullcrushers | Rompe Cráneos |
| Dips | — |
| Bench Dips | Fondos en Banco |
| Tate Press | Press Tate |
| JM Press | Press JM |
| Cable Overhead Extension | Extensión sobre Cabeza en Polea |
| Single-Arm Cable Pushdowns | Extensión en Polea a Un Brazo |

## Forearms (10)

| Exercise | Ejercicio (ES) |
|---|---|
| Wrist Curls | Curl de Muñeca |
| Reverse Wrist Curls | Curl de Muñeca Inverso |
| Plate Pinches | Pinza de Discos |
| Towel Pull-Ups | Dominadas con Toalla |
| Reverse Barbell Curls | Curl Inverso con Barra |
| Wrist Roller | Rodillo de Muñeca |
| Dead Hangs | Colgarse |
| Farmer's Carry | Paseo del Granjero |
| Gripper Training | Entrenamiento con Gripper |
| Finger Curls | Curl de Dedos |

## Legs (33)

| Exercise | Ejercicio (ES) |
|---|---|
| Barbell Squats | Sentadillas con Barra |
| Leg Press | Prensa de Piernas |
| Romanian Deadlifts | Peso Muerto Rumano |
| Single-Leg Calf Raises | Elevaciones de Pantorrilla a Una Pierna |
| Barbell Hip Thrusts | Empuje de Cadera |
| Glute Bridges | Puente de Glúteos |
| Squats (Wide Stance) | — |
| Lunges | Zancadas |
| Step-Ups | Subidas al Cajón |
| Cable Kickbacks | — |
| Bulgarian Split Squats | Sentadillas Búlgaras |
| Deadlifts | Peso Muerto |
| Leg Extensions | Extensiones de Cuádriceps |
| Front Squats | Sentadillas Frontales |
| Hack Squats | Sentadillas Hack |
| Sissy Squats | Sentadillas Sissy |
| Lying Leg Curls | Curl Femoral Acostado |
| Seated Leg Curls | Curl Femoral Sentado |
| Good Mornings | Buenos Días |
| Glute-Ham Raises (GHR) | Elevaciones Glúteo-Femoral |
| Single-Leg Deadlifts | Peso Muerto a Una Pierna |
| Nordic Ham Curls | Curl Nórdico |
| Kettlebell Swings | Balanceo con Kettlebell |
| Standing Calf Raises | Elevaciones de Pantorrilla |
| Seated Calf Raises | Elevaciones de Pantorrilla Sentado |
| Donkey Calf Raises | Elevaciones de Pantorrilla Burro |
| Calf Press on Leg Machine | — |
| Jump Rope | Saltar la Cuerda |
| Box Jumps | Saltos al Cajón |
| Goblet Squats | Sentadillas Goblet |
| Walking Lunges | Zancadas Caminando |
| Pistol Squats | Sentadillas Pistola |
| Wall Sits | Sentadilla en Pared |

## Abs (18)

| Exercise | Ejercicio (ES) |
|---|---|
| Cable Crunches | Abdominales en Polea |
| Hanging Leg Raises | Elevaciones de Piernas Colgado |
| Plank | Plancha |
| Russian Twists | Giros Rusos |
| Bicycle Crunches | Abdominales Bicicleta |
| Mountain Climbers | Escaladores |
| Ab Wheel Rollouts | Rueda Abdominal |
| Side Plank | Plancha Lateral |
| Dead Bug | Bicho Muerto |
| Bird Dog | Perro de Caza |
| Leg Raises | Elevaciones de Piernas |
| V-Ups | — |
| Pallof Press | — |
| Hollow Body Hold | — |
| Wood Choppers | Leñador |
| Flutter Kicks | Patadas de Tijera |
| Scissor Kicks | — |
| Toe Touches | Toques de Punta |

## Cardio — running, swimming, cycling, boxing & CrossFit (18)

This is where every non-strength movement lives. Tagged by discipline for clarity.

| Exercise | Ejercicio (ES) | Type |
|---|---|---|
| Treadmill Running | Correr en Cinta | Running |
| Sprint Intervals | Intervalos de Sprint | Running |
| Swimming | Natación | Swimming |
| Stationary Bike | Bicicleta Estática | Cycling |
| Cycling | Ciclismo | Cycling |
| Elliptical | Elíptica | Cardio machine |
| Stair Climber | Escaladora | Cardio machine |
| Rowing Machine | Máquina de Remo | Cardio machine / CrossFit |
| Ski Erg | — | CrossFit |
| Assault Bike | — | CrossFit |
| Battle Ropes | Cuerdas de Batalla | CrossFit |
| Burpees | Burpees | CrossFit |
| Sled Push | Empuje de Trineo | CrossFit |
| Sled Pull | Arrastre de Trineo | CrossFit |
| Jump Rope HIIT | — | CrossFit / HIIT |
| Boxing | Boxeo | Sport |
| Jumping Jacks | Saltos de Tijera | Bodyweight cardio |
| High Knees | Rodillas Altas | Bodyweight cardio |

## Combat — boxing & martial arts (12)

Time-based like cardio: plan rounds/drills in minutes, log minutes completed. No demo images (the free exercise-image dataset has no combat content).

| Exercise | Ejercicio (ES) | Type |
|---|---|---|
| Shadowboxing | Boxeo de Sombra | Boxing |
| Heavy Bag Rounds | Rondas de Saco Pesado | Boxing |
| Speed Bag | Pera de Velocidad | Boxing |
| Double-End Bag | Pera de Doble Anclaje | Boxing |
| Pad Work (Mitts) | Trabajo de Manoplas | Boxing |
| Sparring | Sparring | Boxing / MMA |
| Kickboxing Rounds | Rondas de Kickboxing | Kickboxing |
| Kicking Drills | Ejercicios de Patadas | Kickboxing / Muay Thai |
| Boxing Footwork Drills | Juego de Pies de Boxeo | Boxing |
| Defensive Drills (Slips & Rolls) | Defensa (Esquivas y Giros) | Boxing |
| Grappling Drills | Ejercicios de Grappling | MMA / BJJ |
| MMA Conditioning Circuit | Circuito de Acondicionamiento MMA | MMA |
