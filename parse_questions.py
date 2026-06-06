import zipfile
import xml.etree.ElementTree as ET
import json

docx_path = r'c:\Users\A\Latihan Soal Ujian\Pengantar Ekonomi Mikro ECON4102.docx'
output_path = r'c:\Users\A\Latihan Soal Ujian\questions_raw.json'

with zipfile.ZipFile(docx_path, 'r') as z:
    with z.open('word/document.xml') as f:
        tree = ET.parse(f)

root = tree.getroot()
paragraphs = []
for para in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
    texts = []
    for r in para.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'):
        if r.text:
            texts.append(r.text)
    text = ''.join(texts).strip()
    if text:
        paragraphs.append(text)

print(f"Total paragraphs: {len(paragraphs)}")

# Parse soal: deteksi pola soal, pilihan A/B/C/D, dan Jawaban
def starts_with_option(text, letter):
    return text.startswith(f'{letter}.') or text.startswith(f'{letter} ')

questions = []
i = 0
while i < len(paragraphs):
    p = paragraphs[i]
    if i+4 < len(paragraphs):
        nxt = [paragraphs[i+j].strip() for j in range(1, 5)]
        if (starts_with_option(nxt[0], 'A') and
            starts_with_option(nxt[1], 'B') and
            starts_with_option(nxt[2], 'C') and
            starts_with_option(nxt[3], 'D')):
            q_text = p
            # Clean option text (remove leading "A." or "A ")
            def clean_opt(txt):
                return txt[2:].strip() if len(txt) > 2 else txt
            options = [clean_opt(nxt[j]) for j in range(4)]
            answer_idx = -1
            if i+5 < len(paragraphs) and 'Jawaban' in paragraphs[i+5]:
                ans_raw = paragraphs[i+5].replace('Jawaban:', '').strip()
                ans_map = {'A': 0, 'B': 1, 'C': 2, 'D': 3}
                answer_idx = ans_map.get(ans_raw[0].upper(), -1)
                i += 6
            else:
                i += 5
            questions.append({
                'id': len(questions) + 1,
                'question': q_text,
                'options': options,
                'answer': answer_idx
            })
            continue
    i += 1

print(f"Total soal ditemukan: {len(questions)}")

# Preview 3 soal pertama
for idx, q in enumerate(questions[:3]):
    print(f"\n--- Soal {q['id']} ---")
    print(f"Q: {q['question']}")
    for j, opt in enumerate(q['options']):
        print(f"  {chr(65+j)}. {opt}")
    print(f"  Jawaban: {chr(65+q['answer'])}")

with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print(f"\nFile JSON disimpan ke: {output_path}")
