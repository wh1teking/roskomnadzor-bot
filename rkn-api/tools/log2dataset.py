import re
import csv
import json

# ЕСЛИ НАДО - ЗАМЕНИТЕ НА СВОЕ
input_file = 'analyze.txt'
output_csv = 'dataset.csv'
output_jsonl = 'dataset.jsonl'

messages = []

with open(input_file, encoding='utf-8') as f:
    for line in f:
        if line.startswith('===') or line.strip() == '':
            continue
        match = re.match(r'\[(\d{2}:\d{2}:\d{2})\] (.+)', line)
        if match:
            time, text = match.groups()
            messages.append({'time': time, 'text': text.strip()})

with open(output_csv, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['time', 'text', 'label'])
    writer.writeheader()
    for msg in messages:
        msg['label'] = ''
        writer.writerow(msg)

with open(output_jsonl, 'w', encoding='utf-8') as f:
    for msg in messages:
        msg['label'] = ''
        f.write(json.dumps(msg, ensure_ascii=False) + '\n')

print(f'Готово! Сохранено {len(messages)} сообщений в {output_csv} и {output_jsonl}')
