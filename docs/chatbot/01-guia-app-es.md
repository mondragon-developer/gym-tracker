# Gym Tracker — Guía de la App y Base de Conocimiento del Chatbot (Español)

## Acerca de la app

Gym Tracker es una app web gratuita - por ahora - y bilingüe (inglés/español) para planificar y registrar entrenamientos semanales. Está disponible en **gymworkoutjm.vercel.app**, funciona en cualquier teléfono, tableta o computadora, y puede instalarse en la pantalla de inicio del teléfono como una app nativa (es una Progressive Web App). Fue creada por Jose Mondragón.

Capacidades principales:
- Un plan **Push/Pull/Piernas de 6 días** precargado y totalmente personalizable.
- Una biblioteca de **159 ejercicios en 11 categorías** (Pecho, Espalda, Hombros, Bíceps, Tríceps, Antebrazos, Piernas, Abdominales, Cardio, Combate), más ejercicios personalizados que tú creas.
- Los **ejercicios de fuerza** registran series, reps y peso (lbs). Los de **Cardio y Combate** se miden por tiempo y registran minutos (1–120).
- **Demostraciones visuales**: 122 ejercicios tienen una demostración de inicio a fin que se abre con el botón ▶.
- **Seguimiento semanal** con barra de progreso, resumen semanal y exportación a CSV.
- **Funciona con o sin cuenta**: sin cuenta todo se guarda en el dispositivo (almacenamiento local); con una cuenta gratuita todo se sincroniza en la nube y te sigue a cualquier dispositivo.
- **Soporte para entrenadores**: los entrenadores tienen un código/enlace de invitación; los clientes que se registran con él quedan vinculados al entrenador, quien puede gestionar sus planes semanales.

## Alcance y reglas de comportamiento del chatbot

El chatbot integrado en esta app debe:
1. **Ayudar a navegar y usar la app** (todos los flujos descritos en esta guía).
2. **Responder preguntas generales sobre ejercicios**: qué ejercicios existen en la app, qué músculos trabajan, la técnica correcta, errores comunes y recomendaciones generales de entrenamiento (ver el documento Guía de Ejercicios). Los fundamentos generales de alimentación saludable y bienestar (ver los documentos de Nutrición Básica y Consejos de Salud) también entran en el alcance — los planes de dieta personalizados y las prescripciones no.
3. **Nunca dar consejo médico.** No diagnosticar dolores o lesiones, no prescribir tratamientos ni rehabilitación, no aconsejar sobre condiciones médicas, embarazo, medicamentos ni suplementos. Si un usuario menciona dolor, lesión, mareo o una condición de salud, responde con empatía y recomiéndale detener el ejercicio y consultar a un médico, fisioterapeuta o profesional certificado. Sí puedes dar indicaciones genéricas de seguridad como "usa un peso que puedas controlar" o "mantén la espalda neutra".
4. **Responder en el idioma del usuario** (inglés o español).
5. Si un usuario reporta un error o quiere sugerir una función, indícale el botón **"Comparte tu Opinión"** al final de la pantalla principal.
6. Si una pregunta está fuera de la app y de la técnica general de ejercicio (planes de nutrición, preguntas médicas, otras apps), indica amablemente que está fuera de lo que puedes ayudar.

## Guía de navegación pantalla por pantalla

### Encabezado (parte superior)
- **Logo y título**: el logo de Gym Tracker con el lema "Registra tu progreso fitness semanal".
- **Selector de idioma (EN/ES)**: cambia toda la interfaz entre inglés y español al instante. Los nombres de los ejercicios en listas y búsqueda están en inglés; muchos también muestran su nombre en español.
- **Menú de perfil**: muestra la cuenta activa y contiene **Cerrar Sesión**. Si no has iniciado sesión, la app muestra primero la pantalla de inicio de sesión (ver Cuentas más abajo).
- **Botón 🛡️ Admin / 🏋️ Entrenador**: visible solo para administradores y entrenadores; abre su panel de gestión. Los usuarios normales no lo ven.

### Navegador de semanas
Justo debajo del encabezado:
- Muestra **"Semana del \<fecha\>"** — cada semana queda marcada con su rango de fechas real y cada día muestra su fecha de calendario.
- Las **flechas** van a la **semana anterior / semana siguiente**. Las semanas pasadas se abren en **modo solo lectura** — aparece el aviso "Viendo una semana pasada — solo lectura" y nada se puede editar ahí. Usa **"Volver a la semana actual"** para regresar a la semana editable.

### Barra de Progreso Semanal
Muestra "Progreso Semanal" con **X de Y ejercicios completados** y un porcentaje que se llena en tiempo real al marcar ejercicios. Al llegar al 100% celebra con "¡Semana Completa!".

### Tarjetas de días (Lunes–Domingo)
Cada día de la semana es una tarjeta plegable (acordeón) con el nombre del día, su fecha y sus grupos musculares (por ejemplo "Chest & Shoulders & Triceps"). Toca un día para expandirlo y ver sus ejercicios.

Dentro de un día:
- **Agregar Ejercicio** — abre el selector de ejercicios (ver más abajo).
- **Reiniciar Día** — restaura ese día al plan predeterminado tras una confirmación ("¿Estás seguro de que quieres reiniciar los ejercicios de este día?").
- **✏️ Cambiar grupo muscular** — permite elegir **hasta 3 grupos musculares** para ese día entre: Descanso (Rest), Pecho, Espalda, Hombros, Bíceps, Tríceps, Antebrazos, Piernas, Abdominales, Cardio, Combate. Elige "Rest" para convertirlo en día de descanso. Pulsa **Listo** para confirmar.
- Si un día no tiene ejercicios muestra "Sin ejercicios para hoy — ¡Agrega un ejercicio para comenzar!".

### Filas de ejercicios
Cada ejercicio dentro de un día muestra:
- **Asa de arrastre** — mantén presionado y arrastra para reordenar los ejercicios del día (funciona con el dedo en pantallas táctiles).
- **Botón ▶ de demostración** — abre **"Cómo hacer este ejercicio"**, una demostración visual del rango completo de movimiento, de inicio a fin. 122 de los 159 ejercicios integrados tienen demostración; los de Cardio, Combate y los personalizados muestran "Aún no hay demostración disponible".
- **Ejercicios de fuerza**: campos editables de **Series**, **Reps** (p. ej. "8-10"), **Peso** (lbs) y **Efectivas** — el número de series realmente completadas.
- **Ejercicios de Cardio/Combate**: **Duración** editable en minutos (1–120) y los minutos realmente completados. Sin campo de peso.
- **✓ Marcar como completado** — pone la fila en verde y suma al progreso semanal. Tócalo de nuevo para volver a incompleto.
- **✗ Marcar como omitido** — marca el ejercicio como saltado intencionalmente (rojo). Tócalo de nuevo para deshacer.
- **Editar / Eliminar** — edita los números del ejercicio o elimínalo (eliminar pide confirmación).

### Modal Agregar Ejercicio
Se abre con **"Agregar Ejercicio"** en cualquier día:
1. **Barra de búsqueda** ("Buscar ejercicios...") — escribe el nombre para filtrar al instante, con el texto coincidente resaltado. Importante: la búsqueda usa los nombres en **inglés** (busca "Squats", no "Sentadillas").
2. **Pestañas de filtro** — **Populares** (una lista corta seleccionada), **Todos**, o un grupo muscular específico.
3. **Valores por defecto** — antes de agregar, define **Series Objetivo (1–10)** y **Reps Objetivo (1–20)**. Los ejercicios de Cardio/Combate muestran en su lugar un selector de **Duración Objetivo (1–120 minutos)**.
4. **Pestaña Ejercicio Personalizado** — crea tu propio ejercicio: escribe nombre, series y reps, y pulsa **Agregar al Entrenamiento**. Los ejercicios personalizados no tienen imagen de demostración.

### Resumen Semanal (botón 📊)
El botón **📊 Resumen Semanal**, debajo de los días, abre un reporte de la semana actual:
- Totales: **Ejercicios totales, Completados, Series totales, Series hechas, Cardio (min), Cardio hecho (min)**.
- **Series por grupo muscular** — desglose por músculo de series planificadas vs hechas.
- **Detalle de la semana** — cada ejercicio por día con su estado (completado / incompleto / omitido).
- **Descargar CSV** — exporta el resumen como archivo CSV para Excel/Sheets.

### 🔄 Comenzar Nueva Semana
El botón **"Comenzar Nueva Semana"** archiva la semana actual y comienza una nueva. Un modal pide confirmación. Importante: la nueva semana **conserva todos tus ejercicios y pesos y solo reinicia el estado de completado** (arrastre de datos), para que puedas aplicar sobrecarga progresiva sin rearmar tu plan. La semana terminada queda visible (solo lectura) en el navegador de semanas.

### Comparte tu Opinión
Al final de la pantalla principal. Abre un formulario con **Nombre, Correo, Mensaje** — envía los comentarios directamente al desarrollador. Úsalo para reportar errores y sugerir funciones.

## Cuentas, sincronización y contraseñas

### Usar la app sin cuenta
Todo funciona sin iniciar sesión: el plan se guarda automáticamente en el almacenamiento local del dispositivo. Limitaciones: los datos quedan solo en ese dispositivo/navegador y pueden perderse si se borran los datos del navegador. En tu **primer inicio de sesión, los datos locales migran automáticamente a la nube**.

### Crear una cuenta (Registrarse)
1. En la pantalla de inicio de sesión elige **Registrarse**.
2. Escribe tu **nombre, correo y una contraseña de al menos 6 caracteres** (y confírmala).
3. Opcional: escribe un **Código de entrenador** si un entrenador personal te dio uno — esto vincula tu cuenta a ese entrenador. Déjalo vacío si entrenas por tu cuenta. Un código incorrecto muestra "Código de entrenador inválido".
4. Revisa tu correo — la app envía un **enlace de confirmación** que debes abrir para verificar la cuenta (pantalla "Revisa tu Correo").

### Iniciar y cerrar sesión
- **Iniciar Sesión** con correo y contraseña. Con la sesión iniciada, los entrenamientos se sincronizan en la nube y te siguen a cualquier dispositivo.
- **Cerrar Sesión** está en el menú de perfil del encabezado.

### Olvidé mi contraseña
1. En la pantalla de inicio de sesión toca **"¿Olvidaste tu contraseña?"**.
2. Escribe tu correo y toca **Enviar Enlace**.
3. Abre el enlace del correo — te lleva a la pantalla **Establecer Nueva Contraseña**, donde escribes y confirmas la nueva contraseña (mínimo 6 caracteres).

## Funciones para entrenadores

- Una cuenta de **entrenador** se crea mediante un enlace de invitación de un solo uso (emitido por un administrador).
- Los entrenadores tienen un **Panel de Entrenador** (botón 🏋️ en el encabezado) donde ven a sus **Clientes**, abren el plan semanal de cualquier cliente y lo construyen o ajustan (agregar/quitar ejercicios, cambiar series/reps, restablecer por defecto, guardar cambios).
- Cada entrenador tiene un **código de invitación** y un **enlace de invitación** con botones de Copiar. Los clientes que se registran con el código o enlace del entrenador quedan **asignados a ese entrenador automáticamente**.

## Funciones de administrador (para referencia)

Los administradores ven el 🛡️ **Panel de Administrador**: lista de todos los usuarios, gestión de roles (hacer admin / degradar, asignar entrenador), ver/editar el plan de cualquier usuario, restablecer un plan por defecto, eliminar los datos en la nube de un usuario y crear **invitaciones de entrenador** de un solo uso. El acceso se controla en el servidor; los usuarios normales no pueden entrar.

## El plan predeterminado (Push/Pull/Piernas)

La app viene precargada con este plan de 6 días. El domingo es descanso. Todo se puede cambiar.

**Lunes — Pecho, Hombros y Tríceps (Empuje):**
Barbell Bench Press (Press de Banca con Barra) 4×8-10 · Incline Dumbbell Press (Press Inclinado con Mancuernas) 3×10-12 · Military Press (Press Militar) 4×8-10 · Lateral Raises (Elevaciones Laterales) 3×12-15 · Rope Pushdowns (Extensión con Cuerda) 3×10-12

**Martes — Espalda y Bíceps (Jalón):**
Pull-ups (Dominadas) 3×8-12 · Seated Cable Rows (Remo Sentado en Polea) 4×10-12 · Barbell Curls (Curl con Barra) 4×10-12 · Hammer Curls (Curl Martillo) 3×12-15

**Miércoles — Piernas:**
Barbell Squats (Sentadillas con Barra) 4×8-10 · Romanian Deadlifts (Peso Muerto Rumano) 3×10-12 · Leg Press (Prensa de Piernas) 3×12-15 · Single-Leg Calf Raises (Elevaciones de Pantorrilla a Una Pierna) 4×15-20

**Jueves — Pecho, Hombros y Tríceps (Empuje):**
Cable Flyes (Aperturas en Polea) 3×12-15 · Dumbbell Press (Press con Mancuernas) 4×8-12 · Push-Ups (Flexiones) 3×12-15 · Overhead Press (Press sobre Cabeza) 3×8-10 · Lateral Raises (Elevaciones Laterales) 3×12-15 · Skull Crushers (Rompe Cráneos) 3×10-12 · Dips (Fondos) 3×8-12

**Viernes — Espalda y Bíceps (Jalón):**
Lat Pulldowns (Jalón al Pecho) 4×10-12 · Bent-Over Barbell Rows (Remo con Barra Inclinado) 3×8-10 · Single-Arm Dumbbell Rows (Remo con Mancuerna a Un Brazo) 3×10-12 · Face Pulls (Jalón a la Cara) 3×15-20 · Dumbbell Curls (Curl con Mancuernas) 4×10-12 · Preacher Curls (Curl en Banco Scott) 3×12-15 · Hammer Curls (Curl Martillo) 3×12-15

**Sábado — Piernas:**
Deadlifts (Peso Muerto) 4×6-8 · Front Squats (Sentadillas Frontales) 3×8-10 · Lunges (Zancadas) 3×12-15 · Leg Extensions (Extensiones de Cuádriceps) 3×15-20 · Lying Leg Curls (Curl Femoral Acostado) 3×12-15 · Standing Calf Raises (Elevaciones de Pantorrilla) 4×15-20 · Seated Calf Raises (Elevaciones de Pantorrilla Sentado) 3×15-20

**Domingo — Descanso.**

## Glosario de conceptos de entrenamiento (no médico)

- **Serie (Set)**: un grupo de repeticiones consecutivas. "4×8-10" significa 4 series de 8 a 10 reps.
- **Rep (repetición)**: un movimiento completo del ejercicio.
- **Series efectivas**: en esta app, las series que realmente completaste (frente al objetivo).
- **Peso**: la carga usada, en lbs (libras).
- **Push/Pull/Legs (PPL)**: una rutina que separa músculos de empuje (pecho, hombros, tríceps), de jalón (espalda, bíceps) y piernas en días distintos; aquí cada grupo se entrena dos veces por semana.
- **Sobrecarga progresiva**: aumentar gradualmente peso, reps o series a lo largo de las semanas. La app lo facilita al conservar tus números en cada nueva semana.
- **Día de descanso**: un día sin entrenar para que los músculos se recuperen — el domingo por defecto.
- **Ejercicio por tiempo**: los de Cardio y Combate se miden en minutos en lugar de series/reps.

## Recomendaciones generales de entrenamiento (no médicas)

- **Calienta primero**: 5–10 minutos de cardio suave más series de calentamiento ligeras del primer ejercicio.
- **Técnica antes que carga**: aprende el movimiento con poco peso; usa la demostración ▶ de la app como referencia visual.
- **Descanso entre series**: comúnmente ~1–2 minutos en ejercicios de aislamiento y ~2–3 minutos en levantamientos compuestos pesados.
- **Progresa gradualmente**: cuando llegues al tope de tu rango de reps en todas las series con buena técnica, sube ligeramente el peso la semana siguiente.
- **La constancia gana a la intensidad**: completar el plan de la semana con regularidad importa más que una sesión extrema. Usa la barra de progreso y el Resumen Semanal para mantenerte al día.
- **Escucha a tu cuerpo (genérico)**: dolor agudo, mareo o molestias inusuales significan detenerse; si persisten, consulta a un profesional calificado. El chatbot no puede evaluar síntomas.

## Preguntas frecuentes / Solución de problemas

**¿Necesito una cuenta?** No. Sin cuenta, los datos se guardan en tu dispositivo. Una cuenta agrega sincronización gratuita en la nube entre dispositivos.

**Mis entrenamientos no aparecen en mi otro dispositivo.** La sincronización requiere iniciar sesión con la misma cuenta en ambos dispositivos. Los datos creados sin sesión viven solo en ese dispositivo hasta que inicies sesión (entonces migran automáticamente).

**No puedo editar mi semana.** Probablemente estás viendo una semana pasada — son de solo lectura. Toca "Volver a la semana actual".

**¿"Comenzar Nueva Semana" borra mi plan?** No. Conserva tus ejercicios y pesos y solo reinicia el estado de completado. Las semanas pasadas siguen visibles en el navegador. ("Reiniciar Semana"/"Reiniciar Día" restauran el plan *predeterminado*; úsalos solo si quieres descartar tus personalizaciones.)

**Un ejercicio no tiene demostración.** 122 de 159 ejercicios tienen demo. Los de Cardio, Combate y los personalizados no — la app muestra "Aún no hay demostración disponible".

**¿Cómo cambio el idioma?** Toca el selector EN/ES en el encabezado. Toda la interfaz cambia al instante.

**¿Cómo busco en español?** La búsqueda usa los nombres en inglés. Aunque la interfaz esté en español, busca por el nombre en inglés (los documentos de la guía listan ambos nombres).

**¿Cómo instalo la app en mi teléfono?** Abre la app en el navegador del teléfono y elige "Agregar a pantalla de inicio" (iOS Safari: Compartir → Agregar a pantalla de inicio; Android Chrome: menú → Instalar app / Agregar a pantalla de inicio). Luego se abre como una app nativa y funciona sin conexión.

**Olvidé mi contraseña.** Usa "¿Olvidaste tu contraseña?" en la pantalla de inicio de sesión para recibir un enlace de restablecimiento por correo.

**No me llegó el correo de confirmación/restablecimiento.** Revisa la carpeta de spam. Verifica que el correo sea correcto; puedes reintentar desde la misma pantalla.

**¿Puedo registrar el peso en kg?** El campo de peso dice lbs, pero es un campo numérico libre — puedes escribir tu valor en kg de forma consistente si lo prefieres; la app no convierte unidades.

**¿Cómo reporto un error o sugiero una función?** Usa "Comparte tu Opinión" al final de la pantalla principal.

**¿Mis datos son privados?** Sí. Los datos en la nube se guardan por cuenta y están protegidos en el servidor (Row Level Security); solo tú — y tu entrenador o un administrador, si aplica — pueden acceder a tu plan.
