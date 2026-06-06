import json

with open('questions_raw.json', 'r', encoding='utf-8') as f:
    qs = json.load(f)

fixed = []
for q in qs:
    fixed.append({
        'id': q['id'],
        'question': q['question'].replace('\u0000', '').strip(),
        'options': [o.replace('\u0000', '').strip() for o in q['options']],
        'answer': q['answer']
    })

with open('questions_raw.json', 'w', encoding='utf-8') as f:
    json.dump(fixed, f, ensure_ascii=False, indent=2)

print(f'Total: {len(fixed)} soal')
bad = [q['id'] for q in fixed if q['answer'] == -1]
print(f'Soal dengan jawaban tidak terdeteksi: {bad}')
