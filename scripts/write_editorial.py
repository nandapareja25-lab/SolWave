#!/usr/bin/env python3
"""
Escribe los borradores editoriales en los JSON del pipeline.
Ejecutar después de analyze_track.py.
"""
import json, os

OUTPUT_DIR = "/Users/mariafernandapareja/Desktop/Claude App Nueva/Solwave/scripts/editorial"

EDITORIAL = {

  "a-mi-tiempo": {
    "titulo_en_cancion": "A Mi Tiempo",
    "moment": "Para cuando cansada de compararte con los demás descubres que llegar despacio también es llegar.",
    "sintiendo": "El agotamiento de sentir que todos avanzan y tú te quedas. La presión de tener que llegar al mismo tiempo que el mundo. Y algo que empieza a soltarse cuando te permites ir a tu ritmo.",
    "intencion": "No te pide que esperes sin hacer nada. Te recuerda que lo que es para ti no puede perderse — aunque llegue cuando menos lo esperas.",
    "emocion_principal": "paz / calma",
    "tags": ["ritmo propio", "comparación", "paciencia", "confianza", "timing"],
    "frases_clave_editoriales": [
      "a mi tiempo todo va a llegar",
      "cada semilla conoce su lugar",
      "no llego tarde, sólo llego cuando debo llegar",
      "aprendí a no competir"
    ],
    "nota_mapeo": "Alta coincidencia temática con álbum Las pequeñas cosas o Volví a escucharme. Letra sobre timing, paciencia y no competir. Sin ruptura ni empoderamiento obvio."
  },

  "hoy-elijo-paz": {
    "titulo_en_cancion": "Hoy Elijo Paz",
    "moment": "El día que decides no correr junto al mundo — y descubres que la paz no aparece cuando todo está en orden, sino cuando decides elegirla.",
    "sintiendo": "El agotamiento de siempre querer controlar lo que no puedes. Y la sorpresa de que cuando sueltas, aparece algo que no sabías que existía: la calma escondida en lo simple.",
    "intencion": "Para recordarte que la paz no se encuentra — se elige. Aunque el mundo no se detenga. Aunque todavía queden cosas sin resolver.",
    "emocion_principal": "paz / calma",
    "tags": ["paz", "soltar", "control", "calma", "mindfulness", "presente"],
    "frases_clave_editoriales": [
      "Hoy elijo paz aunque el mundo no se detenga jamás",
      "Las manos aprendieron a soltar despacio lo que durante años quise controlar",
      "Hay una fuerza escondida en lo simple que solo aparece cuando dejo de empujar"
    ],
    "nota_mapeo": "Alta coincidencia con álbum Las pequeñas cosas. Canción sobre elegir la calma en medio del ruido. Energía íntima, introspectiva."
  },

  "hoy-es-un-nuevo-comienzo": {
    "titulo_en_cancion": "Hoy Es Un Nuevo Comienzo",
    "moment": "El primer día en que la esperanza llega sin que nadie la invite — y eliges quedarte con ella en vez de preguntarte si mereces que esté.",
    "sintiendo": "Esa ligereza frágil que sientes cuando dejas de arrastrar el ayer. No todo está resuelto. Pero hoy algo en ti decidió empezar.",
    "intencion": "Para el primer paso después de mucho tiempo quieta. Para que sientas que renacer es posible, aunque todavía no sea seguro.",
    "emocion_principal": "alegría",
    "tags": ["nuevo comienzo", "esperanza", "renacer", "fe", "presente"],
    "frases_clave_editoriales": [
      "Hoy es un nuevo comienzo, todo vuelve a florecer",
      "Hoy abracé este momento y decido renacer",
      "No hace falta mirar atrás, hoy prefiero volver a sentir"
    ],
    "nota_mapeo": "Coincidencia con álbum Vuelvo a sentir la vida o Volví a escucharme. Canción de apertura o cierre de proceso."
  },

  "hoy-me-elijo": {
    "titulo_en_cancion": "Hoy Me Elegí",
    "moment": "Cuando dejas el celular sobre la mesa, te miras al espejo y decides que hoy eres tú quien manda — sin pedir permiso a nadie.",
    "sintiendo": "El silencio raro de quien por fin dejó de buscar validación afuera. No es vacío — es espacio. La calma nueva de quien descubrió que no necesita que el mundo le diga que está bien.",
    "intencion": "Para que la primera persona que elijas hoy seas tú. Sin explicaciones. Sin condiciones.",
    "emocion_principal": "empoderamiento",
    "tags": ["elegirse", "autocuidado", "validación", "silencio", "decisión", "permiso"],
    "frases_clave_editoriales": [
      "Hoy me elegí, sin pedir permiso a nadie más",
      "El miedo se quedó detrás",
      "Mi corazón ya encontró su voz"
    ],
    "nota_mapeo": "Alta coincidencia con álbum Ya no vuelvo atrás o Volví a escucharme. Título probable de catálogo: 'Me elegí primero' o 'Sin pedir permiso'."
  },

  "hoy-todo-comienza": {
    "titulo_en_cancion": "Hoy Todo Comienza Aquí",
    "moment": "Cuando abres la ventana y algo en el aire te dice que este día sí es diferente — aunque no puedas explicar por qué.",
    "sintiendo": "La esperanza frágil que aparece en un día normal. No gran revelación. Solo la sensación de que el corazón volvió a latir diferente y que eso, de alguna manera, importa.",
    "intencion": "Para el día que decidiste confiar en que lo bueno está de camino — sin necesitar pruebas todavía.",
    "emocion_principal": "alegría",
    "tags": ["nuevo comienzo", "esperanza", "confianza", "florecer", "mañana"],
    "frases_clave_editoriales": [
      "Hoy todo comienza aquí, mi corazón vuelve a latir",
      "Lo bueno ya viene hacia mí, porque aprendí a sonreír",
      "No necesito mirar hacia atrás, lo que es para mí me encontrará"
    ],
    "nota_mapeo": "Coincidencia con álbum Vuelvo a sentir la vida. Canción de apertura, energía alta, celebratoria."
  },

  "me-elegi": {
    "titulo_en_cancion": "Me Elegí",
    "moment": "Para cuando te das cuenta de que la persona que más te ha fallado eras tú misma — y decides que eso cambia hoy.",
    "sintiendo": "El peso de las heridas que cargaste sola durante años. Y la ligereza nueva de quien decidió que ya basta de falsas palabras — aunque vengan de adentro.",
    "intencion": "No te pide que seas perfecta. Te pide que dejes de ser tu propio enemigo.",
    "emocion_principal": "empoderamiento",
    "tags": ["elegirse", "autoestima", "heridas", "liberación", "alas", "fuerza"],
    "frases_clave_editoriales": [
      "Hoy me elegí, me abrí las alas, rompí las jaulas de mi corazón",
      "Ya no me digo falsas palabras, mi amor completo es mi canción",
      "Cuántas tormentas tuve que cruzar, cuántas promesas se llevó el ayer"
    ],
    "nota_mapeo": "Alta coincidencia con álbum Volví a escucharme o Ya no vuelvo atrás. Posibles tracks: 'Me elegí primero', 'Ya no me escondo'."
  },

  "me-encontre-primero": {
    "titulo_en_cancion": "Me Encontré Primero",
    "moment": "Cuando entiendes que lo que sentiste como pérdida fue, en realidad, el comienzo de encontrarte.",
    "sintiendo": "La paz tranquila de quien ya no espera que alguien llegue a salvarla. La certeza nueva de que un corazón completo late distinto — más suave, más propio.",
    "intencion": "Para que la próxima historia de amor empiece desde un lugar diferente: desde ti.",
    "emocion_principal": "crecimiento",
    "tags": ["encontrarse", "amor propio", "post-ruptura", "completitud", "nuevo comienzo"],
    "frases_clave_editoriales": [
      "Nunca fui perderte, fui encontrarme primero",
      "Aprendí que un corazón completo late mucho más",
      "Hoy ya no espero que alguien me salve"
    ],
    "nota_mapeo": "Alta coincidencia con álbum Volví a escucharme. Posible track: 'Me elegí primero' (track 2) — emoción de post-ruptura vista desde el crecimiento, no desde el dolor."
  },

  "mi-ritmo-tambie-n-cuenta": {
    "titulo_en_cancion": "Mi Ritmo También Cuenta",
    "moment": "Para cuando dejas de comparar tu ritmo con el de todos los demás — y descubres que el tuyo siempre tuvo sentido.",
    "sintiendo": "El cansancio de competir con un ritmo que no es el tuyo. La presión de avanzar al paso del mundo cuando tu paso es otro. Y la calma nueva de quien se da permiso de ir despacio.",
    "intencion": "Para recordarte que el sol no te pregunta a qué hora saliste. Simplemente vuelve a brillar. Tú también puedes.",
    "emocion_principal": "paz / calma",
    "tags": ["ritmo propio", "comparación", "naturaleza", "paciencia", "brillo", "sin competir"],
    "frases_clave_editoriales": [
      "Mi ritmo también cuenta, nadie me puede apagar",
      "Ya no quiero demostrar, todo lo que buscaba siempre estuvo en mi lugar",
      "Cada semilla bajo la piel guarda un jardín por florecer"
    ],
    "nota_mapeo": "Coincidencia con álbum Las pequeñas cosas o Volví a escucharme. Temática de ritmo propio, naturaleza, sin urgencia."
  },

  "no-tengo-que-saberlo-todo": {
    "titulo_en_cancion": "No Tengo Que Saberlo Todo",
    "moment": "Para cuando te cansas de querer tener todas las respuestas antes de dar el siguiente paso.",
    "sintiendo": "La ansiedad de quien necesita saber el final antes de empezar. El control que cuesta tanto. Y la extraña ligereza que llega cuando te permites no saber.",
    "intencion": "No te pide que confíes a ciegas. Solo que des el paso siguiente sin necesitar ver todos los demás.",
    "emocion_principal": "paz / calma",
    "tags": ["soltar el control", "incertidumbre", "proceso", "confiar", "presente", "respirar"],
    "frases_clave_editoriales": [
      "No tengo que saberlo todo para volver a respirar",
      "Hoy dejo a la vida hablar",
      "A veces el rumbo aparece cuando decide solo seguir"
    ],
    "nota_mapeo": "Coincidencia con álbum Las pequeñas cosas o Volví a escucharme. Canción sobre soltar el control y confiar en el proceso."
  },

  "respiro-y-confi-o": {
    "titulo_en_cancion": "Respiro y Confío",
    "moment": "Para cuando el único acto de valentía que puedes hacer es respirar — y confiar en que algo está en orden aunque no lo veas.",
    "sintiendo": "La dificultad de confiar cuando no tienes evidencia. El esfuerzo que cuesta soltar el control. Y el alivio pequeño pero real que llega cuando por fin lo haces.",
    "intencion": "Para que en ese momento en que todo parece incierto, puedas encontrar aunque sea un segundo de paz.",
    "emocion_principal": "paz / calma",
    "tags": ["respirar", "confiar", "incertidumbre", "calma", "fe", "soltar"],
    "frases_clave_editoriales": [
      "Respiro y todo vuelve a su lugar, la calma me vuelve a abrazar",
      "Si cierro los ojos puedo sentir que lo mejor ya viene hacia mí",
      "Descubro la paz de confiar"
    ],
    "nota_mapeo": "Coincidencia con álbum Las pequeñas cosas. Canción muy íntima, de respiración y quietud."
  },

  "si-me-escuchas-man-ana": {
    "titulo_en_cancion": "Si Me Escuchas Mañana",
    "moment": "Para cuando la noche pesa y necesitas que alguien te recuerde que mañana también existe — y que tú mereces estar en él.",
    "sintiendo": "El agotamiento de los días en que la fuerza no llega. La necesidad de que alguien te diga, aunque sea una canción, que esto también pasa.",
    "intencion": "Esta canción es ese abrazo para tus días difíciles. No promete que todo será perfecto — promete que mañana también hay luz.",
    "emocion_principal": "esperanza",
    "tags": ["noche difícil", "mañana", "esperanza", "abrazo", "fuerza", "seguir"],
    "frases_clave_editoriales": [
      "Si me escuchas mañana, no tengas miedo, la noche también termina en canción",
      "Si me escuchas mañana, todo va a estar mejor",
      "Guarda un abrazo para tus días cuando la fuerza quiera descansar"
    ],
    "nota_mapeo": "Canción única en el catálogo — orientada a acompañar en un momento difícil, no en el proceso de crecimiento. Alta coincidencia con álbum Volví a escucharme o potencial track especial."
  },

  "siempre-vuelvo-a-mi": {
    "titulo_en_cancion": "Siempre Vuelvo a Mí",
    "moment": "Para cuando el mundo intenta apagarte — y algo dentro de ti dice, otra vez: aquí sigo.",
    "sintiendo": "El cansancio de caer y levantarse y caer otra vez. Y la certeza que se gana a golpes: siempre encuentras el camino de regreso a ti misma.",
    "intencion": "Para que cuando el mundo se ponga pesado, recuerdes que siempre vuelves. Aunque cueste. Siempre.",
    "emocion_principal": "empoderamiento",
    "tags": ["resistencia", "volver a sí misma", "caídas", "fuerza", "identidad", "perseverar"],
    "frases_clave_editoriales": [
      "Siempre vuelvo a mí, siempre vuelvo aquí, cuando el mundo me quiera apagar",
      "Si me caigo me vuelvo a levantar, porque aprendí a confiar"
    ],
    "nota_mapeo": "Coincidencia con álbum Volví a escucharme o Ya no vuelvo atrás. Canción de resiliencia profunda."
  },

  "todavi-a-hay-camino": {
    "titulo_en_cancion": "Todavía Hay Camino",
    "moment": "Cuando vas manejando, pones música, miras la carretera y de repente entiendes que todavía queda luz — y que eso es suficiente para seguir.",
    "sintiendo": "La sensación de estar en movimiento sin saber exactamente hacia dónde. Y algo que empieza a cambiar: la certeza de que el camino mismo importa tanto como el destino.",
    "intencion": "Para recordarte que todavía hay camino. No hace falta tenerlo todo claro para seguir avanzando.",
    "emocion_principal": "crecimiento",
    "tags": ["camino", "proceso", "luz", "incertidumbre", "seguir", "destino"],
    "frases_clave_editoriales": [
      "Todavía hay camino, todavía queda luz",
      "No hace falta tenerlo todo para volver a creer en ti",
      "Porque entendí que lo importante nunca fue llegar"
    ],
    "nota_mapeo": "Coincidencia con álbum Volví a escucharme. Canción de proceso y camino, no de llegada."
  },

  "todo-florece-cuando-llega-su-tiempo": {
    "titulo_en_cancion": "Todo Florece Cuando Llega Su Tiempo",
    "moment": "Para cuando el calendario te presiona pero la naturaleza te recuerda en silencio que cada cosa florece exactamente cuando debe.",
    "sintiendo": "La impaciencia de quien siente que el tiempo pasa y las cosas no llegan. Y la calma que empieza a crecer cuando aceptas que lo que es tuyo no puede perderse.",
    "intencion": "Para aprender a confiar en el tiempo sin rendirse. Para entender que esperar también es crecer.",
    "emocion_principal": "paz / calma",
    "tags": ["paciencia", "timing", "florecer", "naturaleza", "confiar", "proceso"],
    "frases_clave_editoriales": [
      "Todo florece cuando llega su tiempo, como la lluvia besando el desierto",
      "Nada se pierde, nada se quedó, todo está creciendo alrededor",
      "Hoy ya no tengo miedo de esperar"
    ],
    "nota_mapeo": "Alta coincidencia con álbum Las pequeñas cosas. Posible track 2: 'Todo florece a su tiempo'."
  },

  "un-paso-ma-s": {
    "titulo_en_cancion": "Un Paso Más",
    "moment": "Para cuando el progreso parece invisible y aprendes que un solo paso también merece ser celebrado.",
    "sintiendo": "La frustración de sentir que no llegas. De comparar tu avance con algún estándar que te pesa. Y la liberación pequeña de celebrar lo que sí hiciste hoy.",
    "intencion": "Para que el paso de hoy sea suficiente. Aunque sea uno solo. Aunque nadie más lo vea.",
    "emocion_principal": "crecimiento",
    "tags": ["un paso", "progreso", "celebrar lo pequeño", "confianza", "proceso", "sin prisa"],
    "frases_clave_editoriales": [
      "Un paso más ya casi puedo llegar, cada latido me enseña a confiar",
      "Cada pequeño paso que doy hoy también merece celebración",
      "Los grandes cambios empiezan dentro del corazón"
    ],
    "nota_mapeo": "Coincidencia con álbum Volví a escucharme o Las pequeñas cosas. Canción de progreso gradual."
  },

  "volvi-a-elegirme": {
    "titulo_en_cancion": "Volví a Elegirme",
    "moment": "Para cuando apagaste el ruido, te miraste al espejo y encontraste ahí a alguien que hacía tiempo no veías.",
    "sintiendo": "El silencio extraño de volver a escucharte. De descubrir que la paz que buscabas afuera siempre estuvo esperándote adentro.",
    "intencion": "No es una declaración grande. Es simple: elegirte otra vez. Y que eso sea suficiente.",
    "emocion_principal": "empoderamiento",
    "tags": ["elegirse", "silencio", "interior", "paz", "identidad", "volver a sí misma"],
    "frases_clave_editoriales": [
      "Volví a elegirme, ya nadie me puede cambiar",
      "No es grandioso, es simple, es mi verdad",
      "Apagué el mundo por un instante, dejé que hable mi interior"
    ],
    "nota_mapeo": "Alta coincidencia con álbum Volví a escucharme. Posibles tracks: 'Volví a escucharme' (track 1), 'Ya no me escondo', 'Ahora sí soy yo'."
  },

  "volvi-a-mi": {
    "titulo_en_cancion": "Volví a Mí",
    "moment": "Para cuando dejas de caminar mirando al suelo — y te das cuenta de que tú eres tu propia revolución.",
    "sintiendo": "El fuego nuevo de quien por fin se cansó de dudar. La energía de quien entiende que la fuerza siempre estuvo ahí y decidió usarla.",
    "intencion": "Para el día que decides encenderte. No mañana. Hoy.",
    "emocion_principal": "empoderamiento",
    "tags": ["fuerza", "revolución", "encenderse", "decisión", "poder propio", "sin miedo"],
    "frases_clave_editoriales": [
      "Ya no camino mirando al suelo, hoy cada paso me hace volar",
      "La suerte cambia cuando decides que nadie te va a detener jamás",
      "Hoy soy mi fuerza, mi revolución"
    ],
    "nota_mapeo": "Alta coincidencia con álbum Ya no vuelvo atrás. Energía alta, Dancehall. Posibles tracks: 'Ya no vuelvo atrás', 'Esta soy yo', 'Más fuerte que ayer'."
  },

  "volvi-a-sonrei-r": {
    "titulo_en_cancion": "Volví a Sonreír",
    "moment": "Cuando pasas por el mismo lugar donde antes dolía y te sorprendes cantando bajito — y entiendes que algo en ti sanó sin que lo notaras.",
    "sintiendo": "La sorpresa de sanar sin darte cuenta. De pasar por un lugar cargado de memoria y descubrir que ya no pesa igual. El cuerpo que sana antes de que la mente lo procese.",
    "intencion": "Para que celebres que volviste a sonreír. Aunque sea bajito. Aunque nadie lo vea.",
    "emocion_principal": "alegría",
    "tags": ["sanar", "sorpresa", "sonreír", "memoria", "sanación", "retorno"],
    "frases_clave_editoriales": [
      "Hoy pasé por la misma calle donde un día me di caer",
      "Me sorprendí cantando bajito, sin darme cuenta empecé a reír",
      "Volví a sonreír como si fuera la primera vez",
      "Era yo quien no podía verme"
    ],
    "nota_mapeo": "Alta coincidencia con álbum Vuelvo a sentir la vida o Volví a escucharme. Posibles tracks: 'Volví a sonreír' (si existe), 'Vuelvo a sentir la vida'."
  },

  "ya-no-vuelvo-atra-s": {
    "titulo_en_cancion": "Ya No Vuelvo Atrás",
    "moment": "El día que decides que ya no le pides permiso a nadie — ni a quien se fue, ni al miedo — para ser exactamente quien eres.",
    "sintiendo": "Esa mezcla de alivio y euforia que llega cuando dejas de pedirle permiso a alguien que ya no está. El cuerpo que quiere moverse. La certeza de que esto ya no tiene vuelta atrás.",
    "intencion": "No está aquí para que llores lo que perdiste. Está para que bailes lo que ya eres.",
    "emocion_principal": "empoderamiento",
    "tags": ["empoderamiento", "baile", "liberación", "decisión", "autosuficiencia", "sin permiso"],
    "frases_clave_editoriales": [
      "Desperté bailando con el sol, dejé las penas bajo el colchón",
      "Ya no le pide permiso al corazón",
      "Todo lo que un día me dolió se convirtió en mi mejor canción",
      "La felicidad siempre estuvo en mi voz"
    ],
    "nota_mapeo": "Coincidencia directa con álbum 'Ya no vuelvo atrás', track 1 del mismo nombre. Confianza: muy alta."
  },

  "ya-puedes-descansar": {
    "titulo_en_cancion": "Todo Empieza Hoy",
    "moment": "Para cuando la mañana llega en silencio y algo en ti sabe, antes de que la mente despierte, que hoy algo florece aunque todavía no puedas nombrarlo.",
    "sintiendo": "La quietud frágil de un nuevo comienzo que todavía no hace ruido. No entusiasmo todavía. Solo la sensación suave de que algo está despertando dentro de ti.",
    "intencion": "Para los comienzos que no anuncian. Para los días en que todavía no lo ves pero ya puedes sentirlo.",
    "emocion_principal": "paz / calma",
    "tags": ["nuevo comienzo", "silencio", "despertar", "fe", "florecer", "hoy"],
    "frases_clave_editoriales": [
      "Todo empieza hoy, aunque todavía no lo vea",
      "Ya puedo sentir que algo va a florecer",
      "Ya no tengo miedo de volver a creer",
      "Lo que hoy parece quieto también está aprendiendo a despertar"
    ],
    "nota_mapeo": "⚠️ DISCREPANCIA: el nombre del archivo es 'Ya Puedes Descansar' pero el coro de la canción dice 'Todo Empieza Hoy'. Título probable en el catálogo: 'Hoy empieza todo' (track 11 de Volví a escucharme). Confianza: alta. Verificar con la artista."
  }

}

def apply_editorial():
  files = [f for f in os.listdir(OUTPUT_DIR) if f.endswith('.json') and f != '_index.json']
  updated = 0
  for fname in files:
    slug = fname.replace('.json','')
    if slug not in EDITORIAL:
      print(f"  ⚠ Sin editorial definido para: {slug}")
      continue
    path = os.path.join(OUTPUT_DIR, fname)
    with open(path, 'r', encoding='utf-8') as f:
      data = json.load(f)
    ed = EDITORIAL[slug]
    data['titulo_en_cancion']       = ed.get('titulo_en_cancion')
    data['moment']                  = ed.get('moment')
    data['sintiendo']               = ed.get('sintiendo')
    data['intencion']               = ed.get('intencion')
    data['emocion_principal']       = ed.get('emocion_principal', data.get('emocion_principal'))
    data['tags']                    = ed.get('tags', data.get('tags', []))
    data['frases_clave_editoriales']= ed.get('frases_clave_editoriales', [])
    data['nota_mapeo']              = ed.get('nota_mapeo')
    data['estado_editorial']        = 'borrador — pendiente revisión'
    with open(path, 'w', encoding='utf-8') as f:
      json.dump(data, f, ensure_ascii=False, indent=2)
    updated += 1
    print(f"  ✅ {slug}")

  print(f"\n{updated} canciones actualizadas con borradores editoriales.")

if __name__ == '__main__':
  print("Aplicando borradores editoriales...\n")
  apply_editorial()
