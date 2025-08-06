from datasets import load_dataset
from transformers import AutoTokenizer, AutoModelForSequenceClassification, TrainingArguments, Trainer
import torch

dataset = load_dataset('json', data_files='labeled_dataset.jsonl', split='train')
dataset = dataset.train_test_split(test_size=0.2, seed=42)
train_dataset = dataset['train']
test_dataset = dataset['test']

def to_int(example):
    example['label'] = int(example['label'])
    return example

train_dataset = train_dataset.map(to_int)
test_dataset = test_dataset.map(to_int)

tokenizer = AutoTokenizer.from_pretrained("cointegrated/rubert-tiny")
model = AutoModelForSequenceClassification.from_pretrained("cointegrated/rubert-tiny", num_labels=8)

def preprocess(examples):
    return tokenizer(
        examples["text"],
        truncation=True,
        padding='max_length',
        max_length=256
    )

train_dataset = train_dataset.map(preprocess, batched=True)
test_dataset = test_dataset.map(preprocess, batched=True)

training_args = TrainingArguments(
    output_dir='./results',
    num_train_epochs=3,
    per_device_train_batch_size=8,
    save_steps=100,
    save_total_limit=2,
    logging_steps=50
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=test_dataset
)

trainer.train()

model.save_pretrained('./rkn-api_model')
tokenizer.save_pretrained('./rkn-api_model')
labels = {
    0: 'норма',
    1: 'банворды (мат/оскорбления)',
    2: 'реклама',
    3: 'реклама читов',
    4: 'скам/раздачи',
    5: 'подстрекательство',
    6: 'оскорбление сервера',
    7: 'попрошайничество',
    8: 'другое нарушение',
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
