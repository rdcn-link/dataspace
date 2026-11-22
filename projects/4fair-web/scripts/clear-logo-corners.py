from collections import deque
from pathlib import Path

from PIL import Image

src = Path(__file__).resolve().parents[1] / 'src' / 'assets' / 'img' / 'fairspace-logo.png'
img = Image.open(src).convert('RGBA')
w, h = img.size
px = img.load()


def is_white(c, thr=240):
    r, g, b, a = c
    return a > 200 and r >= thr and g >= thr and b >= thr


visited = [[False] * h for _ in range(w)]
q = deque()
for x, y in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
    if is_white(px[x, y]):
        q.append((x, y))
        visited[x][y] = True

dirs = [(1, 0), (-1, 0), (0, 1), (0, -1)]
while q:
    x, y = q.popleft()
    px[x, y] = (255, 255, 255, 0)
    for dx, dy in dirs:
        nx, ny = x + dx, y + dy
        if 0 <= nx < w and 0 <= ny < h and not visited[nx][ny] and is_white(px[nx, ny]):
            visited[nx][ny] = True
            q.append((nx, ny))

# clear near-white fringe next to transparent
for x in range(w):
    for y in range(h):
        r, g, b, a = px[x, y]
        if not a or r < 230 or g < 230 or b < 230:
            continue
        for dx, dy in dirs:
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] == 0:
                px[x, y] = (r, g, b, 0)
                break

outs = [
    src,
    Path(__file__).resolve().parents[1] / 'public' / 'fairspace-logo.png',
]
for p in outs:
    img.save(p, 'PNG')
    print(f'saved {p} ({w}x{h})')
