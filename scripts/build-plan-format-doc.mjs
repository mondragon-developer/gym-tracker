// Writes docs/chatbot/08-plan-format-en.txt and 08-formato-plan-es.txt: the
// GYMPLAN v1 format the AI coach must emit so the app's Import plan screen
// can read it, plus the full bilingual exercise and muscle-group tables the
// bot copies names from. The prose lives here so a rerun after a library
// change never loses it. Run with `npm run build:plan-doc`.

import { writeFileSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { EXERCISE_DATABASE } from '../src/constants/index.js';
import { INDIVIDUAL_MUSCLE_GROUPS } from '../src/constants/AppConstants.js';
import { exerciseTranslations } from '../src/translations/exercises.js';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'docs', 'chatbot');

const es = (name) => exerciseTranslations[name] ?? name;
const groups = INDIVIDUAL_MUSCLE_GROUPS.filter(group => group !== 'Rest');

const groupTable = (lang) => {
    const head = lang === 'en' ? '| English | Spanish |\n|---|---|\n' : '| Español | English |\n|---|---|\n';
    const rows = ['Rest', ...groups].map(group => (lang === 'en' ? `| ${group} | ${es(group)} |` : `| ${es(group)} | ${group} |`));
    return head + rows.join('\n') + '\n';
};

const exerciseTable = (lang) => {
    const sorted = [...EXERCISE_DATABASE].sort((a, b) => a.muscleGroup.localeCompare(b.muscleGroup) || a.name.localeCompare(b.name));
    const head = lang === 'en'
        ? '| Group | English name | Spanish name |\n|---|---|---|\n'
        : '| Grupo | Nombre en español | Nombre en inglés |\n|---|---|---|\n';
    const rows = sorted.map(entry => (lang === 'en'
        ? `| ${entry.muscleGroup} | ${entry.name} | ${es(entry.name)} |`
        : `| ${es(entry.muscleGroup)} | ${es(entry.name)} | ${entry.name} |`));
    return head + rows.join('\n') + '\n';
};

const EXAMPLE_EN = `\`\`\`
GYMPLAN v1
Monday: Chest & Triceps
- Barbell Bench Press 4x6-8
- Incline Dumbbell Press 3x8-10
- Rope Pushdowns 3x12-15
note: Warm up 5 min on the bike first
Tuesday: Legs
- Barbell Squats 4x6-8
- Romanian Deadlifts 3x8-10
- Plank 3x30-60s
Wednesday: Rest
Thursday: Cardio & Abs
- Stationary Bike 20 min
- Dead Bug 3x10
Friday: Back & Biceps
- Lat Pulldowns 3x10-12
- Barbell Curls 3x10-12
Saturday: Rest
Sunday: Rest
\`\`\``;

const EXAMPLE_ES = `\`\`\`
GYMPLAN v1
Lunes: Pecho y Tríceps
- Press de Banca con Barra 4x6-8
- Press Inclinado con Mancuernas 3x8-10
- Extensión con Cuerda 3x12-15
nota: Calienta 5 min en la bici primero
Martes: Piernas
- Sentadillas con Barra 4x6-8
- Peso Muerto Rumano 3x8-10
- Plancha 3x30-60s
Miércoles: Descanso
Jueves: Cardio y Abdominales
- Bicicleta Estática 20 min
- Bicho Muerto 3x10
Viernes: Espalda y Bíceps
- Jalón al Pecho 3x10-12
- Curl con Barra 3x10-12
Sábado: Descanso
Domingo: Descanso
\`\`\``;

const EN = `# Plan format for the app (GYMPLAN v1)

Gym Tracker has an **Import plan** button under the day cards. The user pastes a plan written in the format below, previews how every line matched the exercise library, and the app builds the week in one tap. This guide tells the assistant exactly how to write that block. Use it whenever the user asks for a weekly or daily plan, a routine, a split, or "what should I do on Monday".

## Rules for the assistant

1. End every plan answer with **one** fenced code block that starts with \`GYMPLAN v1\`. Put the three backticks alone on their own line and \`GYMPLAN v1\` on the next line, never on the backtick line (the chat would hide it). Keep plan answers short: at most one sentence before the block, then the block, then one sentence: "Tap Import on the bar at the top of the app to load this plan." Never write the plan twice: no day-by-day list, table or explanation of the same exercises before or after the block. Tips that matter (warm-up, rest, progression) go inside the block as \`note:\` lines, one short line per day at most. Explain an exercise or the reasoning only when the user asks.
2. Write exercise names **exactly as they appear in the table below**, in the language the user is chatting in (English name or Spanish name). Do not shorten, pluralize or translate them yourself.
3. Strength exercises: \`Name SETSxREPS\`, for example \`Barbell Bench Press 4x6-8\`. Reps can be a number, a range like \`8-10\`, a hold like \`30-60s\`, or \`max\`.
4. Cardio and Combat exercises: \`Name MINUTES min\`, for example \`Stationary Bike 20 min\`. Never sets x reps for them.
5. One line per weekday, \`Weekday: Group\` with up to three groups from the group table joined by \`&\` (or \`y\` in Spanish). Off days are \`Weekday: Rest\` (\`Descanso\`).
6. List all seven weekdays, Monday to Sunday, in order.
7. At most 8 exercises per day. Put an optional day note on its own line as \`note: ...\` (\`nota: ...\`).
8. No weights. The app keeps last week's weights and the user fills in the rest.
9. Do not invent exercise names. If the user explicitly asks for something the library lacks (a machine, a sport drill), write it with the prefix \`custom:\` so the app creates a custom exercise, for example \`- custom: Sled Push with rope 4x20\`.
10. Every exercise in the block must exist in the table, unless it carries the \`custom:\` prefix.

## Example (English chat)

${EXAMPLE_EN}

## Example (Spanish chat)

${EXAMPLE_ES}

## How the app reads it

Exact English or Spanish names from the table become library exercises with their demo and instructions. Small typos still match, but the user has to confirm them. Anything else becomes a custom exercise (no demo). The user chooses, per day, whether the block replaces the day, is added after the existing exercises, or is skipped, and whether days not listed become Rest or stay as they are. Undo is available after applying.

## Muscle groups

${groupTable('en')}
## Exercise names (${EXERCISE_DATABASE.length} entries)

${exerciseTable('en')}`;

const ES = `# Formato de plan para la app (GYMPLAN v1)

Gym Tracker tiene un botón **Importar plan** debajo de las tarjetas de los días. El usuario pega un plan escrito en el formato de abajo, revisa cómo se reconoció cada línea en la biblioteca de ejercicios y la app arma la semana con un toque. Esta guía indica al asistente exactamente cómo escribir ese bloque. Úsala siempre que el usuario pida un plan semanal o diario, una rutina, una división o "qué hago el lunes".

## Reglas para el asistente

1. Termina cada respuesta con plan con **un** bloque de código que empiece por \`GYMPLAN v1\`. Pon las tres comillas invertidas solas en su línea y \`GYMPLAN v1\` en la línea siguiente, nunca en la línea de las comillas (el chat lo ocultaría). Respuestas con plan cortas: como mucho una frase antes del bloque, luego el bloque, luego una frase: "Toca Importar en la barra de arriba de la app para cargar este plan." Nunca escribas el plan dos veces: nada de lista por días, tabla o explicación de los mismos ejercicios antes o después del bloque. Los consejos importantes (calentamiento, descanso, progresión) van dentro del bloque como líneas \`nota:\`, como mucho una línea corta por día. Explica un ejercicio o el porqué solo si el usuario lo pide.
2. Escribe los nombres de los ejercicios **exactamente como aparecen en la tabla de abajo**, en el idioma en que chatea el usuario (nombre en español o en inglés). No los acortes, pluralices ni traduzcas por tu cuenta.
3. Ejercicios de fuerza: \`Nombre SERIESxREPS\`, por ejemplo \`Press de Banca con Barra 4x6-8\`. Las reps pueden ser un número, un rango como \`8-10\`, un aguante como \`30-60s\` o \`max\`.
4. Ejercicios de Cardio y Combate: \`Nombre MINUTOS min\`, por ejemplo \`Bicicleta Estática 20 min\`. Nunca series x reps para ellos.
5. Una línea por día, \`Día: Grupo\` con hasta tres grupos de la tabla de grupos unidos con \`y\` (o \`&\` en inglés). Los días libres son \`Día: Descanso\` (\`Rest\`).
6. Lista los siete días, de lunes a domingo, en orden.
7. Máximo 8 ejercicios por día. Una nota opcional del día va en su propia línea como \`nota: ...\` (\`note: ...\`).
8. Sin pesos. La app conserva los pesos de la semana pasada y el usuario completa el resto.
9. No inventes nombres de ejercicios. Si el usuario pide explícitamente algo que no está en la biblioteca (una máquina, un ejercicio de un deporte), escríbelo con el prefijo \`personalizado:\` para que la app cree un ejercicio personalizado, por ejemplo \`- personalizado: Empuje de trineo con cuerda 4x20\`.
10. Todo ejercicio del bloque debe existir en la tabla, salvo que lleve el prefijo \`personalizado:\`.

## Ejemplo (chat en español)

${EXAMPLE_ES}

## Ejemplo (chat en inglés)

${EXAMPLE_EN}

## Cómo lo lee la app

Los nombres exactos en español o inglés de la tabla pasan a ser ejercicios de la biblioteca con su demostración e instrucciones. Los errores pequeños de escritura también coinciden, pero el usuario debe confirmarlos. Cualquier otra cosa pasa a ser un ejercicio personalizado (sin demostración). El usuario decide, por día, si el bloque reemplaza el día, se añade después de los ejercicios existentes o se omite, y si los días no listados pasan a Descanso o quedan como están. Hay Deshacer después de aplicar.

## Grupos musculares

${groupTable('es')}
## Nombres de ejercicios (${EXERCISE_DATABASE.length} entradas)

${exerciseTable('es')}`;

writeFileSync(join(outDir, '08-plan-format-en.txt'), EN, 'utf8');
writeFileSync(join(outDir, '08-formato-plan-es.txt'), ES, 'utf8');
// README.md stays for GitHub; README.txt is the same text for the Chatbase upload.
copyFileSync(join(outDir, 'README.md'), join(outDir, 'README.txt'));
console.log(`wrote 08-plan-format-en.txt, 08-formato-plan-es.txt (${EXERCISE_DATABASE.length} exercises) and README.txt`);
