from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

model = AutoModelForSequenceClassification.from_pretrained('./rkn-api_model')
total_params = sum(p.numel() for p in model.parameters())
print(f'Всего параметров: {total_params:,}')

tokenizer = AutoTokenizer.from_pretrained('./rkn-api_model')

labels = {
    0: 'норма',
    1: 'банворды (мат/оскорбления)',
    2: 'реклама',
    3: 'реклама читов',
    4: 'скам/раздачи',
    5: 'подстрекательство',
    6: 'оскорбление сервера',
    7: 'попрошайничество',
    8: 'другое нарушение'
}

def predict(text):
    inputs = tokenizer(text, return_tensors='pt', truncation=True, padding=True)
    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.softmax(outputs.logits, dim=1)
        label = torch.argmax(probs, dim=1).item()
        confidence = probs[0, label].item()
    return label, confidence

print("\nВведите сообщение для проверки (или 'exit' для выхода):")
while True:
    user_text = input("> ")
    if user_text.lower() == 'exit':
        break
    label, conf = predict(user_text)
    print(f"Метка: {label} ({labels.get(label, 'неизвестно')}), уверенность: {conf:.2f}\n")
