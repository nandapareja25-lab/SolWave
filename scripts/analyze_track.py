#!/usr/bin/env python3
"""
Solwave — Pipeline editorial de audio
Uso: python3 analyze_track.py <archivo.mp3>
      python3 analyze_track.py --all   (procesa toda la carpeta MUSIC_DIR)

Genera para cada canción:
  - Transcripción completa (Whisper small)
  - Metadata acústica (duración, BPM, tonalidad, energía)
  - Objeto editorial listo para revisión humana
  - Salida en JSON individual por canción
"""

import sys, os, json, subprocess, warnings
warnings.filterwarnings("ignore")

MUSIC_DIR = "/Users/mariafernandapareja/Desktop/SOLWAVES MUSIC"
OUTPUT_DIR = "/Users/mariafernandapareja/Desktop/Claude App Nueva/Solwave/scripts/editorial"

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── Utilidades ───────────────────────────────────────────────────────────────

def slug(name):
    import re
    return re.sub(r'[^a-z0-9]+', '-', name.lower().replace('+', '-')).strip('-')

def format_duration(seconds):
    m, s = int(seconds // 60), int(seconds % 60)
    return f"{m}:{s:02d}"

# ── Metadata acústica ────────────────────────────────────────────────────────

def get_acoustic_metadata(filepath):
    """ffprobe + librosa para duración, BPM, tonalidad, energía."""
    result = {}

    # Duración y bitrate via ffprobe
    probe = subprocess.run(
        ['ffprobe', '-v', 'quiet', '-show_entries', 'format=duration,bit_rate',
         '-of', 'json', filepath],
        capture_output=True, text=True
    )
    fmt = json.loads(probe.stdout).get('format', {})
    duration_s = float(fmt.get('duration', 0))
    result['duration_s']  = round(duration_s, 2)
    result['duration_fmt'] = format_duration(duration_s)
    result['bitrate_kbps'] = round(int(fmt.get('bit_rate', 0)) / 1000)

    # BPM, tonalidad, energía via librosa
    try:
        import librosa, numpy as np
        y, sr = librosa.load(filepath, sr=22050, mono=True)

        # BPM
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        result['bpm'] = round(float(tempo[0]) if hasattr(tempo, '__len__') else float(tempo))

        # Tonalidad (chroma → nota + modo)
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        notes  = ['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B']
        root   = notes[int(chroma.mean(axis=1).argmax())]

        # Modo mayor/menor via Krumhansl-Schmuckler simplificado
        major_profile = [6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88]
        minor_profile = [6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17]
        chroma_mean = chroma.mean(axis=1)
        chroma_norm = chroma_mean / (chroma_mean.sum() + 1e-8)
        # rotar al root y comparar con perfiles
        root_idx = int(chroma.mean(axis=1).argmax())
        rotated  = np.roll(chroma_norm, -root_idx)
        maj_corr = np.corrcoef(rotated, major_profile)[0,1]
        min_corr = np.corrcoef(rotated, minor_profile)[0,1]
        mode     = 'mayor' if maj_corr > min_corr else 'menor'
        result['key'] = f"{root} {mode}"

        # Energía RMS normalizada → etiqueta
        rms = float(librosa.feature.rms(y=y).mean())
        if rms > 0.08:
            energy = 'alta'
        elif rms > 0.04:
            energy = 'media'
        else:
            energy = 'baja'
        result['energy'] = energy
        result['rms_raw'] = round(rms, 4)

        # Spectral brightness (para estimar si es brillante/oscura)
        spec_centroid = float(librosa.feature.spectral_centroid(y=y, sr=sr).mean())
        result['brightness'] = 'brillante' if spec_centroid > 2500 else 'cálida'

    except Exception as e:
        result['librosa_error'] = str(e)

    return result

# ── Transcripción ────────────────────────────────────────────────────────────

_model_cache = {}

def transcribe(filepath, model_name='small'):
    """Transcribe con Whisper. Cachea el modelo entre llamadas."""
    if model_name not in _model_cache:
        import whisper
        print(f"  Cargando modelo Whisper '{model_name}'...")
        _model_cache[model_name] = whisper.load_model(model_name)
    model = _model_cache[model_name]
    result = model.transcribe(filepath, language='es', verbose=False)
    return {
        'text': result['text'].strip(),
        'segments': [
            {'start': round(s['start'], 2), 'end': round(s['end'], 2), 'text': s['text'].strip()}
            for s in result['segments']
        ]
    }

# ── Análisis editorial (heurístico) ─────────────────────────────────────────

def detect_title_from_lyrics(text):
    """Detecta el título probable buscando la frase más repetida (> 2 veces)."""
    import re
    from collections import Counter
    lines = [l.strip() for l in text.split('\n') if len(l.strip()) > 8]
    # también dividir por puntos y comas
    phrases = []
    for line in lines:
        for part in re.split(r'[,.!?]', line):
            p = part.strip()
            if 6 < len(p) < 60:
                phrases.append(p.lower())
    counts = Counter(phrases)
    most_common = counts.most_common(3)
    candidates = [p.title() for p, c in most_common if c >= 2]
    return candidates if candidates else []

def extract_key_phrases(text, n=8):
    """Extrae las frases más significativas de la letra."""
    import re
    lines = [l.strip() for l in re.split(r'[.!?\n]', text) if len(l.strip()) > 15]
    # Priorizar frases con pronombres en primera persona o emociones clave
    keywords = ['ya no','nunca','siempre','libre','vuelvo','puedo','soy','aprendí',
                'me elegí','decidí','miedo','amor','sola','fuerza','camino','hoy']
    scored = []
    for line in lines:
        score = sum(1 for k in keywords if k in line.lower())
        if score > 0:
            scored.append((score, line.strip()))
    scored.sort(reverse=True)
    top = [l for _, l in scored[:n]]
    if len(top) < n:
        top += [l for l in lines if l not in top][:n - len(top)]
    return top[:n]

def detect_genre_from_audio(acoustic):
    """Heurística de género basada en BPM y energía."""
    bpm   = acoustic.get('bpm', 0)
    energy = acoustic.get('energy', 'media')
    brightness = acoustic.get('brightness', 'cálida')

    if 65 <= bpm <= 100 and energy in ('baja', 'media'):
        return 'Bachata / Balada'
    elif 100 <= bpm <= 130 and energy == 'alta':
        return 'Dancehall / Pop Latino'
    elif bpm < 90 and energy == 'baja' and brightness == 'cálida':
        return 'Indie Folk / Acústico'
    elif 85 <= bpm <= 110 and brightness == 'brillante':
        return 'Pop / Pop Soul'
    elif bpm > 130:
        return 'Salsa / Tropical'
    else:
        return 'Pop / Canción de autor'

EMOTION_KEYWORDS = {
    'desamor':         ['me fuiste','ya no estás','te perdí','te fuiste','te vas','me dejaste','extraño','duele'],
    'empoderamiento':  ['ya no vuelvo','me elegí','libre','sin permiso','soy más','nadie me','puedo sola'],
    'crecimiento':     ['aprendí','crecí','entendí','proceso','me escuché','soy suficiente','hoy sé','ya sé'],
    'paz / calma':     ['respiro','tranquila','calma','despacio','florece','pequeño','presente','hogar'],
    'amor sano':       ['contigo','llegaste','qué suerte','mi lugar','eres mi','si es contigo','toda la vida'],
    'alegría':         ['bailar','celebro','vuelvo a','sonrío','la vida','qué bonito','alegría','sol'],
    'nostalgia':       ['recuerdo','antes','tiempo','lo que fue','ya no es','extraño','años','memoria'],
    'liberación':      ['libre','solté','me fui','atrás quedó','ya no cargo','sin miedo'],
}

def detect_emotions(text):
    text_lower = text.lower()
    scores = {}
    for emotion, words in EMOTION_KEYWORDS.items():
        score = sum(1 for w in words if w in text_lower)
        if score > 0:
            scores[emotion] = score
    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    primary   = ranked[0][0] if ranked else 'indefinida'
    secondary = [e for e, _ in ranked[1:4]]
    return primary, secondary

def generate_tags(text, acoustic, primary_emotion):
    """Genera tags de búsqueda relevantes."""
    tag_map = {
        'desamor':        ['desamor', 'ruptura', 'cierre', 'soltar'],
        'empoderamiento': ['empoderamiento', 'fuerza', 'independencia', 'decisión'],
        'crecimiento':    ['crecimiento', 'autoestima', 'proceso', 'autoconocimiento'],
        'paz / calma':    ['calma', 'gratitud', 'presente', 'cotidiano'],
        'amor sano':      ['amor sano', 'llegada', 'tranquilidad', 'confianza'],
        'alegría':        ['alegría', 'celebración', 'baile', 'retorno'],
        'nostalgia':      ['nostalgia', 'memoria', 'pasado', 'duelo'],
        'liberación':     ['liberación', 'soltar', 'libertad', 'alivio'],
    }
    tags = tag_map.get(primary_emotion, [])

    # Tags acústicos
    bpm = acoustic.get('bpm', 0)
    if bpm > 120: tags.append('energía alta')
    elif bpm < 85: tags.append('ritmo lento')
    if acoustic.get('energy') == 'alta': tags.append('intenso')
    if acoustic.get('energy') == 'baja': tags.append('íntimo')
    if 'menor' in acoustic.get('key', ''): tags.append('tonalidad oscura')

    # Tags de letra
    text_l = text.lower()
    if any(w in text_l for w in ['bailar','baila','siente','muévete']): tags.append('para bailar')
    if any(w in text_l for w in ['lloro','lágrimas','duele']): tags.append('para llorar')
    if any(w in text_l for w in ['sola','soledad','sin ti']): tags.append('soledad')
    if any(w in text_l for w in ['mañana','hoy','nuevo']): tags.append('nuevo comienzo')

    return list(dict.fromkeys(tags))  # deduplicar manteniendo orden

# ── Objeto editorial completo ────────────────────────────────────────────────

def build_editorial_object(filepath):
    filename = os.path.basename(filepath)
    clean_name = filename.replace('+', ' ').replace('.mp3', '')
    print(f"\n{'─'*60}")
    print(f"  Analizando: {clean_name}")
    print(f"{'─'*60}")

    # 1. Metadata acústica
    print("  → Metadata acústica...")
    acoustic = get_acoustic_metadata(filepath)
    print(f"     Duración: {acoustic['duration_fmt']} · BPM: {acoustic.get('bpm','?')} · "
          f"Tonalidad: {acoustic.get('key','?')} · Energía: {acoustic.get('energy','?')}")

    # 2. Transcripción
    print("  → Transcribiendo con Whisper small...")
    transcription = transcribe(filepath)
    text = transcription['text']
    word_count = len(text.split())
    print(f"     {word_count} palabras transcritas.")

    # 3. Análisis editorial
    print("  → Análisis editorial...")
    title_candidates = detect_title_from_lyrics(text)
    key_phrases      = extract_key_phrases(text)
    primary_emotion, secondary_emotions = detect_emotions(text)
    genre_hint       = detect_genre_from_audio(acoustic)
    tags             = generate_tags(text, acoustic, primary_emotion)

    # 4. Campos que requieren revisión humana (marcados con [DRAFT])
    editorial = {
        "archivo_original": filename,
        "nombre_limpio": clean_name,
        "duracion": acoustic['duration_fmt'],
        "bpm": acoustic.get('bpm'),
        "tonalidad": acoustic.get('key'),
        "energia": acoustic.get('energy'),
        "brillo": acoustic.get('brightness'),
        "bitrate_kbps": acoustic.get('bitrate_kbps'),
        "genero_detectado": genre_hint,
        "emocion_principal": primary_emotion,
        "emociones_secundarias": secondary_emotions,
        "titulo_detectado_en_letra": title_candidates,
        "tags": tags,
        "frases_clave": key_phrases,
        "letra_completa": text,
        "segmentos": transcription['segments'],

        # ── Campos editoriales (DRAFT — requieren revisión humana) ──
        "moment": "[DRAFT — revisar]",
        "sintiendo": "[DRAFT — revisar]",
        "intencion": "[DRAFT — revisar]",
        "historia": None,
        "inspirada": None,
        "inspiradaPrivacy": "name",

        # ── Mapeo al catálogo (a completar después) ──
        "album_probable": None,
        "track_probable": None,
        "confianza_mapeo": None,
        "notas_mapeo": None,

        "pipeline_version": "1.0",
        "modelo_whisper": "small",
    }

    return editorial

# ── Ejecución ────────────────────────────────────────────────────────────────

def process_file(filepath):
    obj = build_editorial_object(filepath)
    out_path = os.path.join(OUTPUT_DIR, slug(obj['nombre_limpio']) + '.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
    print(f"  ✅ Guardado: {out_path}")
    return obj

def process_all():
    mp3_files = sorted([
        os.path.join(MUSIC_DIR, f)
        for f in os.listdir(MUSIC_DIR)
        if f.endswith('.mp3')
    ])
    print(f"\n🎵 Solwave Editorial Pipeline v1.0")
    print(f"   {len(mp3_files)} canciones encontradas en {MUSIC_DIR}")
    print(f"   Resultados en: {OUTPUT_DIR}\n")

    results = []
    for i, fp in enumerate(mp3_files, 1):
        print(f"\n[{i}/{len(mp3_files)}]", end='')
        obj = process_file(fp)
        results.append({k: obj[k] for k in [
            'nombre_limpio','duracion','bpm','tonalidad','energia',
            'emocion_principal','genero_detectado','titulo_detectado_en_letra',
            'tags', 'moment', 'sintiendo', 'intencion'
        ]})

    # Índice global
    index_path = os.path.join(OUTPUT_DIR, '_index.json')
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump({'total': len(results), 'canciones': results}, f, ensure_ascii=False, indent=2)
    print(f"\n\n✅ Pipeline completo. {len(results)} canciones procesadas.")
    print(f"   Índice global: {index_path}")

if __name__ == '__main__':
    if '--all' in sys.argv or len(sys.argv) == 1:
        process_all()
    else:
        for arg in sys.argv[1:]:
            if arg.endswith('.mp3') and os.path.exists(arg):
                process_file(arg)
            else:
                print(f"Archivo no encontrado: {arg}")
