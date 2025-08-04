# roskomnadzor-bot
shitty javascript bot for musteryworld

### Данный бот предназначен ИСКЛЮЧИТЕЛЬНО под сервера Дженро, на других серверах он бесполезен!

Основная функция данного бота - следить за чатом, реагировать на банворды (_в будущем планируется авто-создание форм под жалобы и прочее-прочее_).
Из дополнительных функций есть ходьба, поворот головы на все 4 стороны, прыжок и т.д. Со всеми командами можно ознакомится введя **.help**.

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

<img width="1081" height="601" alt="big-army" src="https://github.com/user-attachments/assets/288b1b95-30f2-446d-ad98-ac483a507a3f" />

<img width="295" height="233" alt="meme" src="https://github.com/user-attachments/assets/b13ec8df-f6d7-427e-b6cc-5e0a4945a2f2" />
