"""Декодирование номера с учётом формата узбекских номеров.

OCR выдаёт для каждой из N позиций вероятности символов. Обычный argmax на позиции цифры может
выбрать букву (0→G, 5→S). Здесь для каждого допустимого шаблона берём на каждой позиции лучший
символ ИЗ РАЗРЕШЁННОГО класса (цифра/буква) и выбираем шаблон с наибольшей суммарной вероятностью.

Шаблоны (D — цифра, L — буква):
  A: DD L DDD LL   физлица      50A123BC
  B: DD DDD LLL    юрлица       50123ABC
  C: DD L DDDDDD   совместные предприятия (зелёный номер)  01M017910
"""
import math

import numpy as np

TEMPLATES = {"A": "DDLDDDLL", "B": "DDDDDLLL", "C": "DDLDDDDDD"}
# Шаблон из этого набора берём, только если сама модель выдаёт на его последней позиции символ (не pad), то есть
# «видит» столько знаков. Иначе редкий длинный шаблон C перетягивает обычные номера, где модель путает O и 0
# (без гейта на эталоне терялись верные 50A798OO и 50D050OO)
STRICT_LENGTH = {"C"}
# Коды регионов Узбекистана; 2 первые цифры номера должны быть из этого набора
REGIONS = ("01", "10", "20", "25", "30", "40", "50", "60", "70", "75", "80", "85", "90", "95")
# Ниже этой доли вероятности символ считается «не прочитан» (используется для флага уверенности)
EPS = 1e-9


def _classes(alphabet: str, pad: str):
    digits = [i for i, c in enumerate(alphabet) if c.isdigit()]
    letters = [i for i, c in enumerate(alphabet) if c.isalpha()]
    return digits, letters, alphabet.index(pad)


def decode_constrained(probs: np.ndarray, alphabet: str, pad: str = "_", regions=REGIONS, templates=TEMPLATES):
    """probs: (slots, vocab). Возвращает (plate, score, template_name) или None, если ни один шаблон не подошёл.

    score — средняя вероятность выбранных символов (0..1), годится как уверенность.
    """
    slots = probs.shape[0]
    digits, letters, pad_idx = _classes(alphabet, pad)
    logp = np.log(np.clip(probs, EPS, 1.0))
    best = None

    for name, tpl in templates.items():
        if len(tpl) > slots:
            continue
        if name in STRICT_LENGTH and alphabet[int(probs[len(tpl) - 1].argmax())] == pad:
            continue
        total, chars, ok = 0.0, [], True
        for pos, kind in enumerate(tpl):
            allowed = digits if kind == "D" else letters
            idx = max(allowed, key=lambda i: logp[pos, i])
            total += logp[pos, idx]
            chars.append(alphabet[idx])
        # после номера модель должна выдавать pad — штрафуем шаблон, если она «хочет» ещё символы
        for pos in range(len(tpl), slots):
            total += logp[pos, pad_idx]

        plate = "".join(chars)
        # Регион: если первые 2 цифры не из списка — берём лучший допустимый регион по вероятности
        if regions and plate[:2] not in regions:
            cand = max(
                regions,
                key=lambda r: logp[0, alphabet.index(r[0])] + logp[1, alphabet.index(r[1])],
            )
            total += (logp[0, alphabet.index(cand[0])] + logp[1, alphabet.index(cand[1])]) - (
                logp[0, alphabet.index(plate[0])] + logp[1, alphabet.index(plate[1])]
            )
            plate = cand + plate[2:]

        if best is None or total > best[1]:
            best = (plate, total, name)

    if best is None:
        return None
    plate, total, name = best
    n = len(templates[name])
    return plate, math.exp(total / (n + max(0, slots - n))), name
