# roskomnadzor-bot
shitty javascript bot for musteryworld with shitty ai

### Данный бот предназначен ИСКЛЮЧИТЕЛЬНО под сервера Дженро, на других серверах он бесполезен!

Основная функция данного бота - следить за чатом, реагировать на банворды. Со всеми командами можно ознакомится введя **.help**.

# Установка

**1. Скопируйте репозиторий:**
```
git clone https://github.com/wh1teking/roskomnadzor-bot
cd roskomnadzor-bot
```
**2. Установите все нужные библиотеки:**
```
npm install mineflayer socks vec3 prismarine-viewer canvas
```
**3. Запустите скрипт:**
```
node main.js
```

Если вы сделали все правильно, то скрипт должен запуститься исправно и вас встретит меню по настройке бота.

# Обучение и запуск нейросети

**1. Перейдите в папку `rkn-api` и создайте виртуальное окружение. Дождитесь полного его создания.**
```
cd rkn-api
python -m venv venv
```
**2. Установите все нужные библиотеки, заранее перейдя в виртуальное окружение.**

Windows:
```
.\venv\Scripts\activate
pip install torch uvicorn
```
Linux:
```
source venv/bin/activate
pip install torch uvicorn

(Если у вас изначально стоит не bash, а fish или что-то другое, рекомендуется перейти в bash.)
```
_**!!! Если каких-то библиотек при запуске python-скриптов будет не найдено, доустановите их путем `pip install <название>` !!!**_

**3. Соберите лог из майнкрафт-чата.**

Для этого можно предварительно запустить бота на сервер, запустить анализ командой `.analyze on` и ждать. Файл должен записаться в том месте, откуда вы запустили бота, в формате .txt с названием `analyzeLog_ник_дата_время`. Переименуйте этот лог в `analyze.txt` и закиньте его в папку `rkn-api/tools/`.

После этого, как вы записали достаточное количество сообщений (_желательно 20-30 тысяч различных сообщений на 200+ под каждое нарушение_), можно прогнать этот анализ скриптом `log2dataset.py`, который находится в папке `rkn-api/tools/`.
```
python rkn-api/tools/log2dataset.py
```

При успешном конвертировании анализа в датасеты (.jsonl/.csv), внутренности файла нужно разметить под каждое отдельное нарушение. Для этого есть скрипт `label_dataset.py`, который также находится в `rkn-api/tools/`.
```
python rkn-api/tools/label_dataset.py
```
**ВСЕГО 8 ТИПОВ РАЗМЕТКИ:**
```
0: 'норма'
1: 'банворды (мат/оскорбления)'
2: 'реклама'
3: 'реклама читов'
4: 'скам/раздачи'
5: 'подстрекательство'
6: 'оскорбление сервера'
7: 'попрошайничество'
```

Следующий этап - обучение. После того, как мы разметили внутренности датасетов, у нас должно получиться так, что у нас есть `labeled_dataset.csv` и `labeled_datased.jsonl`. Теперь запускаем скрипт `ai_learn.py`, находящийся в `rkn-api/tools/` и дожидаемся завершения обучения. Данный процесс может занимать от 10 минут до 3+ часов в зависимости от размеров вашего лога, который вы перевели в датасет.
```
python rkn-api/tools/ai_learn.py
```

Если обучение прошло успешно и после него запустилась проверка нейросети на точность, то можно закрывать скрипт и переходить к последнему этапу (или все-же проверить нейросеть) - запуск. Для этого переходим в папку `rkn-api` (если вы этого еще не сделали), запускаем `ai_start.sh`, предварительно выдав права на запуск путем `chmod +x ai_start.sh`. (ДЛЯ ПОЛЬЗОВАТЕЛЕЙ Linux!!!)

Для пользователей Windows можно запустить нейросеть напрямую через команду `uvicorn rkn_api:app --host 0.0.0.0 --port 8000`, находясь при этом в виртуальном окружении.

Наконец, запустите самого бота, зайдите на сервер, активируйте команду `.api on` и теперь бот сможет отправлять запросы нейросети, а та будет проверять на наличие в сообщении нарушений.

# Возможные ошибки при запуске бота на сервер

**1. Бот отключился после захода на сервер:**
```
[+] Бот успешно подключился к серверу!
[+] Для вывода команд введите .help

[X] Бот отключился от сервера
```
Возможно на аккаунте, через который вы заходите, просто неактивна сессия, тем самым бот попал под ботфильтр. Перед этим стоит сначала залогиниться в аккаунт с клиента игры, а после этого уже заходить со скрипта.
Если вы уверены, что сессия на аккаунте активна, попробуйте другой айпи сервера из трёх предложенных. Не используйте домен.

**2. Ошибка "Error: listen EADDRINUSE: address already in use"**
```
node:events:485
      throw er; // Unhandled 'error' event
      ^

Error: listen EADDRINUSE: address already in use
```
Данная ошибка происходит из-за того, что `prismarine-viewer` использует тот же самый порт при запуске нескольких скриптов сразу, тем самым конфликтуя и вызывая данную ошибку.
**(ИСПРАВЛЕНО В v1.2.2)**

# Возможные баги

**1. PartialReadError** (безвредно, ничего не делает)
```
PartialReadError: Read error for undefined : Missing characters in string, found size is 41274 expected size was 66435
```
Проигнорируйте, с ботом ничего не случится.

**2. Ignoring block entities as chunk failed to load...** (безвредно, ничего не делает)
```
Ignoring block entities as chunk failed to load at -1 -3
Ignoring block entities as chunk failed to load at -1 3
Ignoring block entities as chunk failed to load at -2 3
Ignoring block entities as chunk failed to load at -2 -3
Ignoring block entities as chunk failed to load at 0 -3
Ignoring block entities as chunk failed to load at 0 3
и т.д.
```
Фиксится установкой версии 1.20.1.

**3. Error: Server didn't respond to transaction for clicking on slot 2 on window with id 1.** (крашит скрипт 100%)
```
      throw new Error(`Server didn't respond to transaction for clicking on slot ${slot} on window with id ${window?.id}.`)
                ^

Error: Server didn't respond to transaction for clicking on slot 2 on window with id 1.
```
Фиксится установкой версии 1.20.1.

На этом все.

### roskomnadzor v2 - soon.

<img width="1081" height="601" alt="big-army" src="https://github.com/user-attachments/assets/288b1b95-30f2-446d-ad98-ac483a507a3f" />

<img width="295" height="233" alt="meme" src="https://github.com/user-attachments/assets/b13ec8df-f6d7-427e-b6cc-5e0a4945a2f2" />
