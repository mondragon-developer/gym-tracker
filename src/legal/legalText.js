/**
 * Terms of Use, Privacy Policy and the consent screen summary, in English
 * and Spanish. Bump LEGAL_VERSION (version.js) when the meaning changes.
 *
 * English and Spanish must say the same thing section by section;
 * legalText.test.js checks that the structure matches.
 */

import { LEGAL_VERSION } from './version.js';

// The person or company that answers for the app. When the company is
// registered, put its exact legal name here and bump LEGAL_VERSION so
// everyone accepts the terms with the new operator.
export const OPERATOR = {
    name: 'Jose Mondragon',
    email: 'legal@mdragonsolutions.com',
    site: 'gym.mdragonsolutions.com',
    state: 'Florida'
};

export const LEGAL_DOCS = ['terms', 'privacy'];

const { name, email, site, state } = OPERATOR;

const terms = {
    en: {
        title: 'Terms of Use',
        updated: `Version ${LEGAL_VERSION}`,
        sections: [
            {
                heading: '1. About these terms',
                paragraphs: [
                    `Gym Tracker (the "app"), available at ${site}, is operated by ${name} ("we", "us"). By checking the boxes on the consent screen and using the app you agree to these Terms of Use and to the Privacy Policy. If you do not agree, do not use the app.`
                ]
            },
            {
                heading: '2. Who can use the app',
                paragraphs: [
                    'You must be at least 18 years old, or the age of majority where you live if it is higher. By using the app you confirm that you are.'
                ]
            },
            {
                heading: '3. What the app is, and what it is not',
                paragraphs: [
                    'The app is a tool to plan and record workouts. It is not a personal trainer, a coach, a doctor, a physical therapist, a nutritionist or any other professional, and it does not replace one.',
                    'Nothing in the app is medical advice, a diagnosis, a treatment or a training program designed for you. That includes exercise names, demonstrations, instructions, templates, default sets and repetitions, health and nutrition tips, progress charts and anything the AI assistant says. All of it is general information.'
                ]
            },
            {
                heading: '4. Talk to a doctor first',
                paragraphs: [
                    'Ask a doctor or another qualified health professional before you start or change an exercise program, above all if you have or have had an injury, a surgery, or a heart, blood pressure, breathing, joint or other health condition, if you are pregnant or recently gave birth, if you take medication, or if you have been inactive for a long time.',
                    'If you have an injury or a health condition, do not do an exercise unless a professional who knows your case has told you it is safe for you. Never ignore or delay professional advice because of something you saw in the app.',
                    'Stop exercising and get medical help right away if you feel chest pain or pressure, trouble breathing, dizziness, fainting, an irregular heartbeat, a sudden strong headache, or sharp or unusual pain. In an emergency call your local emergency number. The app cannot call for help and nobody monitors what you enter.'
                ]
            },
            {
                heading: '5. You train at your own risk',
                paragraphs: [
                    'Exercise carries real risks, including muscle and joint injuries, falls, accidents with equipment, the worsening of existing conditions, heart events and, in rare cases, death.',
                    'You choose which exercises to do, how much weight to use, your technique, your equipment and where you train. You take part voluntarily and you accept those risks. You are responsible for training within your limits, for using equipment in good condition and for asking for supervision when you need it.'
                ]
            },
            {
                heading: '6. The AI assistant',
                paragraphs: [
                    'The chat assistant is an automated program that runs on third-party artificial intelligence. Its answers can be wrong, incomplete or not right for you. It is not a professional of any kind, and no person reviews its answers before you see them.',
                    'Treat what it says, and any plan it writes, as general information that you review before using. Do not use it in an emergency or for pain, injuries or health conditions, and do not type medical details or other sensitive information into it.'
                ]
            },
            {
                heading: '7. Trainers and plans from other people',
                paragraphs: [
                    'Some accounts belong to trainers, who can see and edit the plans of the clients linked to them. Trainers are independent. They are not our employees, agents or partners. We do not check their identity, qualifications, licenses or insurance, and we do not review what they prescribe. The relationship between a trainer and a client belongs to the two of them alone.',
                    'A plan that you import, paste or receive from a trainer, a template or the assistant is yours to judge before you follow it.',
                    'If you are a trainer, you alone are responsible for your advice and the plans you create, for holding any qualification, license or insurance that your activity requires, and for having your clients\' permission to handle their information.'
                ]
            },
            {
                heading: '8. Your account and acceptable use',
                paragraphs: [
                    'Keep your sign-in details private and tell us if you think someone else has used your account. Do not use the app to break the law, try to reach other people\'s data, disrupt the service, or copy or resell it. We may suspend or close an account that breaks these terms.'
                ]
            },
            {
                heading: '9. Your content',
                paragraphs: [
                    'Your workouts, notes and custom exercises are yours. You allow us to store and process them to run the app and to show them to the trainers you link to. You can download a backup or delete your account at any time from the profile menu.'
                ]
            },
            {
                heading: '10. Availability and changes',
                paragraphs: [
                    'The app is free for now. If paid plans are added, you will be told before anything is charged. We may change, interrupt or discontinue the app or any feature. Data can be lost because of errors or failures, so keep your own backups.'
                ]
            },
            {
                heading: '11. No warranties',
                paragraphs: [
                    'To the fullest extent the law allows, the app is provided "as is" and "as available", without warranties of any kind, express or implied, including fitness for a particular purpose, accuracy, and uninterrupted or error-free operation. We do not promise any fitness, health or performance result.'
                ]
            },
            {
                heading: '12. Limit of liability',
                paragraphs: [
                    'To the fullest extent the law allows, we and those who help us provide the app are not liable for any injury, illness, death, loss or damage connected to your use of the app, to the exercise you do, to information shown in the app or given by the assistant, or to what trainers or other users do. We are also not liable for indirect, incidental, special, consequential or punitive damages, or for lost data.',
                    'If we are found liable in spite of the above, our total liability is limited to the greater of the amount you paid us in the 12 months before the claim or 50 US dollars.',
                    'Some countries and states do not allow certain exclusions or limits, in particular for consumers or in cases of gross negligence or intentional harm. Where that is so, these limits apply only as far as your local law allows, and nothing in these terms takes away rights that the law says you cannot give up.'
                ]
            },
            {
                heading: '13. Release and indemnity',
                paragraphs: [
                    'As far as the law allows, you release us from claims that arise from the risks you accepted in section 5. You agree to cover our losses and costs from claims by other people caused by your misuse of the app, by your breach of these terms or, if you are a trainer, by the services you give your clients.'
                ]
            },
            {
                heading: '14. Changes to these terms',
                paragraphs: [
                    'We may update these terms. The version date is shown at the top. When the meaning changes, the app asks you to accept the new version before you continue.'
                ]
            },
            {
                heading: '15. Governing law and disputes',
                paragraphs: [
                    `These terms are governed by the laws of the State of ${state}, United States, without regard to its conflict-of-law rules. Please contact us first so we can try to solve any problem directly. If that fails, disputes go to the courts located in ${state}, and you and we accept their jurisdiction.`,
                    'If you are a consumer living outside the United States, you keep the mandatory protections of the law of your country, including any right to bring a claim there.'
                ]
            },
            {
                heading: '16. Language',
                paragraphs: [
                    'These terms are available in English and Spanish. If the two differ, the English version applies, unless the law of your country requires the version in your language to apply.'
                ]
            },
            {
                heading: '17. General',
                paragraphs: [
                    'If a part of these terms is found invalid, the rest stays in force. Not enforcing a right does not mean giving it up. These terms and the Privacy Policy are the whole agreement between you and us about the app. We may transfer these terms to a company that takes over the app; your rights stay the same.'
                ]
            },
            {
                heading: '18. Contact',
                paragraphs: [
                    `Questions about these terms: ${email}.`
                ]
            }
        ]
    },
    es: {
        title: 'Términos de Uso',
        updated: `Versión ${LEGAL_VERSION}`,
        sections: [
            {
                heading: '1. Sobre estos términos',
                paragraphs: [
                    `Gym Tracker (la "aplicación"), disponible en ${site}, es operada por ${name} ("nosotros"). Al marcar las casillas de la pantalla de consentimiento y usar la aplicación aceptas estos Términos de Uso y la Política de Privacidad. Si no estás de acuerdo, no uses la aplicación.`
                ]
            },
            {
                heading: '2. Quién puede usar la aplicación',
                paragraphs: [
                    'Debes tener al menos 18 años, o la mayoría de edad del lugar donde vives si es mayor. Al usar la aplicación confirmas que la tienes.'
                ]
            },
            {
                heading: '3. Qué es la aplicación y qué no es',
                paragraphs: [
                    'La aplicación es una herramienta para planear y registrar entrenamientos. No es un entrenador personal, un coach, un médico, un fisioterapeuta, un nutricionista ni ningún otro profesional, y no reemplaza a ninguno.',
                    'Nada en la aplicación es consejo médico, diagnóstico, tratamiento ni un programa de entrenamiento diseñado para ti. Esto incluye los nombres de ejercicios, las demostraciones, las instrucciones, las plantillas, las series y repeticiones por defecto, los consejos de salud y nutrición, las gráficas de progreso y todo lo que diga el asistente de IA. Todo es información general.'
                ]
            },
            {
                heading: '4. Consulta primero a un médico',
                paragraphs: [
                    'Consulta a un médico u otro profesional de la salud calificado antes de empezar o cambiar un programa de ejercicio, sobre todo si tienes o has tenido una lesión, una cirugía, o una condición del corazón, de presión arterial, respiratoria, articular o de otro tipo, si estás embarazada o diste a luz hace poco, si tomas medicamentos o si llevas mucho tiempo sin actividad física.',
                    'Si tienes una lesión o una condición de salud, no hagas un ejercicio a menos que un profesional que conozca tu caso te haya dicho que es seguro para ti. Nunca ignores ni retrases el consejo de un profesional por algo que viste en la aplicación.',
                    'Deja de hacer ejercicio y busca atención médica de inmediato si sientes dolor o presión en el pecho, dificultad para respirar, mareo, desmayo, latidos irregulares, un dolor de cabeza fuerte y repentino, o un dolor agudo o inusual. En una emergencia llama al número de emergencias de tu localidad. La aplicación no puede pedir ayuda y nadie vigila lo que escribes.'
                ]
            },
            {
                heading: '5. Entrenas bajo tu propio riesgo',
                paragraphs: [
                    'El ejercicio tiene riesgos reales, entre ellos lesiones musculares y articulares, caídas, accidentes con el equipo, el empeoramiento de condiciones existentes, eventos cardíacos y, en casos raros, la muerte.',
                    'Tú eliges qué ejercicios hacer, cuánto peso usar, tu técnica, tu equipo y dónde entrenas. Participas de forma voluntaria y aceptas esos riesgos. Eres responsable de entrenar dentro de tus límites, de usar equipo en buen estado y de pedir supervisión cuando la necesites.'
                ]
            },
            {
                heading: '6. El asistente de IA',
                paragraphs: [
                    'El asistente del chat es un programa automático que funciona con inteligencia artificial de terceros. Sus respuestas pueden ser incorrectas, incompletas o no adecuadas para ti. No es un profesional de ningún tipo, y ninguna persona revisa sus respuestas antes de que las veas.',
                    'Toma lo que diga, y cualquier plan que escriba, como información general que revisas antes de usar. No lo uses en una emergencia ni para dolor, lesiones o condiciones de salud, y no escribas en él datos médicos ni otra información sensible.'
                ]
            },
            {
                heading: '7. Entrenadores y planes de otras personas',
                paragraphs: [
                    'Algunas cuentas son de entrenadores, que pueden ver y editar los planes de los clientes vinculados a ellos. Los entrenadores son independientes. No son nuestros empleados, agentes ni socios. No verificamos su identidad, sus títulos, licencias o seguros, y no revisamos lo que indican. La relación entre un entrenador y un cliente es solo de ellos dos.',
                    'Un plan que importas, pegas o recibes de un entrenador, de una plantilla o del asistente queda a tu criterio antes de seguirlo.',
                    'Si eres entrenador, solo tú eres responsable de tus consejos y de los planes que creas, de tener los títulos, licencias o seguros que tu actividad exija, y de contar con el permiso de tus clientes para manejar su información.'
                ]
            },
            {
                heading: '8. Tu cuenta y el uso permitido',
                paragraphs: [
                    'Mantén en privado tus datos de acceso y avísanos si crees que otra persona usó tu cuenta. No uses la aplicación para violar la ley, intentar acceder a datos de otras personas, afectar el servicio, ni copiarla o revenderla. Podemos suspender o cerrar una cuenta que incumpla estos términos.'
                ]
            },
            {
                heading: '9. Tu contenido',
                paragraphs: [
                    'Tus entrenamientos, notas y ejercicios personalizados son tuyos. Nos permites guardarlos y procesarlos para hacer funcionar la aplicación y mostrarlos a los entrenadores a los que te vincules. Puedes descargar una copia de seguridad o eliminar tu cuenta en cualquier momento desde el menú de perfil.'
                ]
            },
            {
                heading: '10. Disponibilidad y cambios',
                paragraphs: [
                    'La aplicación es gratis por ahora. Si se agregan planes de pago, se te avisará antes de cobrar algo. Podemos cambiar, interrumpir o descontinuar la aplicación o cualquier función. Los datos pueden perderse por errores o fallas, así que guarda tus propias copias de seguridad.'
                ]
            },
            {
                heading: '11. Sin garantías',
                paragraphs: [
                    'En la máxima medida que permita la ley, la aplicación se ofrece "tal cual" y "según disponibilidad", sin garantías de ningún tipo, expresas o implícitas, incluidas las de idoneidad para un fin particular, exactitud y funcionamiento sin interrupciones o sin errores. No prometemos ningún resultado físico, de salud o de rendimiento.'
                ]
            },
            {
                heading: '12. Límite de responsabilidad',
                paragraphs: [
                    'En la máxima medida que permita la ley, nosotros y quienes nos ayudan a ofrecer la aplicación no somos responsables por ninguna lesión, enfermedad, muerte, pérdida o daño relacionado con tu uso de la aplicación, con el ejercicio que hagas, con la información que muestra la aplicación o que da el asistente, ni con lo que hagan los entrenadores u otros usuarios. Tampoco somos responsables por daños indirectos, incidentales, especiales, consecuentes o punitivos, ni por la pérdida de datos.',
                    'Si a pesar de lo anterior se nos declara responsables, nuestra responsabilidad total se limita al mayor de estos dos valores: lo que nos hayas pagado en los 12 meses anteriores al reclamo o 50 dólares de los Estados Unidos.',
                    'Algunos países y estados no permiten ciertas exclusiones o límites, en especial para consumidores o en casos de culpa grave o dolo. En ese caso estos límites se aplican solo hasta donde lo permita tu ley local, y nada en estos términos te quita derechos que la ley declara irrenunciables.'
                ]
            },
            {
                heading: '13. Liberación e indemnidad',
                paragraphs: [
                    'Hasta donde la ley lo permita, nos liberas de los reclamos que surjan de los riesgos que aceptaste en la sección 5. Aceptas cubrir nuestras pérdidas y costos por reclamos de otras personas causados por tu mal uso de la aplicación, por tu incumplimiento de estos términos o, si eres entrenador, por los servicios que prestas a tus clientes.'
                ]
            },
            {
                heading: '14. Cambios en estos términos',
                paragraphs: [
                    'Podemos actualizar estos términos. La fecha de la versión aparece al inicio. Cuando cambie su sentido, la aplicación te pedirá aceptar la nueva versión antes de continuar.'
                ]
            },
            {
                heading: '15. Ley aplicable y disputas',
                paragraphs: [
                    `Estos términos se rigen por las leyes del Estado de ${state}, Estados Unidos, sin aplicar sus normas sobre conflicto de leyes. Escríbenos primero para intentar resolver cualquier problema directamente. Si eso no funciona, las disputas se llevan ante los tribunales ubicados en ${state}, y tú y nosotros aceptamos su jurisdicción.`,
                    'Si eres un consumidor que vive fuera de los Estados Unidos, conservas las protecciones obligatorias de la ley de tu país, incluido cualquier derecho a presentar allí un reclamo.'
                ]
            },
            {
                heading: '16. Idioma',
                paragraphs: [
                    'Estos términos están disponibles en inglés y en español. Si hay diferencias, se aplica la versión en inglés, salvo que la ley de tu país exija que se aplique la versión en tu idioma.'
                ]
            },
            {
                heading: '17. Generales',
                paragraphs: [
                    'Si una parte de estos términos se declara inválida, el resto sigue vigente. No ejercer un derecho no significa renunciar a él. Estos términos y la Política de Privacidad son el acuerdo completo entre tú y nosotros sobre la aplicación. Podemos ceder estos términos a una empresa que asuma la aplicación; tus derechos siguen siendo los mismos.'
                ]
            },
            {
                heading: '18. Contacto',
                paragraphs: [
                    `Preguntas sobre estos términos: ${email}.`
                ]
            }
        ]
    }
};

const privacy = {
    en: {
        title: 'Privacy Policy',
        updated: `Version ${LEGAL_VERSION}`,
        sections: [
            {
                heading: '1. Who is responsible',
                paragraphs: [
                    `${name} operates Gym Tracker and is responsible for the personal information described here. Contact: ${email}.`
                ]
            },
            {
                heading: '2. Information we handle',
                paragraphs: [
                    'Account: your email address, your name if you give one, and your password, which the sign-in provider stores only as a one-way hash that cannot be read back, so we never see it. If you sign in with Google, we receive your name and email address from Google.',
                    'Workouts: your weekly plans, exercises, sets, repetitions, weights, what you marked as done, notes, custom exercises and settings such as language, units and theme.',
                    'Trainers: which trainers you are linked to, invite codes, and the email address a trainer invitation is sent to.',
                    'Activity: when you last signed in and last opened the app, and the record of when you accepted these documents, in which version and language.',
                    'Notifications: if you turn on the rest timer notification, the address your browser gives us to deliver it. It is deleted when the notification is sent; if the timer is cancelled, it is removed in a later cleanup.',
                    'Feedback: the name, email address and message you write in the feedback form.',
                    'Assistant: what you type in the chat and the answers it gives. We can read these conversations to improve the assistant. They are not linked to your account by us, but they may identify you if you write personal details.',
                    'On your device: the app saves settings, timers and a copy of your plan in the browser storage. It does not use advertising cookies or tracking tools.'
                ]
            },
            {
                heading: '3. Information about your health',
                paragraphs: [
                    'A workout log can say something about your physical condition. We do not ask for medical information, the app works without it, and you are never required to provide it. Please do not write diagnoses, medication or other medical details in notes or in the chat. By accepting this policy you expressly authorize us to handle the workout information you choose to enter.'
                ]
            },
            {
                heading: '4. What we use it for',
                paragraphs: [
                    'To run the app and keep your data in sync across your devices, to let the trainers you link to see and edit your plan, to send account emails (confirmation, password reset, invitations), to keep the service secure, to fix problems and to improve the app. We do not sell your information, we do not show advertising and we do not use your information for marketing profiles.'
                ]
            },
            {
                heading: '5. Who receives it',
                paragraphs: [
                    'Service providers that work for us: Supabase (database, sign-in and server functions), Vercel (hosting), Google (only if you sign in with Google), Chatbase and the AI model provider it uses (the assistant), EmailJS (feedback form), Brevo (invitation emails), and the notification service of your browser maker, such as Apple, Google or Mozilla (rest timer notification).',
                    'The trainers you link to can see and edit your plan. The administrators of the app can see accounts and plans to give support and maintain the service.',
                    'We may also share information when the law requires it, or with a company that takes over the app, under this same policy.'
                ]
            },
            {
                heading: '6. Where it is stored',
                paragraphs: [
                    'Our providers store and process information in the United States and other countries, which may not be the country where you live. By accepting this policy you authorize that transfer.'
                ]
            },
            {
                heading: '7. How long we keep it',
                paragraphs: [
                    'We keep your information while your account exists. Deleting your account from the profile menu removes from our servers your sign-in, your workouts, your custom exercises, your settings, your trainer links and your acceptance record. Settings and other data saved in your browser stay on that device until you clear the site data. Copies in provider backups can remain for a short time. Chat conversations and feedback messages are stored separately; write to us if you want them deleted.'
                ]
            },
            {
                heading: '8. Your rights',
                paragraphs: [
                    'You can see, correct and update your information in the app, download a copy from the profile menu (Back up my data), and delete your account there, which also withdraws your consent. For anything else, write to us.',
                    'Colombia: under Law 1581 of 2012 you have the right to know, update, rectify and delete your data, to ask for proof of your authorization, to revoke it, and to be told how your data has been used. We answer queries within 10 business days and claims within 15 business days. If you are not satisfied with our answer, you can complain to the Superintendencia de Industria y Comercio.',
                    'European Union and United Kingdom: we handle your information based on your consent and on providing the service you asked for. You have the rights of access, rectification, erasure, restriction, portability and objection, and you can complain to your data protection authority.',
                    'California and other US states: we do not sell or share your personal information for advertising. You can ask to know, correct or delete it.'
                ]
            },
            {
                heading: '9. Security',
                paragraphs: [
                    'Information travels encrypted, and database rules limit each account to its own data, plus the trainers linked to it and the administrators. No system is completely secure, so we cannot guarantee absolute security.'
                ]
            },
            {
                heading: '10. Children',
                paragraphs: [
                    'The app is for adults. We do not knowingly collect information from anyone under 18. If you believe a minor has created an account, write to us and we will delete it.'
                ]
            },
            {
                heading: '11. Changes',
                paragraphs: [
                    'We may update this policy. When the meaning changes, the app asks you to accept the new version before you continue.'
                ]
            },
            {
                heading: '12. Contact',
                paragraphs: [
                    `Privacy questions and requests: ${email}.`
                ]
            }
        ]
    },
    es: {
        title: 'Política de Privacidad',
        updated: `Versión ${LEGAL_VERSION}`,
        sections: [
            {
                heading: '1. Quién es el responsable',
                paragraphs: [
                    `${name} opera Gym Tracker y es el responsable del tratamiento de la información personal descrita aquí. Contacto: ${email}.`
                ]
            },
            {
                heading: '2. Información que manejamos',
                paragraphs: [
                    'Cuenta: tu correo electrónico, tu nombre si lo das, y tu contraseña, que el proveedor de inicio de sesión guarda solo como un hash de un solo sentido que no se puede leer, así que nunca la vemos. Si entras con Google, recibimos de Google tu nombre y tu correo.',
                    'Entrenamientos: tus planes semanales, ejercicios, series, repeticiones, pesos, lo que marcaste como hecho, notas, ejercicios personalizados y ajustes como idioma, unidades y tema.',
                    'Entrenadores: a qué entrenadores estás vinculado, los códigos de invitación y el correo al que se envía una invitación de entrenador.',
                    'Actividad: cuándo iniciaste sesión y abriste la aplicación por última vez, y el registro de cuándo aceptaste estos documentos, en qué versión e idioma.',
                    'Notificaciones: si activas la notificación del temporizador de descanso, la dirección que tu navegador nos da para entregarla. Se borra cuando la notificación se envía; si el temporizador se cancela, se elimina en una limpieza posterior.',
                    'Comentarios: el nombre, el correo y el mensaje que escribes en el formulario de comentarios.',
                    'Asistente: lo que escribes en el chat y las respuestas que da. Podemos leer estas conversaciones para mejorar el asistente. Nosotros no las vinculamos a tu cuenta, pero pueden identificarte si escribes datos personales.',
                    'En tu dispositivo: la aplicación guarda ajustes, temporizadores y una copia de tu plan en el almacenamiento del navegador. No usa cookies de publicidad ni herramientas de rastreo.'
                ]
            },
            {
                heading: '3. Información sobre tu salud',
                paragraphs: [
                    'Un registro de entrenamiento puede decir algo sobre tu condición física. No pedimos información médica, la aplicación funciona sin ella y nunca estás obligado a darla. Por favor no escribas diagnósticos, medicamentos ni otros datos médicos en las notas ni en el chat. Al aceptar esta política nos autorizas de forma expresa a tratar la información de entrenamiento que decidas ingresar.'
                ]
            },
            {
                heading: '4. Para qué la usamos',
                paragraphs: [
                    'Para hacer funcionar la aplicación y mantener tus datos sincronizados entre tus dispositivos, para que los entrenadores a los que te vinculas vean y editen tu plan, para enviar correos de la cuenta (confirmación, cambio de contraseña, invitaciones), para mantener seguro el servicio, para corregir problemas y para mejorar la aplicación. No vendemos tu información, no mostramos publicidad y no usamos tu información para perfiles de mercadeo.'
                ]
            },
            {
                heading: '5. Quién la recibe',
                paragraphs: [
                    'Proveedores de servicios que trabajan para nosotros: Supabase (base de datos, inicio de sesión y funciones de servidor), Vercel (alojamiento), Google (solo si entras con Google), Chatbase y el proveedor del modelo de IA que utiliza (el asistente), EmailJS (formulario de comentarios), Brevo (correos de invitación), y el servicio de notificaciones del fabricante de tu navegador, como Apple, Google o Mozilla (notificación del temporizador de descanso).',
                    'Los entrenadores a los que te vinculas pueden ver y editar tu plan. Los administradores de la aplicación pueden ver cuentas y planes para dar soporte y mantener el servicio.',
                    'También podemos compartir información cuando la ley lo exija, o con una empresa que asuma la aplicación, bajo esta misma política.'
                ]
            },
            {
                heading: '6. Dónde se guarda',
                paragraphs: [
                    'Nuestros proveedores guardan y procesan la información en los Estados Unidos y en otros países, que pueden no ser el país donde vives. Al aceptar esta política autorizas esa transferencia.'
                ]
            },
            {
                heading: '7. Cuánto tiempo la conservamos',
                paragraphs: [
                    'Conservamos tu información mientras exista tu cuenta. Eliminar tu cuenta desde el menú de perfil borra de nuestros servidores tu inicio de sesión, tus entrenamientos, tus ejercicios personalizados, tus ajustes, tus vínculos con entrenadores y tu registro de aceptación. Los ajustes y otros datos guardados en tu navegador permanecen en ese dispositivo hasta que borres los datos del sitio. Las copias en los respaldos de los proveedores pueden permanecer por poco tiempo. Las conversaciones del chat y los mensajes de comentarios se guardan por separado; escríbenos si quieres que se eliminen.'
                ]
            },
            {
                heading: '8. Tus derechos',
                paragraphs: [
                    'Puedes ver, corregir y actualizar tu información en la aplicación, descargar una copia desde el menú de perfil (Guardar copia de mis datos) y eliminar tu cuenta allí mismo, lo que también retira tu consentimiento. Para cualquier otra solicitud, escríbenos.',
                    'Colombia: según la Ley 1581 de 2012 tienes derecho a conocer, actualizar, rectificar y suprimir tus datos, a solicitar prueba de tu autorización, a revocarla y a que se te informe el uso que se les ha dado. Respondemos las consultas en 10 días hábiles y los reclamos en 15 días hábiles. Si no quedas conforme con nuestra respuesta, puedes presentar una queja ante la Superintendencia de Industria y Comercio.',
                    'Unión Europea y Reino Unido: tratamos tu información con base en tu consentimiento y en la prestación del servicio que solicitaste. Tienes los derechos de acceso, rectificación, supresión, limitación, portabilidad y oposición, y puedes reclamar ante tu autoridad de protección de datos.',
                    'California y otros estados de los Estados Unidos: no vendemos ni compartimos tu información personal para publicidad. Puedes pedir conocerla, corregirla o eliminarla.'
                ]
            },
            {
                heading: '9. Seguridad',
                paragraphs: [
                    'La información viaja cifrada, y las reglas de la base de datos limitan cada cuenta a sus propios datos, más los entrenadores vinculados a ella y los administradores. Ningún sistema es completamente seguro, así que no podemos garantizar una seguridad absoluta.'
                ]
            },
            {
                heading: '10. Menores de edad',
                paragraphs: [
                    'La aplicación es para adultos. No recopilamos a sabiendas información de menores de 18 años. Si crees que un menor creó una cuenta, escríbenos y la eliminaremos.'
                ]
            },
            {
                heading: '11. Cambios',
                paragraphs: [
                    'Podemos actualizar esta política. Cuando cambie su sentido, la aplicación te pedirá aceptar la nueva versión antes de continuar.'
                ]
            },
            {
                heading: '12. Contacto',
                paragraphs: [
                    `Preguntas y solicitudes de privacidad: ${email}.`
                ]
            }
        ]
    }
};

export const legalDocuments = { terms, privacy };

// What the consent screen shows before the two checkboxes. Part of the
// versioned text: it is what the person saw when they agreed.
export const consentSummary = {
    en: {
        title: 'Before you start',
        intro: 'Please read this before using Gym Tracker.',
        points: [
            'Gym Tracker is a tool to plan and record workouts. It is not a personal trainer, a doctor or a physical therapist, and nothing in it is medical advice.',
            'Talk to a doctor before you start or change an exercise program. If you have an injury or a health condition, do not do an exercise unless a professional has told you it is safe for you.',
            'Stop and get medical help if you feel chest pain, trouble breathing, dizziness or sharp pain.',
            'The AI assistant is an automated program and it can be wrong. Do not use it for pain, injuries or health questions.',
            'Trainers on the app are independent. We do not verify their qualifications.',
            'You exercise at your own risk. You are responsible for the exercises, weights and technique you choose.',
            'The app is for adults: you must be at least 18, or older if the age of majority where you live is higher.'
        ],
        agreeDocuments: 'I am 18 or older and an adult under the law of the place where I live, and I have read and agree to the Terms of Use and the Privacy Policy, including how my data is handled.',
        agreeRisk: 'I understand that this app does not give medical or professional training advice and that I exercise at my own risk.'
    },
    es: {
        title: 'Antes de empezar',
        intro: 'Por favor lee esto antes de usar Gym Tracker.',
        points: [
            'Gym Tracker es una herramienta para planear y registrar entrenamientos. No es un entrenador personal, un médico ni un fisioterapeuta, y nada en ella es consejo médico.',
            'Consulta a un médico antes de empezar o cambiar un programa de ejercicio. Si tienes una lesión o una condición de salud, no hagas un ejercicio a menos que un profesional te haya dicho que es seguro para ti.',
            'Detente y busca atención médica si sientes dolor en el pecho, dificultad para respirar, mareo o dolor agudo.',
            'El asistente de IA es un programa automático y puede equivocarse. No lo uses para dolor, lesiones ni preguntas de salud.',
            'Los entrenadores de la aplicación son independientes. No verificamos sus títulos.',
            'Haces ejercicio bajo tu propio riesgo. Eres responsable de los ejercicios, pesos y técnica que elijas.',
            'La aplicación es para adultos: debes tener al menos 18 años, o más si la mayoría de edad del lugar donde vives es mayor.'
        ],
        agreeDocuments: 'Tengo 18 años o más y soy mayor de edad según la ley del lugar donde vivo, y he leído y acepto los Términos de Uso y la Política de Privacidad, incluido el manejo de mis datos.',
        agreeRisk: 'Entiendo que esta aplicación no da consejo médico ni de entrenamiento profesional y que hago ejercicio bajo mi propio riesgo.'
    }
};

export const getLegalDocument = (doc, language = 'en') =>
    legalDocuments[doc]?.[language] || legalDocuments[doc]?.en || null;

export const getConsentSummary = (language = 'en') =>
    consentSummary[language] || consentSummary.en;
