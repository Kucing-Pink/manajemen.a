import json, shutil

with open('questions_raw.json', 'r', encoding='utf-8') as f:
    qs = json.load(f)

dest = r'c:\Users\A\Latihan Soal Ujian\ujian-online\questions\econ4102.json'
with open(dest, 'w', encoding='utf-8') as f:
    json.dump(qs, f, ensure_ascii=False, indent=2)

print(f'Saved {len(qs)} questions to {dest}')
