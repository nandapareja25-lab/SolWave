# PRODUCT AUDIT — Solwave
**Agosto 2026 · Perspectiva de diseño de producto**

> Esta auditoría asume que Solwave tiene la ambición de convertirse en el equivalente emocional
> de lo que Headspace fue para la meditación y Duolingo para el aprendizaje — un producto con
> identidad tan precisa que cambia cómo las personas se relacionan con la música. El estándar
> de comparación no es "una app de música". Es una categoría nueva.

---

## SECCIÓN 1 — Lo que ya está al nivel de un producto de clase mundial

### 1. La visión de categoría es genuinamente nueva

"Música sin la memoria de otra persona" es una propuesta de valor que no existe. No es un
refinamiento de Spotify — es una categoría distinta. La precisión de ese enunciado ("la canción
que bailamos en su cumpleaños" como el dolor exacto que se resuelve) es el tipo de insight que
construye productos que duran décadas. Muy pocas startups en LATAM han identificado un problema
con esta claridad.

### 2. El sistema editorial es una ventaja competitiva real

Los 6 campos (moment, sintiendo, intención, recognition, searchPhrases, semanticTags) no son
metadata — son la columna vertebral de un motor de conexión emocional que ningún competidor
tiene. Spotify tiene audio features. Apple Music tiene géneros. Solwave tiene el momento exacto
de la conversación que alguien tiene consigo mismo a las 11pm. Eso no se copia en seis meses.

La prueba de calidad es inusualmente rigurosa: "¿Podría haberlo escrito alguien que realmente
sobrevivió ese momento?" — eso es un estándar editorial que la mayoría de productos evita porque
es difícil. Que exista como ley interna es señal de producto serio.

### 3. El concepto de álbum como universo emocional es correcto

La decisión de rechazar playlists y apostar por álbumes conceptuales con narrativa interna es
contracultural y acertada. Un álbum donde cada canción es un capítulo distinto de la misma
experiencia crea algo que Spotify no puede replicar con su modelo de datos: profundidad. El
oyente no solo consume canciones — entra a un mundo emocional ya construido.

### 4. El sistema Historia → Momento → Canción → Álbum

Esta es la feature más original de la app y la que más claramente separa a Solwave de cualquier
competidor. La pregunta "¿Qué estás viviendo que todavía no tiene una canción?" es perfecta.
No es un formulario — es una invitación. Y el ciclo completo (búsqueda semántica → match →
no-match → captura → inspired by → panel artista) tiene la arquitectura conceptual correcta.
El "Inspired by D.R." en el player es genuinamente emocionante — conecta al oyente con el
origen humano de la música de una forma que ningún streaming ha hecho antes.

### 5. La identidad visual Golden Stillness es defendible

El sistema "cinematic dark luxury" con Playfair Display + DM Sans, los gradientes de atardecer
tropical como fondos, y la restricción extrema del gold (solo en play/CTA) crea una atmósfera
que se siente diferente a cualquier app de música existente. No hay neones, no hay glass
genérico, no hay el morado-oscuro de "hecho con IA". Tiene carácter propio.

### 6. La búsqueda por situación de vida (no por título)

Que el buscador entienda "me desperté y ya no sentía el peso que cargaba" y devuelva "Ya No
Vuelvo Atrás" es una demo de producto que convierte en la primera vez. Eso es exactamente lo
que necesita Valentina a las 11pm. El motor de matching semántico sobre moment + sintiendo +
searchPhrases es el corazón técnico correcto.

### 7. El avatar Valentina está bien definido

La descripción es concreta sin ser estereotipada. "Son las 11pm. Terminó de hablar con él.
Abre Spotify — le sale la canción equivocada." — ese es el momento exacto del problema. Una
ficha de avatar que tiene el momento exacto del dolor, no solo la demografía, es el tipo de
claridad que permite tomar buenas decisiones de producto durante años.

---

## SECCIÓN 2 — Lo que todavía no alcanza ese nivel y por qué

### 1. La experiencia de primera vez no cumple la promesa de la visión

La visión dice: "Valentina llega buscando música para lo que siente." Hoy, cuando alguien abre
la app por primera vez ve el álbum "Llegaste muy tarde" como featured — sin contexto, sin saber
por qué ese álbum es para ella, sin que la app haya preguntado nada sobre lo que está viviendo.

La primera pantalla debería ser la respuesta más directa a "¿qué está viviendo esta persona
ahora mismo?" En cambio, es una vitrina de contenido ordenada por lo que se construyó, no por
lo que la persona necesita.

El sistema Historia (la pregunta "¿Qué estás viviendo que todavía no tiene una canción?")
debería ser el primer momento de la experiencia — o al menos debería existir una versión de
ese flujo como pantalla cero de la app. Hoy está enterrado como quinta tab en el nav.

### 2. La navegación no refleja la arquitectura emocional del producto

Inicio / Explorar / Favoritos / Historia / Perfil es la arquitectura de cualquier app de
contenido. No es la arquitectura de un sello emocional.

Las categorías que importan para Valentina no son "Inicio" y "Explorar" — son las emociones
que está atravesando. Un usuario que abre Solwave en medio de una ruptura no piensa "voy a
explorar"; piensa "necesito algo para esto que estoy viviendo ahora."

La nav actual no contiene ninguna referencia a los estados emocionales que el producto promete
manejar. "Historia" como tab es un nombre que no le dice nada a alguien que llega por primera
vez. Podría llamarse "✦ Pide tu canción" o "Para lo que vives" — algo que comunique la promesa.

### 3. El player no capitaliza el activo más poderoso del catálogo: el `recognition`

El campo `recognition` es "la frase que alguien guardaría en sus fotos o enviaría a una amiga."
Es el activo más shareable de todo el sistema editorial. Hoy no aparece en el player.

El player muestra: nombre del álbum + TRACK X DE Y + GÉNERO + título + moment + controles.
Lo que debería ver Valentina cuando escucha es: el moment en itálica sutil, y en algún momento
de la canción, el recognition apareciendo como el único texto en pantalla — una verdad sola,
sin contexto. Eso es lo que hace que alguien pause, tome screenshot, y lo mande a alguien.

Si el recognition no está en el player, el activo más poderoso del producto está invisible.

### 4. Los álbumes se sienten como listas, no como mundos emocionales

La visión dice: "El oyente no elige una canción — entra a un universo emocional." La realidad
hoy: el tracklist de un álbum es una lista numerada con moment en itálica debajo de cada título.

Para que un álbum se sienta como un universo, necesita:
- Un concepto presentado de una forma que cree anticipación (no solo "Para los que no supieron
  valorar un amor hasta que fue demasiado tarde" en body text)
- La sensación de que las canciones tienen un orden narrativo deliberado — que la canción 3 lleva
  a la canción 4, que el álbum tiene un arco
- Posiblemente: una escucha sugerida (reproducir el álbum completo, en orden, como experiencia)

Hoy el álbum se ve y se usa igual que cualquier tracklist de Spotify.

### 5. El sistema de favoritos no tiene memoria emocional

Favoritos agrupados por álbum es organización de biblioteca. No es lo que Valentina necesita.

Lo que ella necesita es volver a encontrar "la canción que me acompañó la noche que decidí no
escribirle más." Eso no es un favorito por álbum — es un momento en su historia emocional. Los
favoritos deberían tener contexto temporal, al menos. Cuándo se guardó. Qué estaba viviendo.

### 6. La pantalla Explorar ignora la intención de búsqueda más importante

"Explorar" tiene: barra de búsqueda + filtros por emoción + grid de canciones. El problema es
que los chips de emoción (Desamor, Empoderamiento, Amor sano...) son categorías muy amplias.
Una persona que está en el día 3 de una ruptura y otra que ya lleva 6 meses en proceso no
necesitan lo mismo aunque ambas seleccionen "Desamor."

El sistema editorial tiene la granularidad correcta (semanticTags con etapa del proceso, tipo de
comportamiento) pero la interfaz de exploración no lo expone. El buscador por texto libre es
mejor que los chips — pero la mayoría de usuarios no sabe que puede escribir en lenguaje natural
porque no hay ninguna indicación de que eso funciona.

### 7. No existe el concepto de "pasaje" como arco de evolución del usuario

La visión del producto habla de que Solwave evoluciona con el usuario — del desamor al
empoderamiento al amor sano. Pero en la app no hay ningún mecanismo que refleje ese viaje.
El usuario que llegó con "Llegaste muy tarde" hace tres meses y ahora está escuchando
"Desde que llegaste" no tiene ninguna forma de ver ese recorrido ni de que la app lo reconozca.

Duolingo tiene streaks. Headspace tiene journeys. Solwave no tiene nada que marque la evolución
emocional del usuario a lo largo del tiempo — que es exactamente la promesa central del producto.

### 8. La onboarding no conecta emoción con álbum de forma directa

El onboarding hace 4 preguntas (¿cuándo escuchas música / qué buscas / qué géneros / situación
emocional) y lleva a un paywall. El problema: en ningún momento el usuario ve la conexión entre
su respuesta y un álbum específico. Si respondo "estoy en una ruptura", debería ver —
inmediatamente — que "Llegaste muy tarde" fue creado exactamente para eso, con el concepto del
álbum explicado, y quizás la primera canción comenzando a sonar en el fondo.

La promesa "la app que entiende lo que estás viviendo" necesita ser demostrada durante el
onboarding, no prometida.

### 9. La identidad visual de los álbumes individuales es débil

Cada álbum tiene un gradiente CSS y un emoji. Pero los gradientes son todos variaciones del
mismo oscuro-con-atardecer. "Llegaste muy tarde" (desamor en bachata) y "Las pequeñas cosas"
(gratitud en indie folk) deberían sentirse visualmente distintos — no solo como gradientes de
color diferente sobre la misma estructura.

El emoji 💔 / 🌱 / ☕ como identidad visual de un álbum es un placeholder que quedó así. Para
un sello discográfico que promete nivel de Apple Music, el artwork del álbum es el primer
momento de reconocimiento emocional — y hoy es un emoji en una card oscura.

### 10. No existe nada que pase cuando termina un álbum

Si Valentina escucha "Llegaste muy tarde" completo — las 11 canciones, en orden, como
experiencia — qué pasa después? En este momento: nada. La app no reconoce ese hito, no sugiere
un próximo paso, no celebra que completó ese recorrido emocional.

El final de un álbum es uno de los momentos de mayor apertura emocional del usuario — y Solwave
no hace nada con él.

---

## SECCIÓN 3 — Las oportunidades más grandes que todavía no estamos aprovechando

### OPORTUNIDAD 1: El "Pasaje" como unidad de experiencia temporal

La oportunidad más grande que no está en el producto: convertir la relación del usuario con
un álbum en un *pasaje* — una etapa de su vida emocional.

Un pasaje comienza cuando el usuario conecta con un álbum. Tiene una duración natural (días,
semanas). Tiene momentos internos (la primera canción que golpeó, el día que escuchó el álbum
completo, la canción que guardó). Y tiene un cierre — el momento en que el usuario ya no
necesita ese álbum de la misma forma.

Si Solwave pudiera capturar eso, no sería una app de streaming — sería una bitácora emocional.
"Estuve 23 días en 'Llegaste muy tarde'. Guardé 4 canciones. La primera fue 'Me aprendí sin ti'."
Eso es el tipo de relación que hace que alguien pague durante años.

Duolingo logra eso con streaks y XP. Solwave puede lograrlo con pasajes — sin gamificar, sin
trivializar, simplemente dándole nombre y forma a algo que el usuario ya está haciendo.

### OPORTUNIDAD 2: El `recognition` como motor viral nativo

"La felicidad que buscabas en esa relación siempre estuvo en tu propia voz." — esa frase,
en formato de card de Instagram con el gradiente del álbum y el logo de Solwave, puede generar
la mitad del tráfico del producto sin pagar un peso en ads.

Esto es contenido orgánico nativo. Valentina la guarda en sus fotos. La manda a una amiga.
La amiga pregunta "¿de dónde es?" Y llega a Solwave.

Hoy el `recognition` existe como campo del sistema editorial pero no tiene ninguna superficie
en el producto. Ni en el player, ni como card shareable, ni como vista de "frases de Solwave".
Es el activo más viralizador del sistema — completamente sin explotar.

### OPORTUNIDAD 3: La llegada desde YouTube como momento de producto

La ficha del avatar dice que Valentina llega desde YouTube. Ese es el canal de adquisición
principal — y también el momento más cargado emocionalmente. Alguien que hace clic desde un
video de YouTube a las 11pm está en un estado emocional activo. Ya se identificó con algo.

El flujo ideal: video de YouTube → la descripción tiene un link → pantalla de llegada que
detecta si hay un `moment` en la URL (ej: `solwave.co/buscar?q=ya+no+quiero+llorar+mas`) →
la app muestra directamente el resultado de búsqueda con la canción que corresponde → sin
onboarding todavía — solo la canción, empezando a sonar.

Ese momento de "ya está sonando, ya me entendió" antes de que el usuario haya hecho nada —
eso convierte. Hoy no existe. El usuario llega, ve la landing, ve el onboarding, ve el paywall.
Ha perdido el momentum emocional del momento.

### OPORTUNIDAD 4: El "día emocional" del usuario como superficie de regreso

Valentina usa Solwave en momentos específicos — no todos los días. Cuando vuelve después de una
semana, la app la recibe como si fuera la primera vez.

Imagina que la app dijera: "Hace 8 días escuchaste 'Me aprendí sin ti' tres veces seguidas."
O: "La última vez que estuviste aquí guardaste 'Sola me queda bien'. ¿Cómo estás hoy?"

Eso no es una notificación — es una conversación. No requiere IA sofisticada. Solo requiere
guardar cuándo y qué escuchó el usuario, y hacer algo significativo con esa información.

### OPORTUNIDAD 5: El "momento de llegada" como pantalla zero

La pantalla cero de la app no debería ser el Home con el álbum destacado. Debería ser una
pregunta — en los primeros 3 segundos — que permita a la app mostrar exactamente lo que el
usuario necesita.

"¿Qué estás viviendo hoy?" con 4-6 opciones visuales (no chips de texto — imágenes, gradientes,
atmósferas). La respuesta conecta directamente con un álbum o con el buscador abierto.

Eso no es onboarding. Es el producto haciendo su trabajo desde el primer segundo.

### OPORTUNIDAD 6: La co-creación como identidad del sello

El sistema "Inspired by" tiene el potencial de ser la identidad más única de Solwave. Ningún
sello ha hecho esto: canciones que nacen de historias reales de personas reales, con atribución
visible (con privacidad).

Pero hoy esto está incompleto porque solo funciona en una dirección. La persona envía su
historia. La app la guarda. El artista (en el panel) puede marcarla como "convertida". Y ahí
termina.

Lo que falta: cuando esa canción existe, la persona que la inspiró debería recibir una noticia.
"La canción que inspiraste ya existe. Se llama ___. Eres la primera en escucharla." Ese momento
— recibir una canción creada a partir de tu historia — es el momento emocional más poderoso
que puede crear un producto de música. Y no existe todavía.

### OPORTUNIDAD 7: El catálogo como mapa, no como lista

65 canciones en 6 álbumes es suficiente para crear un mapa emocional del producto. Un mapa
donde cada álbum ocupa un territorio emocional, y el usuario puede ver —visualmente— en qué
parte del mapa está hoy y adónde podría ir.

"Estás en Desamor tardío. Muchas personas que estuvieron aquí fueron a Empoderamiento después.
Algunos fueron directamente a Amor sano. ¿A dónde quieres ir?"

Eso no es un algoritmo de recomendación — es un mapa de la experiencia humana que Solwave
ha construido deliberadamente. Y puede presentarse como lo que es: una guía emocional, no una
sugerencia algorítmica.

---

## SECCIÓN 4 — Las 20 mejoras con mayor impacto, en orden de prioridad

---

### #1 — El `recognition` en el player (impacto inmediato en retención y viralidad)

**Qué:** Durante la reproducción, en algún punto de la canción (idealmente near el 60-70% de
la duración), el campo `recognition` aparece como texto único en pantalla — Playfair Display
grande, solo, centrado, en fade-in suave. Nada más. La canción sigue sonando.

**Por qué primero:** Es el momento más shareable del producto. El usuario toma screenshot, lo
manda a alguien, esa persona llega a Solwave. Es crecimiento orgánico desde dentro del
reproductor. Y técnicamente es simple: un timer que compara `audioEl.currentTime` con
`audioEl.duration * 0.65` y hace aparecer el texto.

**Emoción que provoca:** Silencio interno. La sensación de que alguien finalmente lo puso en
palabras. Urgencia de compartir.

---

### #2 — Historia como pantalla cero, no como quinta tab (impacto en conversión y diferenciación)

**Qué:** Cuando el usuario abre la app por primera vez (o cuando no hay una sesión reciente),
la primera cosa que ve es la pregunta "¿Qué estás viviendo hoy?" — con las opciones visuales
de los 6 álbumes como respuesta. Al elegir, va directamente al álbum correcto, con la primera
canción comenzando en el mini-player.

Para usuarios recurrentes, el Home normal es la pantalla de inicio.

**Por qué:** La propuesta de valor es "música para lo que estás viviendo". Si la primera
interacción no demuestra eso, la promesa queda en palabras. Este cambio hace que el producto
demuestre su propuesta en los primeros 10 segundos.

**No es:** Reemplazar el Home. Es una pantalla de bienvenida que aparece condicionalmente.

---

### #3 — El arco narrativo del álbum visible en el tracklist (impacto en tiempo de sesión)

**Qué:** En la vista de álbum, las canciones no son solo una lista numerada. Tienen 3 o 4
"momentos" del arco marcados visualmente:

- Canciones 1-3: "El reconocimiento" (la entrada al universo emocional)
- Canciones 4-7: "El proceso" (el núcleo del álbum)
- Canciones 8-11: "La salida" (el arco hacia dónde va el álbum)

Esto puede ser tan simple como un separador con un label y un cambio de tono en el fondo — pero
da la sensación de que el álbum tiene narrativa, no solo canciones.

**Por qué:** Invita a escuchar el álbum completo. "El arco" es la razón para continuar.

---

### #4 — Card de compartir con el `recognition` (impacto en adquisición orgánica)

**Qué:** En el player, un botón de compartir genera una card con: gradiente del álbum + el
`recognition` en Playfair Display grande + el logo de Solwave + "Escúchala en solwave.co".
Se exporta como imagen directamente desde la app.

**Por qué:** Esto es el canal de adquisición más poderoso disponible sin ningún costo. Una
frase poderosa en el fondo visual del álbum, atribuida a Solwave, circulando en Instagram
Stories y WhatsApp. Cada vez que alguien la comparte, hay un link implícito al producto.

---

### #5 — "Para lo que vives" en el Home, reemplazando "Por lo que estás viviendo"

**Qué:** Las chips de emoción en el Home tienen texto genérico. Reemplazarlas por frases que
suenen a lo que Valentina diría a las 11pm:

En vez de: "Desamor · Empoderamiento · Amor sano · Gratitud · Crecimiento · Alegría"

Así: "Me rompieron el corazón · Estoy eligiéndome · Llegó alguien nuevo · Agradecida de estar
aquí · Buscando quién soy · Quiero celebrar"

Mismo filtro. Lenguaje radicalmente diferente. El usuario se reconoce en la categoría.

**Por qué:** Reducir la distancia entre el estado emocional del usuario y la acción de elegir
un álbum. Un chip que dice "Desamor" requiere que el usuario haga la traducción. Un chip que
dice "Me rompieron el corazón" no requiere nada.

---

### #6 — El "Pasaje" como feature de retención (impacto en churn y regreso)

**Qué:** Cuando el usuario escucha canciones de un mismo álbum por segunda o tercera vez, la
app lo reconoce como "en pasaje" en ese álbum. Aparece una indicación discreta: "Llevas X días
en 'Llegaste muy tarde'." Las canciones que escuchó se marcan sutilmente. No hay gamificación —
solo reconocimiento del recorrido.

Cuando el usuario deja de escuchar ese álbum por N días, la app puede ofrecer: "¿Ya superaste
este pasaje?" con la opción de marcarlo como cerrado — y un momento de celebración silencioso
(el texto: "Lo que viviste en este pasaje fue real. Lo que viene también lo será.")

**Por qué:** Esto da al producto una dimensión temporal que ningún streaming tiene. El usuario
no está "oyendo música" — está "traversando un pasaje". Eso es lo que justifica el precio y lo
que construye lealtad real.

---

### #7 — Notificación al "inspirador" cuando su canción existe

**Qué:** Cuando alguien envía una historia a través del flujo Historia, y la artista después
marca ese momento como "Convertido en canción" y asocia la canción creada, esa persona recibe
una notificación (o email): "La canción que inspiraste ya existe. Se llama [título]. Eres
la primera en escucharla antes de que salga."

**Por qué:** Este es el momento emocional más poderoso que puede crear el producto. Transforma
al usuario de oyente pasivo a co-creador. Nadie que recibe esa notificación deja de contárselo
a alguien. Es retención, es viralidad, y es la identidad más profunda de Solwave en acción.

---

### #8 — Buscador con hint del lenguaje correcto

**Qué:** En el placeholder del buscador, en vez de "Buscar canciones...", rotación de frases
reales del tipo:
- "ya no sé si lo extraño a él o a quien era yo..."
- "me desperté bien y no sé por qué"
- "quiero música que no tenga su voz adentro"

El hint cambia cada vez que el usuario abre el buscador.

**Por qué:** El 90% de los usuarios no sabe que puede buscar en lenguaje natural. Este hint
enseña la capacidad sin tutorial. La primera vez que alguien escribe así y funciona, entiende
para qué sirve Solwave en profundidad.

---

### #9 — El álbum completo como experiencia de escucha sugerida

**Qué:** En la vista de álbum, además del tracklist, un CTA prominente: "Escuchar el álbum
completo · 41 min". Al tocar, el álbum empieza desde el track 1, en orden, sin interrupciones.
El player muestra "Álbum completo · Canción 3 de 11" en lugar del tracklist.

Al terminar el último track, aparece una pantalla de cierre del álbum — una frase, el concepto
del álbum en Playfair grande, y la pregunta: "¿Cómo te sientes ahora?"

**Por qué:** La unidad de experiencia prometida es el álbum, no la canción. Pero hoy no existe
un mecanismo que te invite a vivirlo como tal. Este CTA hace que la promesa sea real.

---

### #10 — Artwork de álbum con carácter propio (no emoji + gradiente)

**Qué:** Cada álbum necesita una imagen de identidad propia — no una fotografía de archivo, sino
algo generado con AI que capture la atmósfera emocional exacta del álbum. Para "Llegaste muy
tarde" (bachata · desamor tardío): una imagen que evoque la espera, la noche, la nostalgia
con rabia. Para "Las pequeñas cosas" (indie folk · gratitud): luz de mañana, textura, calma.

El emoji + gradiente es un placeholder. El artwork es la identidad del álbum.

**Por qué:** El primer momento de reconocimiento emocional es visual. Si el artwork no provoca
nada, la promesa de "universo emocional" queda sin sustento.

---

### #11 — La llegada desde YouTube: deep link emocional

**Qué:** Los videos de YouTube de Solwave incluyen links a canciones específicas que corresponden
al estado emocional del video. Ese link lleva a una pantalla de aterrizaje que muestra la
canción y empieza a sonarla inmediatamente (preview de 30 segundos sin login). El CTA único:
"Escucharla completa sin interrupciones."

**Por qué:** Valentina llega desde YouTube ya en estado emocional activo. Si la app empieza a
sonido de inmediato, el 80% del trabajo de conversión ya está hecho. Si la primera experiencia
es el onboarding, perdes el momento.

---

### #12 — Favoritos con contexto temporal y emocional

**Qué:** Cada favorito guardado tiene, opcionalmente, una nota del momento: "¿Qué está pasando
cuando guardas esta canción?" (campo de texto libre, opcional, máximo 2 líneas). En la vista de
favoritos, aparece la fecha y esa nota como contexto.

Resultado: los favoritos se convierten en una bitácora emocional. "El 3 de agosto: 'Sola me
queda bien' — 'después de la llamada'."

**Por qué:** Convierte el producto de una app de streaming en un diario emocional con
soundtrack. Eso no se cancela.

---

### #13 — "Más personas en este pasaje" — comunidad implícita sin red social

**Qué:** En el player, una indicación discreta: "234 personas escucharon esta canción hoy."
O: "Esta es la canción más guardada de 'Llegaste muy tarde' esta semana."

Sin comentarios. Sin likes. Sin perfiles. Solo la conciencia de que no estás solo en lo que
estás sintiendo.

**Por qué:** La soledad en los momentos emocionales difíciles es parte del dolor de Valentina.
Saber que otras personas están escuchando lo mismo que ella crea pertenencia sin red social.
Es el tipo de feature que Headspace usa bien (la campana de meditación grupal). Es sencillo
de implementar con un contador de plays en Supabase.

---

### #14 — El player como ventana, no como pantalla de controles

**Qué:** El player abierto debería ser visualmente: 80% gradiente del álbum (o artwork cuando
exista) y 20% controles. Hoy es quizás 55% artwork / 45% controles e información. La jerarquía
visual debería invertirse — la atmósfera es el protagonista, los controles son el fondo.

El texto en el player debería ser más grande (el título), más espaciado, y el moment debería
estar en Playfair italic grande — no en DM Sans 12px.

**Por qué:** Si el player se siente como una pantalla de controls, estás en modo "herramienta".
Si se siente como entrar a un lugar, estás en modo "experiencia". La diferencia entre ambos
es retention.

---

### #15 — Onboarding que demuestra en vez de preguntar

**Qué:** En lugar de 4 preguntas → paywall, el onboarding debería tener un momento de "demo"
antes del paywall: el usuario responde "¿Qué estás viviendo?" → la app muestra el álbum que
corresponde → empieza a sonar el primer track (30 segundos) → "Esta canción la escribimos para
lo que describes. Hay 10 más en este álbum. Escúchalas todas."

**Por qué:** La promesa de Solwave es que hay una canción exacta para lo que el usuario vive.
Si esa promesa no se demuestra antes de pedir dinero, estás vendiendo una idea abstracta. Si
se demuestra, estás vendiendo una experiencia que ya empezó.

---

### #16 — La pantalla de "regreso" después de ausencia

**Qué:** Si el usuario vuelve después de 5+ días sin abrir la app, la primera pantalla es
diferente al Home normal. Muestra: "Hace X días estabas escuchando [canción/álbum]. ¿Sigues
en el mismo momento o cambiaste?"

**Por qué:** Crea la sensación de que la app tiene memoria — de que te conoce. Ese es el
tipo de relación que construye retención a largo plazo. Técnicamente es trivial: guardar la
última sesión y mostrar un estado diferente según el tiempo transcurrido.

---

### #17 — El `sintiendo` como gancho de discovery (no solo el `moment`)

**Qué:** En la vista de tracklist y en la búsqueda, actualmente se muestra el `moment`. El
`sintiendo` (el diálogo interno) tiene un tono diferente — más largo, más íntimo, más "estás
dentro de la cabeza de alguien que vivió esto." Debería tener su propio momento de exposición
en el player — quizás después del recognition, en el 80% de la canción.

**Por qué:** Hay usuarios que se conectan con la situación externa (moment). Hay usuarios que
se conectan con el diálogo interno (sintiendo). Mostrar ambos en distintos momentos de la
reproducción hace que el producto tenga más superficie de conexión emocional.

---

### #18 — Mapa emocional de Solwave como visualización del catálogo

**Qué:** Una vista alternativa a la grilla de álbumes — un mapa donde los 6 álbumes están
posicionados en un espacio emocional con dos ejes: intensidad (baja → alta) y tipo (pérdida →
descubrimiento). El usuario puede ver de un vistazo dónde está el catálogo y qué parte
corresponde a lo que siente.

No es una grid. Es un mapa. Es visual. Es una interfaz que hace que el producto parezca diferente
a todo lo demás.

**Por qué:** Refuerza la propuesta de "sello emocional" a nivel visual. Si el catálogo se ve
como un mapa en vez de una lista, el usuario entiende inmediatamente que esto es diferente a
Spotify.

---

### #19 — Notificación semanal: "Esta semana en tu pasaje"

**Qué:** Una notificación semanal (no push — puede ser email o in-app) que resume el pasaje de
la semana: qué álbum escuchó más, qué canción guardó, cuántas veces escuchó [canción X].
No es un informe. Es una carta. "Esta semana escuchaste 'Me aprendí sin ti' cuatro veces. No
hay mucho más que decir — eso ya lo dice todo."

**Por qué:** Crea un ritual de regreso semanal. El usuario espera esa carta. Así es como los
productos se vuelven parte de la vida de alguien.

---

### #20 — El cierre de un pasaje como momento de producto

**Qué:** Cuando el usuario indica que cerró un pasaje (terminó de procesar ese álbum), la app
tiene un momento especial: el álbum se "completa" visualmente en su perfil/historial. Aparece
un texto: el concept del álbum en Playfair Display grande, con el número de días que duró el
pasaje y las canciones más escuchadas. No hay confeti. No hay puntos. Solo reconocimiento
silencioso de algo que fue real.

Opcionalmente: la artista escribe para cada álbum una "nota de cierre" — unas líneas para el
oyente que terminó ese pasaje. Solo visible cuando el usuario lo cierra.

**Por qué:** Este es el momento donde el usuario entiende por qué Solwave no es Spotify. No
porque suene mejor. Porque fue testigo de algo importante en su vida. Esa sensación no se
cancela.

---

## NOTA FINAL

Solwave tiene la materia prima para ser un producto de clase mundial. La visión es clara. El
sistema editorial es genuinamente poderoso. El insight del avatar es correcto. El sistema
Historia → Canción → Inspired by es original.

Lo que falta no es inventar más features. Es profundizar en lo que ya existe.

El `recognition` ya está en el sistema — solo falta llevarlo al player.
El concepto de pasaje ya está implícito en cómo usa el producto Valentina — solo falta darle forma.
El sistema Historia ya existe — solo falta cerrar el ciclo con la notificación al inspirador.

La diferencia entre un buen producto y un producto que cambia cómo las personas escuchan música
no está en agregar cosas. Está en profundizar las cosas correctas hasta que provocan algo que
ningún competidor puede copiar fácilmente.

Esa profundidad — ese "no puedo creer que alguien haya construido esto exactamente para mí" —
es lo que convierte a Solwave de una app de streaming curada en algo que no existía antes.

*Auditoría preparada agosto 2026.*
