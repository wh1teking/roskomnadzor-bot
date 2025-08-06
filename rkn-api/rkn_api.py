from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

app = FastAPI()

tokenizer = AutoTokenizer.from_pretrained('./rkn-api_model')
model = AutoModelForSequenceClassification.from_pretrained('./rkn-api_model')

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

class Message(BaseModel):
    text: str

@app.post("/moderate")
def moderate(msg: Message):
    inputs = tokenizer(msg.text, return_tensors='pt', truncation=True, padding=True)
    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.softmax(outputs.logits, dim=1)
        label = torch.argmax(probs, dim=1).item()
        confidence = probs[0, label].item()
    return {"label": label, "class": labels.get(label, "неизвестно"), "confidence": confidence}
