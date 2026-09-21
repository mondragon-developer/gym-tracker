# Gym Tracker — Guía de la App y Base de Conocimiento del Chatbot (Español)

## Acerca de la app

Gym Tracker es una app web gratuita - por ahora - y bilingüe (inglés/español) para planificar y registrar entrenamientos semanales. Está disponible en **gymworkoutjm.vercel.app**, funciona en cualquier teléfono, tableta o computadora, y puede instalarse en la pantalla de inicio del teléfono como una app nativa (es una Progressive Web App). Fue creada por Jose Mondragón.

Capacidades principales:
- Un plan **Push/Pull/Piernas de 6 días** precargado y totalmente personalizable.
- Una biblioteca de **181 ejercicios en 11 categorías** (Pecho, Espalda, Hombros, Bíceps, Tríceps, Antebrazos, Piernas, Abdominales, Cardio, Combate), más ejercicios personalizados que tú creas.
- Los **ejercicios de fuerza** registran series, reps y peso (lbs). Los de **Cardio y Combate** se miden por tiempo y registran minutos (1–120).
- **Demostraciones visuales**: 152 ejercicios tienen una demostración de inicio a fin que se abre con el botón ▶.
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
- **Selector de idioma (EN/ES)**: cambia toda la interfaz entre inglés y español al instante. Los nombres de los ejercicios en las listas se muestran en español cuando existe traducción, y la búsqueda encuentra tanto el nombre en inglés como en español, sin importar acentos.
- **Menú de perfil**: muestra la cuenta activa y contiene **Cerrar Sesión**. Si no has iniciado sesión, la app muestra primero la pantalla de inicio de sesión (ver Cuentas más abajo).
- **Botón 🛡️ Admin / 🏋️ Entrenador**: visible solo para administradores y entrenadores; abre su panel de gestión. Los usuarios normales no lo ven.

### Navegador de semanas
Justo debajo del encabezado:
- Muestra **"Semana del \<fecha\>"** — cada semana queda marcada con su rango de fechas real y cada día muestra su fecha de calendario.
- Las **flechas** van a la **semana anterior / semana siguiente**. Las semanas pasadas se abren en **modo solo lectura** — aparece el aviso "Viendo una semana pasada — solo lectura" y nada se puede editar ahí. Usa **"Volver a la semana actual"** para regresar a la semana actual.
- **Planificar por adelantado**: la flecha siguiente también avanza hasta **12 semanas** en el futuro, con la etiqueta "Planificando por adelantado". Una semana futura empieza como copia de tu último plan (ejercicios y pesos, nada completado) y se guarda en cuanto cambias algo en ella. Cuando llega ese lunes, la semana abre tal como la planificaste. Los entrenadores tienen las mismas flechas en su panel para planificar por adelantado a un cliente.

### Barra de Progreso Semanal
Muestra "Progreso Semanal" con **X de Y ejercicios completados** y un porcentaje que se llena en tiempo real al marcar ejercicios. Al llegar al 100% celebra con "¡Semana Completa!".

### Tarjetas de días (Lunes–Domingo)
Cada día de la semana es una tarjeta plegable (acordeón) con el nombre del día, su fecha y sus grupos musculares (por ejemplo "Chest & Shoulders & Triceps"). Un contador pequeño a la derecha muestra cuántos ejercicios del día están hechos (por ejemplo "2/5"). Toca un día para expandirlo y ver sus ejercicios; la página completa se desplaza, así que todos los ejercicios del día abierto quedan a la vista.

Dentro de un día:
- **Agregar Ejercicio** — abre el selector de ejercicios (ver más abajo). Está al final del día abierto, junto a **Reiniciar Día**.
- **Reiniciar Día** — restaura ese día al plan predeterminado de inmediato; un aviso al pie ofrece **Deshacer** durante unos segundos. Eliminar un ejercicio funciona igual: se va al momento, con Deshacer en el aviso.
- **✏️ Cambiar grupo muscular** — permite elegir **hasta 3 grupos musculares** para ese día entre: Descanso (Rest), Pecho, Espalda, Hombros, Bíceps, Tríceps, Antebrazos, Piernas, Abdominales, Cardio, Combate. Elige "Rest" para convertirlo en día de descanso. Pulsa **Listo** para confirmar.
- Si un día no tiene ejercicios muestra "Sin ejercicios para hoy — ¡Agrega un ejercicio para comenzar!".

### Filas de ejercicios
Cada ejercicio dentro de un día muestra:
- **Asa de arrastre** — mantén presionado y arrastra para reordenar los ejercicios del día (funciona con el dedo en pantallas táctiles).
- **Botón ▶ de demostración** — abre **"Cómo hacer este ejercicio"**, una demostración visual del rango completo de movimiento, de inicio a fin. 152 de los 181 ejercicios integrados tienen demostración; los de Cardio, Combate y los personalizados muestran "Aún no hay demostración disponible".
- **Ejercicios de fuerza**: campos editables de **Series**, **Reps** (p. ej. "8-10") y **Peso** (lbs) en una fila, con **Efectivas** (el número de series realmente completadas) y el botón **Registrar serie** debajo. Cada campo tiene botones - y + para cambiarlo con un solo dedo.
- **Ejercicios de Cardio/Combate**: **Duración** editable en minutos (1–120) y los minutos realmente completados. Sin campo de peso.
- **✓ Marcar como completado** — pone la tarjeta en verde y suma al progreso semanal. Tócalo de nuevo para volver a incompleto.
- **✗ Marcar como omitido** — marca el ejercicio como saltado intencionalmente (tarjeta roja). Tócalo de nuevo para deshacer.
- **Eliminar (icono de papelera)** — quita el ejercicio al momento; el aviso al pie ofrece Deshacer. Los números se editan directamente en los campos, no hay un botón de editar aparte.

### Modal Agregar Ejercicio
Se abre con **"Agregar Ejercicio"** en cualquier día:
1. **Barra de búsqueda** ("Buscar ejercicios...") — escribe el nombre para filtrar al instante, con el texto coincidente resaltado. La búsqueda encuentra el nombre en **inglés o en español** ("Squats" y "Sentadillas" encuentran Barbell Squats), sin importar acentos ni mayúsculas.
2. **Filtros** — un desplegable de **grupo muscular** (preseleccionado según el día) y un desplegable de **equipo** (barra, mancuerna, cable, máquinas, peso corporal, ...). Ambos se combinan con la búsqueda.
3. **Valores por defecto** — antes de agregar, define **Series Objetivo (1–10)** y **Reps Objetivo (1–20)**. Los ejercicios de Cardio/Combate muestran en su lugar un selector de **Duración Objetivo (1–120 minutos)**.
4. **Pestaña Ejercicio Personalizado** — crea tu propio ejercicio: escribe nombre, series y reps, y pulsa **Agregar al Entrenamiento**. Los ejercicios personalizados no tienen imagen de demostración.

### Resumen Semanal (botón 📊)
El botón **📊 Resumen Semanal**, debajo de los días, abre un reporte de la semana actual:
- Totales: **Ejercicios totales, Completados, Series totales, Series hechas, Cardio (min), Cardio hecho (min)**.
- **Series por grupo muscular** — desglose por músculo de series planificadas vs hechas.
- **Detalle de la semana** — cada ejercicio por día con su estado (completado / incompleto / omitido).
- **Descargar CSV** — exporta el resumen como archivo CSV para Excel/Sheets.

### Temporizador de descanso (⏱️)
Debajo de la barra de progreso semanal. Elige un preset (**0:30 / 1:00 / 1:30 / 2:00**) y pulsa **Iniciar**; hay **Pausar**/**Reanudar** y **Reiniciar**. Al terminar, toda la pantalla parpadea en rojo con un mensaje grande ("¡Vamos!" por defecto) y el teléfono vibra; la pantalla sigue parpadeando hasta que la tocas (o pulsas Enter o Escape). También suena una señal corta cuando el teléfono lo permite. El botón **Mensaje** junto al temporizador permite escribir tu propio texto de fin de descanso, que se recuerda en ese dispositivo. Sigue corriendo aunque abras o cierres días.

### 🔄 Semanas y Reiniciar Esta Semana
Las semanas son semanas de calendario, de lunes a domingo, y avanzan solas: cada lunes la app abre en la semana nueva **conservando todos tus ejercicios y pesos y reiniciando solo el estado de completado**, para que puedas aplicar sobrecarga progresiva sin rearmar tu plan. La semana terminada queda archivada y visible (solo lectura) en el navegador de semanas. El botón **"Reiniciar Esta Semana"** borra el progreso y las series registradas solo de la semana actual, conservando ejercicios y pesos; se aplica de inmediato y un aviso ofrece **Deshacer** durante unos segundos.

### Plantillas de entrenamiento y Copiar la semana pasada
Debajo de la lista de días, en la semana actual o en una futura:
- **Plantillas de entrenamiento** abre un selector con cinco semanas listas: **Clásico Push / Pull / Piernas** (6 días, unos 45-60 min), **Tren superior / inferior con recuperación activa** (tren superior lunes y jueves, tren inferior martes y viernes, cardio suave y core el miércoles, unos 45-60 min), **Cuerpo completo 3 días (agenda ocupada)** (lunes, miércoles y viernes, cinco ejercicios, unos 30-40 min), **En casa, sin equipo** (lunes, miércoles y viernes solo con el suelo, una pared y una silla, unos 30 min) y **Solo mancuernas** (4 días torso/pierna con un par de mancuernas, unos 40-50 min). "Usar este plan" pide un toque de confirmación ("¿Reemplazar esta semana?") y luego reemplaza los ejercicios de la semana que estás viendo; se borran el progreso, las series registradas y los pesos.
- **Copiar la semana pasada** reemplaza la semana que ves con los ejercicios, el orden, los pesos y los días ocultos de la semana anterior, con el progreso en cero. Una confirmación indica qué semana se copia.
- Los entrenadores tienen ambas acciones en su panel para el cliente seleccionado.

### Ver la demostración antes de agregar un ejercicio
En el selector de Agregar Ejercicio, los ejercicios con demostración o instrucciones muestran un botón **▶** a la derecha de la fila. Abre "Cómo hacer este ejercicio" sobre el selector para revisar el movimiento primero; la fila sigue agregando el ejercicio.

### Registrar series y el temporizador a la vez
Cada ejercicio de fuerza tiene un botón **Registrar serie** que muestra el avance, por ejemplo "Registrar serie 2/4". Cada toque cuenta una serie, arranca el temporizador de descanso con el preajuste elegido y, en la última serie, marca el ejercicio como completado. Escribir el número de Efectivas a mano sigue funcionando.

### Números de la semana pasada y sobrecarga progresiva
Cuando el mismo ejercicio existía la semana pasada, una línea pequeña bajo los campos dice **Semana pasada: 135 lbs × 8-10 · 4/4 series**. Al lado, un botón **+5 lbs** (o **+2.5 kg**) pone el peso de esta semana en el de la semana pasada más un incremento.

### Notas del día
Cada día abierto tiene un cuadro de **Notas** arriba. Si el día aún no tiene nota, solo aparece un enlace pequeño **+ Añadir nota**; tócalo para abrir el cuadro. Las notas se comparten a través del plan: lo que escriba el cliente o cualquiera de sus entrenadores lo ven los demás, y la nota pasa a las semanas siguientes hasta que se cambie. Las semanas pasadas muestran la nota en solo lectura, y solo cuando existe.

### Elección de plan al empezar
Una cuenta nueva sin plan en ningún lado ve **"¡Bienvenido! ¿Cuántos días a la semana puedes entrenar?"** con las tres plantillas. Elegir una la aplica; **Conservar el plan por defecto** mantiene Push/Pull/Piernas. Aparece una sola vez por cuenta; Plantillas de entrenamiento debajo de los días vuelve a mostrar la lista cuando quieras.

### Unidades de peso
El selector **lbs / kg** del encabezado convierte de verdad: los pesos se guardan en libras, se muestran y se escriben en la unidad elegida, y el Resumen Semanal y su CSV usan la misma unidad. Un texto como "BW" se deja tal cual.

### Plan cambiado en otro lado
Cuando la app vuelve al frente y encuentra una copia más nueva en la nube (otro dispositivo o un entrenador), la carga y muestra "El plan se actualizó desde otro dispositivo o por tu entrenador. Se muestra la versión más reciente." Si tenías cambios sin guardar en ese momento, la barra de guardado ofrece Cargar la última versión / Conservar la mía.

### Ocultar días de descanso
Un día marcado como Descanso, o sin ejercicios, muestra el botón **"Ocultar este día"** dentro de su panel. Los días ocultos salen de la lista y aparecen en una fila pequeña de "Días ocultos" al final, cada uno con un enlace **Mostrar** para recuperarlo. La elección se conserva en las semanas siguientes, y el entrenador ve la misma disposición para ese cliente.

### Comparte tu Opinión
Al final de la pantalla principal. Abre un formulario con **Nombre, Correo, Mensaje** — envía los comentarios directamente al desarrollador. Úsalo para reportar errores y sugerir funciones.

## Cuentas, sincronización y contraseñas

### Usar la app sin cuenta
Todo funciona sin iniciar sesión: el plan se guarda automáticamente en el almacenamiento local del dispositivo. Limitaciones: los datos quedan solo en ese dispositivo/navegador y pueden perderse si se borran los datos del navegador. En tu **primer inicio de sesión, los datos locales migran automáticamente a la nube**.

### Crear una cuenta (Registrarse)
1. En la pantalla de inicio de sesión elige **Registrarse**.
2. Escribe tu **nombre, correo y una contraseña de al menos 6 caracteres** (y confírmala).
3. Opcional: escribe un **Código de entrenador** si un entrenador personal te dio uno — esto vincula tu cuenta a ese entrenador. Déjalo vacío si entrenas por tu cuenta. Un código incorrecto muestra "Código de entrenador inválido".
4. Revisa tu correo — la app envía un **enlace de confirmación** que debes abrir para verificar la cuenta (pantalla "Revisa tu Correo"). Si no llega, usa **Reenviar correo de confirmación** en esa pantalla (o tras un error de "correo no confirmado" al iniciar sesión).

### Iniciar y cerrar sesión
- **Iniciar Sesión** con correo y contraseña. Con la sesión iniciada, los entrenamientos se sincronizan en la nube y te siguen a cualquier dispositivo.
- **Iniciar sesión con Google** (Continuar con Google) es la alternativa de un toque, sin contraseña; el primer uso crea la cuenta. Un código de entrenador también se puede agregar después: abre el menú de tu perfil, escribe el código en "Código de entrenador" y pulsa Conectar, o abre el enlace de invitación del entrenador con la sesión iniciada. Puedes estar conectado con varios entrenadores a la vez.
- **Cerrar Sesión** está en el menú de perfil del encabezado.

### Olvidé mi contraseña
1. En la pantalla de inicio de sesión toca **"¿Olvidaste tu contraseña?"**.
2. Escribe tu correo y toca **Enviar Enlace**.
3. Abre el enlace del correo — te lleva a la pantalla **Establecer Nueva Contraseña**, donde escribes y confirmas la nueva contraseña (mínimo 6 caracteres).

## Funciones para entrenadores

- Una cuenta de **entrenador** se crea mediante un enlace de invitación de un solo uso (emitido por un administrador).
- Los entrenadores tienen un **Panel de Entrenador** (botón 🏋️ en el encabezado) donde ven a sus **Clientes**, abren el plan semanal de cualquier cliente y lo construyen o ajustan (agregar/quitar ejercicios, cambiar series/reps, restablecer por defecto, guardar cambios).
- Cada entrenador tiene un **código de invitación** y un **enlace de invitación** con botones de Copiar. Los clientes que se registran con el código o enlace del entrenador quedan **asignados a ese entrenador automáticamente**.
- El entrenador también puede **enviar la invitación por correo** desde el panel: escribe el correo del cliente en el campo de invitación por correo y el cliente recibe un email bilingüe con un botón que abre el registro con el código ya cargado.

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

**¿Tengo que comenzar la nueva semana yo mismo?** No. Cada lunes comienza una semana nueva automáticamente con tus ejercicios y pesos conservados y el progreso reiniciado. "Reiniciar Esta Semana" solo borra el progreso de la semana actual. Las semanas pasadas siguen visibles en el navegador. ("Reiniciar Día" restaura los ejercicios *predeterminados* de ese día; úsalo solo si quieres descartar tus personalizaciones de ese día.)

**Un ejercicio no tiene demostración.** 152 de 181 ejercicios tienen demo. Los de Cardio, Combate y los personalizados no — la app muestra "Aún no hay demostración disponible".

**¿Cómo cambio el idioma?** Toca el selector EN/ES en el encabezado. Toda la interfaz cambia al instante.

**¿Cómo busco en español?** La búsqueda usa los nombres en inglés. Aunque la interfaz esté en español, busca por el nombre en inglés (los documentos de la guía listan ambos nombres).

**¿Cómo instalo la app en mi teléfono?** Abre la app en el navegador del teléfono y elige "Agregar a pantalla de inicio" (iOS Safari: Compartir → Agregar a pantalla de inicio; Android Chrome: menú → Instalar app / Agregar a pantalla de inicio). Luego se abre como una app nativa y funciona sin conexión.

**Olvidé mi contraseña.** Usa "¿Olvidaste tu contraseña?" en la pantalla de inicio de sesión para recibir un enlace de restablecimiento por correo.

**No me llegó el correo de confirmación/restablecimiento.** Revisa la carpeta de spam. Verifica que el correo sea correcto; puedes reintentar desde la misma pantalla.

**¿Puedo registrar el peso en kg?** Sí. Cambia el selector **lbs / kg** del encabezado: los pesos se guardan en libras y se muestran, escriben y exportan en la unidad que elijas, con conversión real.

**¿Cómo reporto un error o sugiero una función?** Usa "Comparte tu Opinión" al final de la pantalla principal.

**¿Puedo tener más de un entrenador?** Sí. Cada entrenador con el que te conectes (por código, enlace de invitación o asignación del administrador) puede ver y editar tu plan. Lo que guarde el último, tú o cualquiera de tus entrenadores, es lo que la app conserva. Si un entrenador guardó mientras tenías cambios sin guardar, la barra de guardado te deja elegir Cargar la última versión o Conservar la mía.

**¿Mis datos son privados?** Sí. Los datos en la nube se guardan por cuenta y están protegidos en el servidor (Row Level Security); solo tú — y tus entrenadores o un administrador, si aplica — pueden acceder a tu plan.
