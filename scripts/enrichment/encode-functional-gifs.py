"""Package licensed photo pairs as GIF sequences. Requires Pillow 12.3.0."""
import json
from pathlib import Path
from PIL import Image, ImageOps

selection = json.loads(Path('scripts/enrichment/functional-selection.json').read_text(encoding='utf-8'))
out = Path('public/exercise-media/functional')
for exercise_id, *_ in selection:
    frames = []
    for index in range(2):
        with Image.open(f'temp/functional-frames/{exercise_id}-{index}.jpg') as source:
            photo = ImageOps.contain(source.convert('RGB'), (400, 400))
            canvas = Image.new('RGB', (400, 400), 'white')
            canvas.paste(photo, ((400-photo.width)//2, (400-photo.height)//2))
            frames.append(canvas)
    frames[0].save(out / f'{exercise_id}.jpg', quality=85)
    frames[0].save(out / f'{exercise_id}.gif', save_all=True, append_images=frames[1:],
                   duration=1200, loop=0, disposal=2, optimize=False)
    with Image.open(out / f'{exercise_id}.gif') as check:
        assert check.n_frames == 2, f'{exercise_id}: GIF must contain two positions'
