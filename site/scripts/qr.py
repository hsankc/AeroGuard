"""Küçük QR kodlayıcı: sürüm 3, hata düzeltme M, bayt kipi. Sonucu kendi okuyucusuyla doğrular."""
import sys

URL = sys.argv[1] if len(sys.argv) > 1 else 'https://aeroguard-tsaa.vercel.app'
OUT = sys.argv[2] if len(sys.argv) > 2 else None
VER, SIZE, DATA_CW, EC_CW = 3, 29, 44, 26
ECL_BITS = 0  # M

EXP = [0] * 512
LOG = [0] * 256
x = 1
for i in range(255):
    EXP[i] = x
    LOG[x] = i
    x <<= 1
    if x & 0x100:
        x ^= 0x11D
for i in range(255, 512):
    EXP[i] = EXP[i - 255]


def mul(a, b):
    return 0 if a == 0 or b == 0 else EXP[LOG[a] + LOG[b]]


def rs_gen(n):
    g = [1]
    for i in range(n):
        ng = [0] * (len(g) + 1)
        for j, c in enumerate(g):
            ng[j] ^= c
            ng[j + 1] ^= mul(c, EXP[i])
        g = ng
    return g


def rs_ec(data, n):
    g = rs_gen(n)
    msg = list(data) + [0] * n
    for i in range(len(data)):
        c = msg[i]
        if c:
            for j in range(1, len(g)):
                msg[i + j] ^= mul(g[j], c)
    return msg[len(data):]


# Thonky "HELLO WORLD" 1-M test vektörü
assert rs_ec([32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17], 10) == [196, 35, 39, 119, 235, 215, 231, 226, 93, 23]


def format_bits(mask):
    data = ECL_BITS << 3 | mask
    rem = data
    for _ in range(10):
        rem = (rem << 1) ^ ((rem >> 9) * 0x537)
    return (data << 10 | rem) ^ 0x5412


assert format(format_bits(0), '015b') == '101010000010010'  # M, maske 0

# veri bitleri
raw = URL.encode('utf-8')
bits = [0, 1, 0, 0] + [int(b) for b in format(len(raw), '08b')]
for byte in raw:
    bits += [int(b) for b in format(byte, '08b')]
cap = DATA_CW * 8
assert len(bits) <= cap, 'sürüm 3-M için uzun'
bits += [0] * min(4, cap - len(bits))
bits += [0] * (-len(bits) % 8)
data = [int(''.join(map(str, bits[i:i + 8])), 2) for i in range(0, len(bits), 8)]
pad = [0xEC, 0x11]
while len(data) < DATA_CW:
    data.append(pad[(len(data) - len(bits) // 8) % 2])
codewords = data + rs_ec(data, EC_CW)

# matris: m[y][x], f[y][x] işlev modülü
m = [[False] * SIZE for _ in range(SIZE)]
f = [[False] * SIZE for _ in range(SIZE)]


def setf(x, y, dark):
    m[y][x] = dark
    f[y][x] = True


for i in range(SIZE):
    setf(6, i, i % 2 == 0)
    setf(i, 6, i % 2 == 0)


def finder(cx, cy):
    for dy in range(-4, 5):
        for dx in range(-4, 5):
            xx, yy = cx + dx, cy + dy
            if 0 <= xx < SIZE and 0 <= yy < SIZE:
                d = max(abs(dx), abs(dy))
                setf(xx, yy, d not in (2, 4))


def align(cx, cy):
    for dy in range(-2, 3):
        for dx in range(-2, 3):
            setf(cx + dx, cy + dy, max(abs(dx), abs(dy)) != 1)


finder(3, 3)
finder(SIZE - 4, 3)
finder(3, SIZE - 4)
align(22, 22)


def draw_format(mask):
    b = format_bits(mask)
    bit = lambda i: (b >> i) & 1 == 1
    for i in range(6):
        setf(8, i, bit(i))
    setf(8, 7, bit(6))
    setf(8, 8, bit(7))
    setf(7, 8, bit(8))
    for i in range(9, 15):
        setf(14 - i, 8, bit(i))
    for i in range(8):
        setf(SIZE - 1 - i, 8, bit(i))
    for i in range(8, 15):
        setf(8, SIZE - 15 + i, bit(i))
    setf(8, SIZE - 8, True)


draw_format(0)  # yer ayır


def zigzag():
    right = SIZE - 1
    while right >= 1:
        if right == 6:
            right = 5
        for vert in range(SIZE):
            for j in range(2):
                xx = right - j
                upward = ((right + 1) & 2) == 0
                yy = SIZE - 1 - vert if upward else vert
                if not f[yy][xx]:
                    yield xx, yy
        right -= 2


cells = list(zigzag())
assert len(cells) == 70 * 8 + 7, len(cells)
for i, (xx, yy) in enumerate(cells):
    if i < len(codewords) * 8:
        m[yy][xx] = (codewords[i >> 3] >> (7 - (i & 7))) & 1 == 1

MASKS = [
    lambda x, y: (x + y) % 2 == 0,
    lambda x, y: y % 2 == 0,
    lambda x, y: x % 3 == 0,
    lambda x, y: (x + y) % 3 == 0,
    lambda x, y: (x // 3 + y // 2) % 2 == 0,
    lambda x, y: x * y % 2 + x * y % 3 == 0,
    lambda x, y: (x * y % 2 + x * y % 3) % 2 == 0,
    lambda x, y: ((x + y) % 2 + x * y % 3) % 2 == 0,
]


def apply_mask(k):
    for yy in range(SIZE):
        for xx in range(SIZE):
            if not f[yy][xx] and MASKS[k](xx, yy):
                m[yy][xx] = not m[yy][xx]


def penalty():
    p = 0
    lines = [row[:] for row in m] + [[m[y][x] for y in range(SIZE)] for x in range(SIZE)]
    for ln in lines:
        run = 1
        for i in range(1, SIZE + 1):
            if i < SIZE and ln[i] == ln[i - 1]:
                run += 1
            else:
                if run >= 5:
                    p += 3 + run - 5
                run = 1
        s = ''.join('1' if v else '0' for v in ln)
        p += 40 * (s.count('10111010000') + s.count('00001011101'))
    for y in range(SIZE - 1):
        for x in range(SIZE - 1):
            if m[y][x] == m[y][x + 1] == m[y + 1][x] == m[y + 1][x + 1]:
                p += 3
    dark = sum(sum(r) for r in m)
    total = SIZE * SIZE
    k = (abs(dark * 20 - total * 10) + total - 1) // total - 1
    return p + max(0, k) * 10


best = None
for k in range(8):
    apply_mask(k)
    draw_format(k)
    sc = penalty()
    if best is None or sc < best[0]:
        best = (sc, k)
    apply_mask(k)
mask = best[1]
apply_mask(mask)
draw_format(mask)

# --- doğrulama: matristen geri oku ---
fb = 0
for i in range(6):
    fb |= m[i][8] << i
fb |= m[7][8] << 6
fb |= m[8][8] << 7
fb |= m[8][7] << 8
for i in range(9, 15):
    fb |= m[8][14 - i] << i
fb2 = 0
for i in range(8):
    fb2 |= m[8][SIZE - 1 - i] << i
for i in range(8, 15):
    fb2 |= m[SIZE - 15 + i][8] << i
assert fb == fb2 == format_bits(mask)
dec_mask = ((fb ^ 0x5412) >> 10) & 7
assert dec_mask == mask
got = []
for i, (xx, yy) in enumerate(cells[:70 * 8]):
    v = m[yy][xx] ^ MASKS[dec_mask](xx, yy)
    got.append(1 if v else 0)
cw = [int(''.join(map(str, got[i:i + 8])), 2) for i in range(0, len(got), 8)]
# sendrom: tüm a^i köklerinde sıfır olmalı
for i in range(EC_CW):
    acc = 0
    for c in cw:
        acc = mul(acc, EXP[i]) ^ c
    assert acc == 0, 'RS sendromu sıfır değil'
bs = ''.join(format(c, '08b') for c in cw[:DATA_CW])
assert bs[:4] == '0100'
n = int(bs[4:12], 2)
text = bytes(int(bs[12 + 8 * i:20 + 8 * i], 2) for i in range(n)).decode('utf-8')
assert text == URL, text
# işlev desenlerinin konumu: sol üst bulucu ve zamanlama
assert all(m[0][x] for x in range(7)) and not m[7][0] and m[6][8] and not m[6][7] and m[SIZE - 8][8]

path = ''.join(f'M{x} {y}h1v1h-1z' for y in range(SIZE) for x in range(SIZE) if m[y][x])
print('mask', mask, 'penalty', best[0], 'decoded', text, 'path', len(path))
if OUT:
    open(OUT, 'w', encoding='utf-8').write(
        "// scripts/qr.py ile üretildi (sürüm 3-M, bayt kipi). Adres değişirse: python scripts/qr.py <adres> src/present/qr.ts\n"
        f"export const QR_URL = '{URL}'\nexport const QR_SIZE = {SIZE}\nexport const QR_PATH =\n  '{path}'\n")
for y in range(SIZE):
    print(''.join('##' if m[y][x] else '  ' for x in range(SIZE)))
