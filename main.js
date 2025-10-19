const mineflayer = require('mineflayer');
const readline = require('readline');
const Socks = require('socks').SocksClient;
const vec3 = require('vec3');
const { mineflayer: createViewer } = require('prismarine-viewer');
const http = require('http');
const fs = require('fs')

process.on('warning', (warning) => {
    if (!warning.message.includes('is deprecated. Use entity.displayName instead')) {
        console.warn(warning.name, warning.message);
    }
});

process.on('uncaughtException', (error) => {
    if (error.message && error.message.includes('PartialReadError') && 
        error.message.includes('Missing characters in string')) {
        console.log('[~] Игнорируем ошибку протокола (PartialReadError)');
        return;
    }
    console.error('[X] Неперехваченная ошибка:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    if (reason && reason.message && reason.message.includes('PartialReadError') && 
        reason.message.includes('Missing characters in string')) {
        console.log('[~] Игнорируем rejection протокола (PartialReadError)');
        return;
    }
    console.error('[X] Неперехваченный rejection:', reason);
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// МОЖНО ДОБАВИТЬ СВОИ БАНВОРДЫ И ДРУГИЕ ТРИГГЕРЫ ПУТЕМ ДОБАВЛЕНИЯ В МАССИВЫ ВНИЗУ
const banwords = ['мудила', 'пидор', 'пидорас', 'ебал', 'пздц', 'ебу', 'чмо', 'хуй', 'хуи']
const message_ads = ['заход', 'анархический', 'анархия', 'гриферский', 'айпи', 'ip', 'бесплатный', 'опка', 'free', 'бесплатный донат', 'бесплатный донат', 'free op', 'бесплатная опка']
const message_cheat_ads = ['thunderhack', 'neverlose', 'neverlose.cc', 'nursultan', 'celestial', 'catlavan', 'catlean', 'wexside', 'тх', 'тандерхак', 'неверлуз', 'нурик', 'нурсултан', 'целка', 'целестиал', 'катлаван']
const message_scum_ads = ['скам', 'раздача доната', 'раздача дк', 'раздача донат кейсов', 'раздача титул кейсов', 'раздача кейсов', 'раздача донат', 'раздача тк']
const message_incitement = ['дай акк', 'продай акк', 'акк', 'аккаунт', 'продам акк', 'куплю акк']
const message_server_abuse = ['сервер говн', 'сервер гавн', 'сервер хуй', 'серв говн', 'серв гавн', 'серв хуй']
const message_begging = ['дайте', 'пж', 'пожалуйста', 'очень нужно', 'кто даст', 'помогите', 'помоги', 'нужны деньги', 'нужна помощь', 'срочно нужно', 'кто поможет', 'дай', 'дайте пж', 'пж дайте',
    'хочу дом', 'построить дом', 'для постройки', 'выдайте', 'кто даст', 'кто скинет', 'скиньте', 'подайте', 'пж помогите', 'пж помоги', 'пж скиньте', 'пж дайте', 'пж кто нибудь', 'очень надо', 'очень нужно', 'очень нужен', 'очень нужны', 'не жалко', 'кому не жалко']
const rules = {
    '4.1': '4.1 Затрагивание семьи в оскорбительной форме (Наказание: мут от 2 часов до 1 дня);',
    '4.2': '4.2 *Гриферство, застройка/заливка чужих регионов, зазыв на ловушки, тп с намерением убить, мошенничество и т.п. от креатива. Неприличные/оскорбительные постройки (Наказание: бан от 6 часов до 1 дня/навсегда(только по жалобе));',
    '4.3': '4.3 *Подстрекательство игроков на нарушение правил (Наказание: мут 6 часов);',
    '4.4': '4.4 *Ставить префиксы: Хелпер, Модератор, а также любые другие вариации, сохраняющие стиль (цвет и скобочки), явно отсылающие о принадлежности к составу проекта (Наказание: бан 6 часов/навсегда).',
    '4.5': '4.5 *Зазывать на постройки, вызывающие зависание/вылет с сервера и т.п. (Наказание: бан навсегда);',
    '4.6': '4.6 Флуд, спам, мат, оскорбление в чате/префиксе/клане, капс, попрошайничество в чате, провокации на конфликт, расизм, фашизм, межнациональная рознь (Наказание: мут 2 часа/навсегда);',
    '4.7': '4.7 *Продавать/передавать аккаунты, а также сделки, связанные с продажей игровых ценностей, дюпа, клиентов и модификаций и т.п. за реальные деньги (Наказание: бан навсегда);',
    '4.8': '4.8 Препятствие нормальной игре/помеха в регионе (Наказание: бан 6 часов);',
    '4.9': '4.9 *Необоснованный, оскорбительный бан, мут, кик (Наказание: бан от 1 до 6 часов/навсегда);',
    '4.10': '4.10 *Оскорблять и провоцировать администрацию проекта, а также сам проект. (Наказание: бан 3 дня/навсегда);',
    '4.11': '4.11 Разбан/размут нарушителя. (Наказание: бан 4 часа);',
    '4.12': '4.12 *Вводить в заблуждение администрацию проекта, подделка документов, скриншотов и т.п. (Наказание: бан навсегда);',
    '4.13': '4.13 *Взлом, скам, фишинг, выманивание и распространение личных данных, а также угрозы взломом (Наказание: бан навсегда);',
    '4.14': '4.14 Использование читов в пвп (Наказание: бан 1 день(только по жалобе));',
    '4.15': '4.15 *Использование возможностей доната в корыстных целях (в пвп, полете, /wgstick, /chatclear и т.п), а также засорение командами глобального чата, локального(в общественных местах), /socialspy и /console. (Наказание: бан 3 часа);',
    '4.16': '4.16 *Реклама других проектов в любом виде (упоминание, созыв, айпи адрес) (Наказание: бан навсегда);',
    '4.17': '4.17 *Вредоносные постройки/механизмы, создание лагов, ботинг, ДДОС, а так же порча/изменение/снос/ застройка спавна (бан по IP);',
    '4.18': '4.18 *Использование/распространение багов сервера, дюпа (Наказание: бан от 6 часов до 3 дней);',
    '4.19': '4.19 *Пиар дискорд каналов/соц.сетей и т.п. никак не связанных с проектом (Исключение - стримы на нашем сервере) (Наказание: мут 3 часа/навсегда);',
    '4.20': '4.20 *Выдавать себя за персонал проекта и администрацию, а также их представителей, ставить ники с явной отсылкой на администрацию (Наказание: бан 6 часов).'
}

let waitingRealname = null;
let isReconnecting = false; // флаг от гигантского количества реконнектов
let lastConfig = null; // для реконнектов
let reconnectAttempts = 0;
const realnames = {};
const pendingReports = [];

const bots = new Map(); // мап для хранение ботов
let nextBotId = 1; // ид для бота
const botLogs = new Map(); // мап для настройки логов: ид -> true/false (включен/выключен)

const serverConfigs = {
    mw: {
        surv: 6,
        sb: 5
    },
    lm: {
        surv: 1,
        sb: 1
    },
    fg: {
        surv: 2,
        sb: 1
    },
    bm: {
        surv: 2,
        sb: 1
    },
    sm: {
        surv: 1,
        sb: 1
    },
    tm: {
        surv: 1,
        sb: 1
    },
    ms: {
        surv: 1,
        sb: 1
    },
};

function askConfig() {
    const config = {};
    
    console.log('[!] Если вы хотите подключиться к MusteryWorld (порт 25565), попробуйте один из этих адресов:')
    console.log('[!] 80.242.59.160')
    console.log('[!] 80.242.59.165')
    console.log('[!] 80.242.59.168\n')
    rl.question('[*] Введите адрес сервера (default: localhost): ', (host) => {
        config.host = host || 'localhost';
        
        rl.question('[*] Введите порт сервера (default: 25565): ', (port) => {
            config.port = port ? parseInt(port) : 25565;
            
            rl.question('[*] Введите никнейм бота (default: ReportBot): ', (username) => {
                config.username = username || 'ReportBot';
                
                rl.question('[*] Введите версию Minecraft (default: 1.20.1): ', (version) => {
                    config.version = version || '1.20.1';
                    
                    rl.question('[*] Использовать прокси? (y/N): ', (useProxy) => {
                        if (useProxy.toLowerCase() === 'y') {
                            rl.question('[*] Введите IP прокси: ', (proxyIp) => {
                                rl.question('[*] Введите порт прокси: ', (proxyPort) => {
                                    rl.question('[*] Тип прокси (socks4/socks5/http): ', (proxyType) => {
                                        config.proxy = {
                                            ip: proxyIp,
                                            port: parseInt(proxyPort || '1080'),
                                            type: proxyType || 'socks5'
                                        };
                                        startBot(config);
                                    });
                                });
                            });
                        } else {
                            startBot(config);
                        }
                    });
                });
            });
        });
    });
}

function createBotWithProxy(config) {
    if (!config.proxy) {
        return mineflayer.createBot(config);
    }

    const proxyOptions = {
        host: config.proxy.ip,
        port: config.proxy.port,
        type: parseInt(config.proxy.type.replace('socks', '')) || 5,
        userId: config.proxy.username,
        password: config.proxy.password
    };

    return mineflayer.createBot({
        ...config,
        connect: (client) => {
            Socks.createConnection({
                proxy: proxyOptions,
                destination: {
                    host: config.host,
                    port: config.port
                },
                command: 'connect'
            }, (err, info) => {
                if (err) {
                    client.emit('error', err);
                    return;
                }
                client.setSocket(info.socket);
                client.emit('connect');
            });
        }
    });
}

function startBot(config) {
    lastConfig = config;
    reconnectAttempts = 0;
    console.log('\n[*] Подключаемся к серверу...');
    console.log(`[*] Адрес: ${config.host}:${config.port}`);
    console.log(`[*] Ник: ${config.username}`);
    console.log(`[*] Версия: ${config.version}`);
    if (config.proxy) {
        console.log(`[*] Используется прокси: ${config.proxy.ip}:${config.proxy.port} (${config.proxy.type})`);
    } else {
        console.log('[*] Используется прямое подключение');
    }
    console.log('');

    const bot = createBotWithProxy(config);

    bot.on('login', () => {
        console.log('[+] Бот успешно подключился к серверу!');
        console.log('[+] Для вывода команд введите .help\n');
        isReconnecting = false; // сбрасываем флаг при успешном подключении
	    bot.physics.airdrag = 0.9800000190734863 // жалкая попытка обойти ботфильтр
        
        bot.autoreportMode = false;
        bot.analyzeMode = false;
        bot.analyzeLogStream = null;
        bot.analyzeLogFile = '';
        bot.apiMode = true;
        bot.aimbotTarget = null;
        bot.aimbotInterval = null;
        bot.lastAttackTime = 0;
        bot.moderatorMode = false;
        bot.danceInterval = null;
        bot.danceLookInterval = null;
        bot.lastConfig = config; // для реконнектов
        
        commandMode(bot);
    });

    // viewer init
    bot.once('spawn', () => {
        const viewerPort = Math.floor(Math.random() * (9999 - 1024 + 1)) + 1024; // порт 1024-9999
        createViewer(bot, { 
            port: viewerPort,
            firstPerson: true,
            viewDistance: 4
        });
        const oldLog = console.log;
        console.log = function(...args) {
            if (typeof args[0] === 'string' && args[0].includes('Prismarine viewer web server running on')) {
                oldLog(`[+] Зрение бота доступно по адресу http://localhost:${viewerPort}`);
            } else {
                oldLog(...args);
            }
        };

        // o_0
        bot.on('message', async (jsonMsg) => {
            const text = jsonMsg.toString();
            if (text.includes('(🗡)')) {
                return;
            }
            const timestamp = new Date().toLocaleTimeString('ru-RU', { hour12: false });
            const nickMatch = text.match(/^[^|]+\|\s*\[[^\]]+\]\s*([^\s\[\]*]+).*➯/);
            let nickname = '???';
            if (nickMatch) {
                nickname = nickMatch[1];
            }
            // вывод в консоль
            console.log(`[${bot.username} - main] [${timestamp}] ${text}`);
            
            // запись в analyze log если включен
            if (bot.analyzeMode && bot.analyzeLogStream) {
                bot.analyzeLogStream.write(`[${timestamp}] ${text}\n`);
            }
            
            // модерация
            if (bot.moderatorMode) {
                const msgMatch = text.match(/➯\s*(.+)$/i);
                if (msgMatch) {
                    const message = msgMatch[1].toLowerCase();
                    let triggered = false;

                    // банворды
                    for (const word of banwords) {
                        if (message.includes(word)) {
                            //bot.chat(`@[MOD] Банворд в сообщении: "${message}" | detected: ${word} | Никнейм: ${nickname} | Время: ${timestamp}`);
                            waitingRealname = nickname;
                            setTimeout(() => {
                                bot.chat(`/realname ${nickname}`);
                            }, 150);
                            console.log(`[MOD] Обнаружен банворд "${word}" в сообщении: ${jsonMsg}`);
                            triggered = true;
                            if (bot.apiMode) {
                                (async () => {
                                    try {
                                        const result = await moderateMessage(text);
                                        const conf = typeof result.confidence === 'number' ? result.confidence.toFixed(2) : 'нет данных';
                                        const aiMsg = `[rkn-api] result: ${result.class} (уверенность: ${conf}) | Сообщение: "${text}" | Время: ${timestamp}`;
                                        console.log(aiMsg);
                                        bot.chat(`@${aiMsg}`);
                                    } catch (e) {
                                        console.log('[rkn-api] Ошибка при обращении к нейросети:', e);
                                        bot.chat('@[rkn-api] Нейросеть не отвечает. Попробуйте позже.');
                                    }
                                })();
                            }
                            // авто жб
                            if (bot.moderatorMode && bot.autoreportMode) {
                                const now = new Date();
                                const dateStr = now.toLocaleString('ru-RU', { hour12: false });
                                const reportObj = {
                                    nickname,
                                    botname: bot.username,
                                    rule: '4.6',
                                    dateStr,
                                    type: 'banwords',
                                    timer: null
                                };
                                reportObj.timer = setTimeout(() => {
                                    // если realname пришёл — используем его, иначе исходный ник
                                    const realNick = (realnames[nickname] && realnames[nickname] !== 'null') ? realnames[nickname] : nickname;
                                    const report = `1. Ник нарушителя: ${realNick} | 2. Ваш ник: ${bot.username} | 3. Нарушение: 4.6 | 4. Режим: surv1 | 5. Дата и время: ${dateStr}`;
                                    console.log(`[AUTO-REPORT] ${report}`);
                                    bot.chat(`@[AUTO-REPORT] ${report}`);
                                    // удаляем из очереди
                                    const idx = pendingReports.indexOf(reportObj);
                                    if (idx !== -1) pendingReports.splice(idx, 1);
                                }, 1500);
                                pendingReports.push(reportObj);
                            }
                            break;
                        }
                    }
                    if (triggered) return;

                    // реклама
                    for (const word of message_ads) {
                        if (message.includes(word)) {
                            //bot.chat(`@[MOD] Возможно реклама или созыв в сообщении: "${message}" | detected: ${word} | Никнейм: ${nickname} | Время: ${timestamp}`);
                            waitingRealname = nickname;
                            setTimeout(() => {
                                bot.chat(`/realname ${nickname}`);
                            }, 150);
                            console.log(`[MOD] Обнаружена возможная реклама или созыв "${word}" в сообщении: ${jsonMsg}`);
                            triggered = true;
                            if (bot.apiMode) {
                                (async () => {
                                    try {
                                        const result = await moderateMessage(text);
                                        const conf = typeof result.confidence === 'number' ? result.confidence.toFixed(2) : 'нет данных';
                                        const aiMsg = `[rkn-api] result: ${result.class} (уверенность: ${conf}) | Сообщение: "${text}" | Время: ${timestamp}`;
                                        console.log(aiMsg);
                                        bot.chat(`@${aiMsg}`);
                                    } catch (e) {
                                        console.log('[rkn-api] Ошибка при обращении к нейросети:', e);
                                        bot.chat('@[rkn-api] Нейросеть не отвечает. Попробуйте позже.');
                                    }
                                })();
                            }
                            // авто жб
                            if (bot.moderatorMode && bot.autoreportMode) {
                                const now = new Date();
                                const dateStr = now.toLocaleString('ru-RU', { hour12: false });
                                const reportObj = {
                                    nickname,
                                    botname: bot.username,
                                    rule: '4.16',
                                    dateStr,
                                    type: 'message_ads',
                                    timer: null
                                };
                                reportObj.timer = setTimeout(() => {
                                    // если realname пришёл — используем его, иначе исходный ник
                                    const realNick = (realnames[nickname] && realnames[nickname] !== 'null') ? realnames[nickname] : nickname;
                                    const report = `1. Ник нарушителя: ${realNick} | 2. Ваш ник: ${bot.username} | 3. Нарушение: 4.16 | 4. Режим: surv1 | 5. Дата и время: ${dateStr}`;
                                    console.log(`[AUTO-REPORT] ${report}`);
                                    bot.chat(`@[AUTO-REPORT] ${report}`);
                                    // удаляем из очереди
                                    const idx = pendingReports.indexOf(reportObj);
                                    if (idx !== -1) pendingReports.splice(idx, 1);
                                }, 1500);
                                pendingReports.push(reportObj);
                            }
                            break;
                        }
                    }
                    if (triggered) return;

                    // реклама читов
                    for (const word of message_cheat_ads) {
                        if (message.includes(word)) {
                            //bot.chat(`@[MOD] Возможно реклама чит-клиентов в сообщении: "${message}" | detected: ${word} | Никнейм: ${nickname} | Время: ${timestamp}`);
                            waitingRealname = nickname;
                            setTimeout(() => {
                                bot.chat(`/realname ${nickname}`);
                            }, 150);
                            console.log(`[MOD] Обнаружена возможная реклама чит-клиентов "${word}" в сообщении: ${jsonMsg}`);
                            triggered = true;
                            if (bot.apiMode) {
                                (async () => {
                                    try {
                                        const result = await moderateMessage(text);
                                        const conf = typeof result.confidence === 'number' ? result.confidence.toFixed(2) : 'нет данных';
                                        const aiMsg = `[rkn-api] result: ${result.class} (уверенность: ${conf}) | Сообщение: "${text}" | Время: ${timestamp}`;
                                        console.log(aiMsg);
                                        bot.chat(`@${aiMsg}`);
                                    } catch (e) {
                                        console.log('[rkn-api] Ошибка при обращении к нейросети:', e);
                                        bot.chat('@[rkn-api] Нейросеть не отвечает. Попробуйте позже.');
                                    }
                                })();
                            }
                            // авто жб
                            if (bot.moderatorMode && bot.autoreportMode) {
                                const now = new Date();
                                const dateStr = now.toLocaleString('ru-RU', { hour12: false });
                                const reportObj = {
                                    nickname,
                                    botname: bot.username,
                                    rule: '4.19',
                                    dateStr,
                                    type: 'message_cheat_ads',
                                    timer: null
                                };
                                reportObj.timer = setTimeout(() => {
                                    // если realname пришёл — используем его, иначе исходный ник
                                    const realNick = (realnames[nickname] && realnames[nickname] !== 'null') ? realnames[nickname] : nickname;
                                    const report = `1. Ник нарушителя: ${realNick} | 2. Ваш ник: ${bot.username} | 3. Нарушение: 4.19 | 4. Режим: surv1 | 5. Дата и время: ${dateStr}`;
                                    console.log(`[AUTO-REPORT] ${report}`);
                                    bot.chat(`@[AUTO-REPORT] ${report}`);
                                    // удаляем из очереди
                                    const idx = pendingReports.indexOf(reportObj);
                                    if (idx !== -1) pendingReports.splice(idx, 1);
                                }, 1500);
                                pendingReports.push(reportObj);
                            }
                            break;
                        }
                    }
                    if (triggered) return;

                    // скам
                    for (const word of message_scum_ads) {
                        if (message.includes(word)) {
                            //bot.chat(`@[MOD] Возможно скам в сообщении: "${message}" | detected: ${word} | Никнейм: ${nickname} | Время: ${timestamp}`);
                            waitingRealname = nickname;
                            setTimeout(() => {
                                bot.chat(`/realname ${nickname}`);
                            }, 150);
                            console.log(`[MOD] Кого-то хотят обмануть "${word}" в сообщении: ${jsonMsg}`);
                            triggered = true;
                            if (bot.apiMode) {
                                (async () => {
                                    try {
                                        const result = await moderateMessage(text);
                                        const conf = typeof result.confidence === 'number' ? result.confidence.toFixed(2) : 'нет данных';
                                        const aiMsg = `[rkn-api] result: ${result.class} (уверенность: ${conf}) | Сообщение: "${text}" | Время: ${timestamp}`;
                                        console.log(aiMsg);
                                        bot.chat(`@${aiMsg}`);
                                    } catch (e) {
                                        console.log('[rkn-api] Ошибка при обращении к нейросети:', e);
                                        bot.chat('@[rkn-api] Нейросеть не отвечает. Попробуйте позже.');
                                    }
                                })();
                            }
                            // авто жб
                            if (bot.moderatorMode && bot.autoreportMode) {
                                const now = new Date();
                                const dateStr = now.toLocaleString('ru-RU', { hour12: false });
                                const reportObj = {
                                    nickname,
                                    botname: bot.username,
                                    rule: '4.13',
                                    dateStr,
                                    type: 'message_scum_ads',
                                    timer: null
                                };
                                reportObj.timer = setTimeout(() => {
                                    // если realname пришёл — используем его, иначе исходный ник
                                    const realNick = (realnames[nickname] && realnames[nickname] !== 'null') ? realnames[nickname] : nickname;
                                    const report = `1. Ник нарушителя: ${realNick} | 2. Ваш ник: ${bot.username} | 3. Нарушение: 4.13 | 4. Режим: surv1 | 5. Дата и время: ${dateStr}`;
                                    console.log(`[AUTO-REPORT] ${report}`);
                                    bot.chat(`@[AUTO-REPORT] ${report}`);
                                    // удаляем из очереди
                                    const idx = pendingReports.indexOf(reportObj);
                                    if (idx !== -1) pendingReports.splice(idx, 1);
                                }, 1500);
                                pendingReports.push(reportObj);
                            }
                            break;
                        }
                    }
                    if (triggered) return;

                    // подстрекательство
                    for (const word of message_incitement) {
                        if (message.includes(word)) {
                            //bot.chat(`@[MOD] Возможно подстрекательство на нарушение в сообщении: "${message}" | detected: ${word} | Никнейм: ${nickname} | Время: ${timestamp}`);
                            waitingRealname = nickname;
                            setTimeout(() => {
                                bot.chat(`/realname ${nickname}`);
                            }, 150);
                            console.log(`[MOD] Обнаружено подстрекательство на нарушение "${word}" в сообщении: ${jsonMsg}`);
                            triggered = true;
                            if (bot.apiMode) {
                                (async () => {
                                    try {
                                        const result = await moderateMessage(text);
                                        const conf = typeof result.confidence === 'number' ? result.confidence.toFixed(2) : 'нет данных';
                                        const aiMsg = `[rkn-api] result: ${result.class} (уверенность: ${conf}) | Сообщение: "${text}" | Время: ${timestamp}`;
                                        console.log(aiMsg);
                                        bot.chat(`@${aiMsg}`);
                                    } catch (e) {
                                        console.log('[rkn-api] Ошибка при обращении к нейросети:', e);
                                        bot.chat('@[rkn-api] Нейросеть не отвечает. Попробуйте позже.');
                                    }
                                })();
                            }
                            // авто жб
                            if (bot.moderatorMode && bot.autoreportMode) {
                                const now = new Date();
                                const dateStr = now.toLocaleString('ru-RU', { hour12: false });
                                const reportObj = {
                                    nickname,
                                    botname: bot.username,
                                    rule: '4.3',
                                    dateStr,
                                    type: 'message_incitement',
                                    timer: null
                                };
                                reportObj.timer = setTimeout(() => {
                                    // если realname пришёл — используем его, иначе исходный ник
                                    const realNick = (realnames[nickname] && realnames[nickname] !== 'null') ? realnames[nickname] : nickname;
                                    const report = `1. Ник нарушителя: ${realNick} | 2. Ваш ник: ${bot.username} | 3. Нарушение: 4.3 | 4. Режим: surv1 | 5. Дата и время: ${dateStr}`;
                                    console.log(`[AUTO-REPORT] ${report}`);
                                    bot.chat(`@[AUTO-REPORT] ${report}`);
                                    // удаляем из очереди
                                    const idx = pendingReports.indexOf(reportObj);
                                    if (idx !== -1) pendingReports.splice(idx, 1);
                                }, 1500);
                                pendingReports.push(reportObj);
                            }
                            break;
                        }
                    }
                    if (triggered) return;

                    // оскорбление сервера
                    for (const word of message_server_abuse) {
                        if (message.includes(word)) {
                            //bot.chat(`@[MOD] Возможно оскорбление сервера в сообщении: "${message}" | detected: ${word} | Никнейм: ${nickname} | Время: ${timestamp}`);
                            waitingRealname = nickname;
                            setTimeout(() => {
                                bot.chat(`/realname ${nickname}`);
                            }, 150);
                            console.log(`[MOD] Обнаружено оскорбление сервера "${word}" в сообщении: ${jsonMsg}`);
                            triggered = true;
                            if (bot.apiMode) {
                                (async () => {
                                    try {
                                        const result = await moderateMessage(text);
                                        const conf = typeof result.confidence === 'number' ? result.confidence.toFixed(2) : 'нет данных';
                                        const aiMsg = `[rkn-api] result: ${result.class} (уверенность: ${conf}) | Сообщение: "${text}" | Время: ${timestamp}`;
                                        console.log(aiMsg);
                                        bot.chat(`@${aiMsg}`);
                                    } catch (e) {
                                        console.log('[rkn-api] Ошибка при обращении к нейросети:', e);
                                        bot.chat('@[rkn-api] Нейросеть не отвечает. Попробуйте позже.');
                                    }
                                })();
                            }
                            // авто жб
                            if (bot.moderatorMode && bot.autoreportMode) {
                                const now = new Date();
                                const dateStr = now.toLocaleString('ru-RU', { hour12: false });
                                const reportObj = {
                                    nickname,
                                    botname: bot.username,
                                    rule: '4.10',
                                    dateStr,
                                    type: 'message_server_abuse',
                                    timer: null
                                };
                                reportObj.timer = setTimeout(() => {
                                    // если realname пришёл — используем его, иначе исходный ник
                                    const realNick = (realnames[nickname] && realnames[nickname] !== 'null') ? realnames[nickname] : nickname;
                                    const report = `1. Ник нарушителя: ${realNick} | 2. Ваш ник: ${bot.username} | 3. Нарушение: 4.10 | 4. Режим: surv1 | 5. Дата и время: ${dateStr}`;
                                    console.log(`[AUTO-REPORT] ${report}`);
                                    bot.chat(`@[AUTO-REPORT] ${report}`);
                                    // удаляем из очереди
                                    const idx = pendingReports.indexOf(reportObj);
                                    if (idx !== -1) pendingReports.splice(idx, 1);
                                }, 1500);
                                pendingReports.push(reportObj);
                            }
                            break;
                        }
                    }
                    if (triggered) return;

                    // попрошайничество
                    for (const word of message_begging) {
                        if (message.includes(word)) {
                            //bot.chat(`@[MOD] Возможно попрошайничество в сообщении: "${message}" | detected: ${word} | Никнейм: ${nickname} | Время: ${timestamp}`);
                            waitingRealname = nickname;
                            setTimeout(() => {
                                bot.chat(`/realname ${nickname}`);
                            }, 150);
                            console.log(`[MOD] Обнаружено попрошайничество "${word}" в сообщении: ${jsonMsg}`);
                            triggered = true;
                            if (bot.apiMode) {
                                (async () => {
                                    try {
                                        const result = await moderateMessage(text);
                                        const conf = typeof result.confidence === 'number' ? result.confidence.toFixed(2) : 'нет данных';
                                        const aiMsg = `[rkn-api] result: ${result.class} (уверенность: ${conf}) | Сообщение: "${text}" | Время: ${timestamp}`;
                                        console.log(aiMsg);
                                        bot.chat(`@${aiMsg}`);
                                    } catch (e) {
                                        console.log('[rkn-api] Ошибка при обращении к нейросети:', e);
                                        bot.chat('@[rkn-api] Нейросеть не отвечает. Попробуйте позже.');
                                    }
                                })();
                            }
                            // авто жб
                            if (bot.moderatorMode && bot.autoreportMode) {
                                const now = new Date();
                                const dateStr = now.toLocaleString('ru-RU', { hour12: false });
                                const reportObj = {
                                    nickname,
                                    botname: bot.username,
                                    rule: '4.6',
                                    dateStr,
                                    type: 'message_begging',
                                    timer: null
                                };
                                reportObj.timer = setTimeout(() => {
                                    // если realname пришёл — используем его, иначе исходный ник
                                    const realNick = (realnames[nickname] && realnames[nickname] !== 'null') ? realnames[nickname] : nickname;
                                    const report = `1. Ник нарушителя: ${realNick} | 2. Ваш ник: ${bot.username} | 3. Нарушение: 4.6 | 4. Режим: surv1 | 5. Дата и время: ${dateStr}`;
                                    console.log(`[AUTO-REPORT] ${report}`);
                                    bot.chat(`@[AUTO-REPORT] ${report}`);
                                    // удаляем из очереди
                                    const idx = pendingReports.indexOf(reportObj);
                                    if (idx !== -1) pendingReports.splice(idx, 1);
                                }, 1500);
                                pendingReports.push(reportObj);
                            }
                            break;
                        }
                    }
                    if (triggered) return;

                    // под правила
                    for (const [ruleKey, ruleText] of Object.entries(rules)) {
                        const ruleRegex = new RegExp(`\\b${ruleKey}\\b`, 'i');
                        if (ruleRegex.test(message)) {
                            bot.chat(`@[MOD] ${ruleText}`)
                            console.log(`[MOD] Объяснение правила "${ruleKey}" в сообщении: ${jsonMsg}`);
                            break;
                        }
                    }
                }
                // под правила но на наказания
                const banMatch = text.match(/(?:Причина:|по причине)\s*(\d+\.\d+)/i);
                if (banMatch) {
                    const ruleKey = banMatch[1];
                    if (rules[ruleKey]) {
                        bot.chat(`@[MOD] ${rules[ruleKey]}`);
                        console.log(`[MOD] Объяснение правила "${ruleKey}" в сообщении: ${jsonMsg}`);
                    }
                }
            }
            // realname
            if (
                waitingRealname &&
                text.includes('Настоящее имя игрока') &&
                text.toLowerCase().includes(waitingRealname.toLowerCase())
            ) {
                // проверка на null (если null, то игнор)
                if (!text.includes('Настоящее имя игрока null')) {
                    const match = text.match(/Настоящее имя игрока [^\-]+-\s*([^\s\(]+)/i);
                    if (match && match[1]) {
                        realnames[waitingRealname] = match[1];
                    }
                    bot.chat(`@[MOD] ${text}`);
                    console.log(`[MOD] ${text}`);
                    // отправляем все pendingReports для этого realname
                    for (let i = 0; i < pendingReports.length; i++) {
                        if (pendingReports[i].nickname === waitingRealname) {
                            const r = pendingReports[i];
                            if (r.timer) clearTimeout(r.timer);
                            const realNick = (realnames[r.nickname] && realnames[r.nickname] !== 'null') ? realnames[r.nickname] : r.nickname;
                            const report = `1. Ник нарушителя: ${realNick} | 2. Ваш ник: ${r.botname} | 3. Нарушение: ${r.rule} | 4. Режим: surv1 | 5. Дата и время: ${r.dateStr}`;
                            console.log(`[AUTO-REPORT] ${report}`);
                            bot.chat(`@[AUTO-REPORT] ${report}`);
                            pendingReports.splice(i, 1); i--;
                        }
                    }
                }
                waitingRealname = null;
            }
        });
    });

    bot.on('error', (err) => {
        console.error('[X] Ошибка подключения:', err);
        rl.close();
        process.exit(1);
    });
    
    const stafflist = ['Java45', 'SweetyPie_', '_software_', 'Atos', 'D3adS0u1x', 'KrIkI6', 'DoultStout', 'yourlonelyneed', 'Fafararr', 'shirroo_', 'D1vlne', 'weq0ex', 'vaizu', 'JeNro0', 'BarsLan_', 'Niquoles'];

    bot.on('playerJoined', (player) => {
        if (
            bot.moderatorMode &&
            player &&
            player.username &&
            stafflist.map(n => n.toLowerCase()).includes(player.username.toLowerCase())
        ) {
            console.log(`[MOD] +staff: ${player.username}`);
            bot.chat(`@[MOD] +staff: ${player.username}`);
        }
    });

    bot.on('playerLeft', (player) => {
        if (
            bot.moderatorMode &&
            player &&
            player.username &&
            stafflist.map(n => n.toLowerCase()).includes(player.username.toLowerCase())
        ) {
            console.log(`[MOD] -staff: ${player.username} (возможно /sv или дисконнект)`);
            bot.chat(`@[MOD] -staff: ${player.username} (возможно /sv или дисконнект)`);
        }
    });

    bot.on('kicked', (reason, loggedIn) => {
        console.log('[X] Кикнут по причине:', reason, ' | Кикнут после подключения:', loggedIn);
        // rl.close();
        // process.exit(1);
        if (!isReconnecting) {
            tryReconnect();
        }
    });

    bot.on('end', () => {
        console.log('[X] Бот отключился от сервера');
        if (bot.aimbotInterval) {
            stopAimbot(bot);
        }
        // rl.close();
        // process.exit(0);
        if (!isReconnecting) {
            tryReconnect();
        }
    });

    bot.on('death', () => {
        console.log('[X] Бот умер в игре');
        if (bot.aimbotInterval) {
            stopAimbot(bot);
        }
    });

    bot.on('playerLeft', (player) => {
        if (bot.aimbotTarget && bot.aimbotTarget.username === player.username) {
            console.log(`[!] Цель ${player.username} вышла с сервера, останавливаем аимбот`);
            stopAimbot(bot);
        }
    });
}

function tryReconnect() {
    if (!lastConfig || isReconnecting) return;
    
    isReconnecting = true;
    
    const timeoutDelay = 2000;
    
    setTimeout(() => {
        const delay = 5000;
        console.log(`[~] Переподключение через ${delay / 1000} секунд...`);
        setTimeout(() => {
            isReconnecting = false;
            startBot(lastConfig);
        }, delay);
    }, timeoutDelay);
}
// команды
function commandMode(bot) {
    rl.removeAllListeners('line');
    rl.on('line', (input) => {
        const trimmedInput = input.trim();
        
        if (trimmedInput === '') return;
        
        if (!trimmedInput.startsWith('.')) {
            bot.chat(trimmedInput);
            return;
        }
        
        const parts = trimmedInput.split(' ');
        const command = parts[0];
        const args = parts.slice(1);

        switch(command) {
            case '.help':
            case '.h':
                console.log('[?] Доступные команды:');
                console.log('     .help (.h) - показать эту справку');
                console.log('     .join [сервер] [режим] [номер] - зайти на сервер');
                console.log('         серверы: mw, lm, fg, bm, sm, tm, ms');
                console.log('         mw - MusteryWorld');
                console.log('         lm - LastMine');
                console.log('         fg - FunnyGames');
                console.log('         bm - BarsMine');
                console.log('         sm - SuperMine');
                console.log('         tm - TopMine');
                console.log('         ms - MineStars');
                console.log('         режимы: surv, sb');
                console.log('         пример: .join mw surv 3');
                console.log('     .position (.pos) - бот отправит свои координаты в клан-чат');
                console.log('     .playerlist (.pl) - посмотреть сколько игроков на сервере');
                console.log('     .moderator (.mod) on/off - включить/выключить модерацию (ТРЕБУЕТСЯ КЛАН!)');
                console.log('     .autoreport (.arep) on/off - включить/выключить авто-жалобы');
                console.log('     .api on/off - включить/выключить отправку запросов к нейросети');
                console.log('     .analyze on/off - записывать чат бота в специальный .txt файл')
                
                console.log('\n[?] Команды для управления ботами:');
                console.log('     .botadd (.badd) [IP] [порт] [ник] - добавить нового бота');
                console.log('         пример: .botadd 8.8.8.8 25565 roskomnadzor');
                console.log('     .botdel (.bdel) [номер/ник] - удалить бота');
                console.log('         пример: .botdel 1 или .botdel roskomnadzor');
                console.log('     .botrun (.brun) [номер/ник] [команда] - выполнить команду для бота');
                console.log('         пример: .botrun 1 Привет! или .botrun roskomnadzor .join mw surv 1');
                console.log('         поддерживаются все внутренние команды: .join, .attack, .head, .walk, .jump, .dance, .playerlist, .position');
                console.log('     .botlog (.blog) [номер/ник] [on/off] - включить/выключить логи бота');
                console.log('         пример: .botlog 1 off или .blog roskomnadzor on');
                console.log('     .botlist (.blist) - показать список всех ботов');
                
                console.log('\n     Любой текст без точки будет отправлен в чат');
                break;
            
            case '.analyze':
                if (args[0] === 'on') {
                    if (bot.analyzeMode) {
                        console.log('[!] Анализ уже включён!');
                        break;
                    }
                    bot.analyzeMode = true;
                    bot.analyzeLogFile = getAnalyzeLogFileName(bot);
                    bot.analyzeLogStream = fs.createWriteStream(bot.analyzeLogFile, { flags: 'a' });
                    const now = new Date();
                    const dateStr = now.toLocaleDateString('ru-RU');
                    const timeStr = now.toLocaleTimeString('ru-RU', { hour12: false });
                    bot.analyzeLogStream.write('=== ANALYZE LOG ===\n');
                    bot.analyzeLogStream.write(`time: ${timeStr}\n`);
                    bot.analyzeLogStream.write(`date: ${dateStr}\n`);
                    bot.analyzeLogStream.write(`bot nickname: ${bot.username}\n`);
                    bot.analyzeLogStream.write('=== ANALYZE LOG ===\n\n');
                    console.log(`[+] Анализ чата включён. Лог пишется в файл: ${bot.analyzeLogFile}`);
                    bot.chat(`@[+] Анализ чата включён! Никнейм: ${bot.username} | Дата: ${dateStr} | Время: ${timeStr}`);
                    //bot.chat('!Привет! Я - специальный помощник проекта "roskomnazdor" от goddamnblessed и nithbann, и я помогаю ловить нарушителей на этом сервере. Для улучшения качества работы все сообщения будут записываться.')
                } else if (args[0] === 'off') {
                    if (!bot.analyzeMode) {
                        console.log('[!] Анализ уже выключен!');
                        break;
                    }
                    bot.analyzeMode = false;
                    if (bot.analyzeLogStream) {
                        bot.analyzeLogStream.end();
                        bot.analyzeLogStream = null;
                        console.log('[+] Анализ чата выключен. Файл закрыт.');
                    }
                } else {
                    console.log('[?] Использование: .analyze on|off');
                }
                break;

            // эта thing может быть чуть-чуть huinya фиксите сами мне лень
            case '.join':
                if (args.length < 3) {
                    console.log('[X] Использование: .join [сервер] [режим] [номер]');
                    console.log('    Серверы: mw, lm, fg, bm, sm, tm, ms');
                    console.log('    mw - MusteryWorld');
                    console.log('    lm - LastMine');
                    console.log('    fg - FunnyGames');
                    console.log('    bm - BarsMine');
                    console.log('    sm - SuperMine');
                    console.log('    tm - TopMine');
                    console.log('    ms - MineStars');
                    console.log('    Режимы: surv, sb');
                    console.log('    Пример: .join mw surv 3');
                    console.log('\n    Доступные серверы:');
                    for (const [server, config] of Object.entries(serverConfigs)) {
                        console.log(`      ${server}: surv(1-${config.surv}), sb(1-${config.sb})`);
                    }
                } else {
                    const server = args[0];
                    const mode = args[1];
                    const serverNumber = parseInt(args[2]);
                    
                    if (isNaN(serverNumber)) {
                        console.log('[X] Некорректный аргумент');
                        break;
                    }
                    
                    joinServer(bot, server, mode, serverNumber);
                }
                break;

            case '.moderator':
            case '.mod':
                if (args[0] === 'on') {
                    bot.moderatorMode = true;
                    console.log('[+] Режим модератора включён!');
                    bot.chat('@[+] Режим модератора включён!');
                } else if (args[0] === 'off') {
                    bot.moderatorMode = false;
                    console.log('[+] Режим модератора выключен!');
                    bot.chat('@[+] Режим модератора выключен!');
                } else {
                    console.log('[?] Использование: .moderator (.mod) on|off');
                }
                break;

            case '.autoreport':
            case '.arep':
                if (args[0] === 'on') {
                    bot.autoreportMode = true;
                    console.log('[+] Режим автожалоб включён!');
                    bot.chat('@[+] Режим автожалоб включён!');
                } else if (args[0] === 'off') {
                    bot.autoreportMode = false;
                    console.log('[+] Режим автожалоб выключен!');
                    bot.chat('@[+] Режим автожалоб выключен!');
                } else {
                    console.log('[?] Использование: .autoreport (.arep) on|off');
                }
                break;

            case '.api':
                if (args[0] === 'on') {
                    bot.apiMode = true;
                    console.log('[+] Ответы от нейросети включены!');
                    console.log('[!] Обратите внимание, что ответы не будут работать без запущенного python-скрипта с нейросетью!')
                    bot.chat('@[+] Ответы от нейросети включены!');
                } else if (args[0] === 'off') {
                    bot.apiMode = false;
                    console.log('[+] Ответы от нейросети выключены!');
                    bot.chat('@[+] Ответы от нейросети выключены!');
                } else {
                    console.log('[?] Использование: .api on|off');
                }
                break;

            case '.playerlist':
            case '.pl':
                console.log('\n=== СПИСОК ИГРОКОВ НА СЕРВЕРЕ ===');
                
                console.log('\n[1] Видимые игроки (bot.players):');
                const visiblePlayers = Object.keys(bot.players);
                if (visiblePlayers.length > 0) {
                    visiblePlayers.forEach((username, index) => {
                        const player = bot.players[username];
                        console.log(`   ${index + 1}. ${username} (UUID: ${player.uuid})`);
                    });
                } else {
                    console.log('   Нет видимых игроков');
                }
                
                console.log('\n[2] Все игроки через entities:');
                const allPlayers = Object.values(bot.entities).filter(entity => entity.type === 'player');
                if (allPlayers.length > 0) {
                    allPlayers.forEach((player, index) => {
                        console.log(`   ${index + 1}. ${player.username || 'Unknown'} (ID: ${player.id})`);
                    });
                } else {
                    console.log('   Нет игроков в entities');
                }
                console.log('\n=== ИТОГО ===');
                console.log(`Видимых игроков: ${visiblePlayers.length}`);
                console.log(`Игроков в entities: ${allPlayers.length}`);
                console.log('================================\n');
                break;

            case '.position':
            case '.pos':
                const position = bot.entity.position;
                console.log(`[+] Позиция бота: ${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)}`);
                bot.chat(`@[+] Стою на координатах: ${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)}`);
                break;

            // для нескольких ботов типо команды поняли??
            case '.botadd':
            case '.badd':
                if (args.length < 3) {
                    console.log('[X] Использование: .botadd (.badd) [IP] [порт] [ник]');
                    console.log('    Пример: .botadd 8.8.8.8 25565 roskomnadzor');
                } else {
                    const host = args[0];
                    const port = args[1];
                    const username = args[2];
                    
                    if (isNaN(port)) {
                        console.log('[X] Некорректный порт');
                        break;
                    }
                    
                    const botId = addBot(host, port, username);
                    if (botId) {
                        return;
                    }
                }
                break;

            case '.botdel':
            case '.bdel':
                if (args.length < 1) {
                    console.log('[X] Использование: .botdel (.bdel) [номер_бота/ник]');
                    console.log('    Пример: .botdel 1 или .botdel roskomnadzor');
                } else {
                    const botIdOrUsername = args[0];
                    if (removeBot(botIdOrUsername)) {
                        console.log(`[+] Бот ${botIdOrUsername} успешно удален`);
                    }
                }
                break;

            case '.botrun':
            case '.brun':
                if (args.length < 2) {
                    console.log('[X] Использование: .botrun (.brun) [номер_бота/ник] [команда] - выполнить команду для бота');
                    console.log('    Пример: .botrun 1 Привет всем!');
                    console.log('    Пример: .botrun roskomnadzor .join mw surv 1');
                } else {
                    const botIdOrUsername = args[0];
                    const command = args.slice(1).join(' ');
                    
                    if (runBotCommand(botIdOrUsername, command)) {
                        return;
                    }
                }
                break;

            case '.botlog':
            case '.blog':
                if (args.length < 2) {
                    console.log('[X] Использование: .botlog (.blog) [номер_бота/ник] [on/off]');
                    console.log('    Пример: .botlog 1 off');
                    console.log('    Пример: .blog roskomnadzor on');
                } else {
                    const botIdOrUsername = args[0];
                    const enabled = args[1].toLowerCase() === 'on';
                    
                    if (setBotLog(botIdOrUsername, enabled)) {
                        return;
                    }
                }
                break;

            case '.botlist':
            case '.blist':
                listBots();
                break;

            default:
                console.log('[X] Неизвестная команда');
                console.log('[?] Введите .help для списка команд');
        }
    });
}

function joinServer(bot, server, mode, serverNumber) {
    try {
        if (!serverConfigs[server]) {
            console.log(`[X] Неизвестный сервер: ${server}`);
            console.log('[?] Доступные серверы: mw, lm, fg, bm, sm, tm, ms');
            return;
        }

        if (!['surv', 'sb'].includes(mode)) {
            console.log(`[X] Неизвестный режим: ${mode}`);
            console.log('[?] Доступные режимы: surv, sb');
            return;
        }

        const maxServers = serverConfigs[server][mode];
        if (serverNumber < 1 || serverNumber > maxServers) {
            console.log(`[X] Некорректный номер сервера: ${serverNumber}`);
            console.log(`[?] Для ${server} в режиме ${mode} доступны номера от 1 до ${maxServers}`);
            return;
        }

        bot.activateItem();
        console.log(`[+] Заходим на ${server} ${mode} ${serverNumber}`);
        bot.chat(`[+] Заходим на ${server} ${mode} ${serverNumber}`);
        
        bot.on("windowOpen", window => {
            bot.removeAllListeners('windowOpen');
        });
        
        bot.on('windowOpen', (window) => {
            const modeClickIndex = mode === 'surv' ? 2 : 0;
            bot.clickWindow(modeClickIndex, 0, 0);

            setTimeout(() => {
                const serverClickIndex = serverNumber - 1;
                bot.clickWindow(serverClickIndex, 0, 0);

                setTimeout(() => {
                    if (bot.currentWindow && bot.currentWindow.id !== 0) {
                        bot.closeWindow(bot.currentWindow);
                        console.log('[+] Интерфейс закрыт');

                        setTimeout(() => {
                            if (bot.currentWindow && bot.currentWindow.id !== 0) {
                                console.log('[!] Интерфейс не закрылся, принудительно закрываю...');
                                bot.closeWindow(bot.currentWindow);
                            }
                        }, 200);
                    }
                }, 500);
            }, 300);
        });
        
    } catch (err) {
        console.log('[X] Ошибка:', err.message);
    }
}

async function moderateMessage(text) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ text });
        const options = {
            hostname: 'localhost',
            port: 8000,
            path: '/moderate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data, 'utf8')
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    resolve(json);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(data, 'utf8');
        req.end();
    });
}

process.on('SIGINT', () => {
    console.log('\n[X] Завершение работы...');
    rl.close();
    process.exit(0);
});

try {
    require.resolve('socks');
} catch {
    console.log('\n[X] Для работы с прокси необходимо установить пакет socks:');
    console.log('[*] npm install socks\n');
    process.exit(1);
}

function addBot(host, port, username) {
    const botId = nextBotId++;
    const config = {
        host: host,
        port: parseInt(port),
        username: username,
        version: '1.20.1'
    };
    
    console.log(`[+] Добавляем бота #${botId}: ${username} на ${host}:${port}`);
    
    try {
        const bot = createBotWithProxy(config);

        bots.set(botId, {
            bot: bot,
            config: config,
            username: username,
            id: botId
        });
        
        botLogs.set(botId, true);
        
        setupBotEventHandlers(bot, botId);
        
        console.log(`[+] Бот #${botId} (${username}) успешно добавлен`);
        return botId;
    } catch (error) {
        console.log(`[X] Ошибка при добавлении бота #${botId}: ${error.message}`);
        return null;
    }
}

function removeBot(botIdOrUsername) {
    let botId = null;
    
    if (!isNaN(botIdOrUsername)) {
        botId = parseInt(botIdOrUsername);
    } else {
        for (const [id, botInfo] of bots.entries()) {
            if (botInfo.username === botIdOrUsername) {
                botId = id;
                break;
            }
        }
    }
    
    if (!botId || !bots.has(botId)) {
        console.log(`[X] Бот не найден: ${botIdOrUsername}`);
        return false;
    }
    
    const botInfo = bots.get(botId);
    console.log(`[+] Отключаем бота #${botId} (${botInfo.username})`);
    
    try {
        botInfo.bot.quit();
        bots.delete(botId);
        botLogs.delete(botId);
        console.log(`[+] Бот #${botId} (${botInfo.username}) успешно удален`);
        return true;
    } catch (error) {
        console.log(`[X] Ошибка при удалении бота #${botId}: ${error.message}`);
        return false;
    }
}

function runBotCommand(botIdOrUsername, command) {
    // обработка команды для всех ботов
    if (botIdOrUsername.toLowerCase() === 'all') {
        if (bots.size === 0) {
            console.log('[X] Нет активных ботов для выполнения команды');
            return false;
        }
        
        console.log(`[+] Выполняем команду для всех ботов (${bots.size} шт.): ${command}`);
        
        let successCount = 0;
        for (const [botId, botInfo] of bots.entries()) {
            const bot = botInfo.bot;
            
            if (!bot || !bot.player) {
                console.log(`[!] Бот #${botId} (${botInfo.username}) не подключен, пропускаем`);
                continue;
            }
            
            try {
                if (command.startsWith('.')) {
                    if (executeRemoteBotCommand(bot, botId, command)) {
                        successCount++;
                    }
                } else {
                    bot.chat(command);
                    successCount++;
                }
            } catch (error) {
                console.log(`[X] Ошибка при выполнении команды для бота #${botId}: ${error.message}`);
            }
        }
        
        console.log(`[+] Команда выполнена для ${successCount}/${bots.size} ботов`);
        return successCount > 0;
    }
    
    // обработка команды для нескольких ботов (через запятую)
    if (botIdOrUsername.includes(',')) {
        const botIds = botIdOrUsername.split(',').map(id => id.trim());
        let successCount = 0;
        
        console.log(`[+] Выполняем команду для ботов [${botIds.join(', ')}]: ${command}`);
        
        for (const botIdStr of botIds) {
            let botId = null;
            
            if (!isNaN(botIdStr)) {
                botId = parseInt(botIdStr);
            } else {
                for (const [id, botInfo] of bots.entries()) {
                    if (botInfo.username === botIdStr) {
                        botId = id;
                        break;
                    }
                }
            }
            
            if (!botId || !bots.has(botId)) {
                console.log(`[X] Бот не найден: ${botIdStr}`);
                continue;
            }
            
            const botInfo = bots.get(botId);
            const bot = botInfo.bot;
            
            if (!bot || !bot.player) {
                console.log(`[!] Бот #${botId} (${botInfo.username}) не подключен, пропускаем`);
                continue;
            }
            
            try {
                if (command.startsWith('.')) {
                    if (executeRemoteBotCommand(bot, botId, command)) {
                        successCount++;
                    }
                } else {
                    bot.chat(command);
                    successCount++;
                }
            } catch (error) {
                console.log(`[X] Ошибка при выполнении команды для бота #${botId}: ${error.message}`);
            }
        }
        
        console.log(`[+] Команда выполнена для ${successCount}/${botIds.length} ботов`);
        return successCount > 0;
    }
    
    // для одного бота
    let botId = null;
    
    if (!isNaN(botIdOrUsername)) {
        botId = parseInt(botIdOrUsername);
    } else {
        for (const [id, botInfo] of bots.entries()) {
            if (botInfo.username === botIdOrUsername) {
                botId = id;
                break;
            }
        }
    }
    
    if (!botId || !bots.has(botId)) {
        console.log(`[X] Бот не найден: ${botIdOrUsername}`);
        return false;
    }
    
    const botInfo = bots.get(botId);
    const bot = botInfo.bot;
    
    if (!bot || !bot.player) {
        console.log(`[X] Бот #${botId} (${botInfo.username}) не подключен`);
        return false;
    }
    
    console.log(`[+] Выполняем команду для бота #${botId} (${botInfo.username}): ${command}`);
    
    if (command.startsWith('.')) {
        return executeRemoteBotCommand(bot, botId, command);
    } else {
        bot.chat(command);
    }
    
    return true;
}

function executeRemoteBotCommand(bot, botId, command) {
    const parts = command.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);
    
    switch(cmd) {
        case '.analyze':
            if (args[0] === 'on') {
                if (bot.analyzeMode) {
                    console.log('[!] Анализ уже включён!');
                    break;
                }
                bot.analyzeMode = true;
                bot.analyzeLogFile = getAnalyzeLogFileName(bot);
                bot.analyzeLogStream = fs.createWriteStream(bot.analyzeLogFile, { flags: 'a' });
                const now = new Date();
                const dateStr = now.toLocaleDateString('ru-RU');
                const timeStr = now.toLocaleTimeString('ru-RU', { hour12: false });
                bot.analyzeLogStream.write('=== ANALYZE LOG ===\n');
                bot.analyzeLogStream.write(`time: ${timeStr}\n`);
                bot.analyzeLogStream.write(`date: ${dateStr}\n`);
                bot.analyzeLogStream.write(`bot nickname: ${bot.username}\n`);
                bot.analyzeLogStream.write('=== ANALYZE LOG ===\n\n');
                console.log(`[+] Анализ чата включён. Лог пишется в файл: ${bot.analyzeLogFile}`);
                bot.chat(`@[+] Анализ чата включён! Никнейм: ${bot.username} | Дата: ${dateStr} | Время: ${timeStr}`);
                //bot.chat('!Привет! Я - специальный помощник проекта "roskomnazdor" от goddamnblessed и nithbann, и я помогаю ловить нарушителей на этом сервере. Для улучшения качества работы все сообщения будут записываться.')
            } else if (args[0] === 'off') {
                if (!bot.analyzeMode) {
                    console.log('[!] Анализ уже выключен!');
                    break;
                }
                bot.analyzeMode = false;
                if (bot.analyzeLogStream) {
                    bot.analyzeLogStream.end();
                    bot.analyzeLogStream = null;
                    console.log('[+] Анализ чата выключен. Файл закрыт.');
                }
            } else {
                console.log('[?] Использование: .analyze on|off');
            }
            break;
            
        // ЕСЛИ ВЫ ПОЧИНИЛИ .join САМОСТОЯТЕЛЬНО, ВНЕСИТЕ ИЗМЕНЕНИЯ И СЮДА
        case '.join':
            if (args.length < 3) {
                console.log('[X] Использование: .join [сервер] [режим] [номер]');
                console.log('    Серверы: mw, lm, fg, bm, sm, tm, ms');
                console.log('    mw - MusteryWorld');
                console.log('    lm - LastMine');
                console.log('    fg - FunnyGames');
                console.log('    bm - BarsMine');
                console.log('    sm - SuperMine');
                console.log('    tm - TopMine');
                console.log('    ms - MineStars');
                console.log('    Режимы: surv, sb');
                console.log('    Пример: .join mw surv 3');
                console.log('\n    Доступные серверы:');
                for (const [server, config] of Object.entries(serverConfigs)) {
                    console.log(`      ${server}: surv(1-${config.surv}), sb(1-${config.sb})`);
                }
            } else {
                const server = args[0];
                const mode = args[1];
                const serverNumber = parseInt(args[2]);
                
                if (isNaN(serverNumber)) {
                    console.log('[X] Некорректный аргумент');
                    break;
                }
                
                joinServer(bot, server, mode, serverNumber);
            }
            break;

        case '.moderator':
        case '.mod':
            if (args[0] === 'on') {
                bot.moderatorMode = true;
                console.log('[+] Режим модератора включён!');
                bot.chat('@[+] Режим модератора включён!');
            } else if (args[0] === 'off') {
                bot.moderatorMode = false;
                console.log('[+] Режим модератора выключен!');
                bot.chat('@[+] Режим модератора выключен!');
            } else {
                console.log('[?] Использование: .moderator (.mod) on|off');
            }
            break;

        case '.autoreport':
        case '.arep':
            if (args[0] === 'on') {
                bot.autoreportMode = true;
                console.log('[+] Режим автожалоб включён!');
                bot.chat('@[+] Режим автожалоб включён!');
            } else if (args[0] === 'off') {
                bot.autoreportMode = false;
                console.log('[+] Режим автожалоб выключен!');
                bot.chat('@[+] Режим автожалоб выключен!');
            } else {
                console.log('[?] Использование: .autoreport (.arep) on|off');
            }
            break;

        case '.api':
            if (args[0] === 'on') {
                bot.apiMode = true;
                console.log('[+] Ответы от нейросети включены!');
                console.log('[!] Обратите внимание, что ответы не будут работать без запущенного python-скрипта с нейросетью!')
                bot.chat('@[+] Ответы от нейросети включены!');
            } else if (args[0] === 'off') {
                bot.apiMode = false;
                console.log('[+] Ответы от нейросети выключены!');
                bot.chat('@[+] Ответы от нейросети выключены!');
            } else {
                console.log('[?] Использование: .api on|off');
            }
            break;

        case '.playerlist':
        case '.pl':
            console.log('\n=== СПИСОК ИГРОКОВ НА СЕРВЕРЕ ===');
            
            console.log('\n[1] Видимые игроки (bot.players):');
            const visiblePlayers = Object.keys(bot.players);
            if (visiblePlayers.length > 0) {
                visiblePlayers.forEach((username, index) => {
                    const player = bot.players[username];
                    console.log(`   ${index + 1}. ${username} (UUID: ${player.uuid})`);
                });
            } else {
                console.log('   Нет видимых игроков');
            }
                
            console.log('\n[2] Все игроки через entities:');
            const allPlayers = Object.values(bot.entities).filter(entity => entity.type === 'player');
            if (allPlayers.length > 0) {
                allPlayers.forEach((player, index) => {
                    console.log(`   ${index + 1}. ${player.username || 'Unknown'} (ID: ${player.id})`);
                });
            } else {
                console.log('   Нет игроков в entities');
            }
            console.log('\n=== ИТОГО ===');
            console.log(`Видимых игроков: ${visiblePlayers.length}`);
            console.log(`Игроков в entities: ${allPlayers.length}`);
            console.log('================================\n');
            break;

        case '.position':
        case '.pos':
            const position = bot.entity.position;
            console.log(`[+] Позиция бота: ${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)}`);
            bot.chat(`@[+] Стою на координатах: ${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)}`);
            break;
            
        default:
            console.log(`[X] Неизвестная внутренняя команда: ${cmd}`);
            return false;
    }
    
    return true;
}

function setBotLog(botIdOrUsername, enabled) {
    let botId = null;

    if (!isNaN(botIdOrUsername)) {
        botId = parseInt(botIdOrUsername);
    } else {
        for (const [id, botInfo] of bots.entries()) {
            if (botInfo.username === botIdOrUsername) {
                botId = id;
                break;
            }
        }
    }
    
    if (!botId || !bots.has(botId)) {
        console.log(`[X] Бот не найден: ${botIdOrUsername}`);
        return false;
    }
    
    const botInfo = bots.get(botId);
    botLogs.set(botId, enabled);
    
    console.log(`[+] Логирование бота #${botId} (${botInfo.username}) ${enabled ? 'включено' : 'выключено'}`);
    return true;
}

function listBots() {
    console.log('[+] Список активных ботов:');
    
    if (bots.size === 0) {
        console.log('   Нет активных ботов');
    } else {
        for (const [botId, botInfo] of bots.entries()) {
            const status = botInfo.bot && botInfo.bot.player ? 'подключен' : 'отключен';
            const logs = botLogs.get(botId) ? 'вкл' : 'выкл';
            console.log(`   #${botId}: ${botInfo.username} (${botInfo.config.host}:${botInfo.config.port}) - ${status} [логи: ${logs}]`);
        }
    }
}

function setupBotEventHandlers(bot, botId) {
    const botInfo = bots.get(botId);
    
    bot.on('login', () => {
        bot.autoreportMode = false;
        bot.analyzeMode = false;
        bot.analyzeLogStream = null;
        bot.analyzeLogFile = '';
        bot.apiMode = true;
        bot.aimbotTarget = null;
        bot.aimbotInterval = null;
        bot.lastAttackTime = 0;
        bot.moderatorMode = false;
        bot.danceInterval = null;
        bot.danceLookInterval = null;
        
        if (botLogs.get(botId)) {
            console.log(`[${botInfo.username} - #${botId}] [+] Бот успешно подключился к серверу!`);
        }
    });
    
    bot.on('message', (jsonMsg) => {
        if (!botLogs.get(botId)) return;
        
        const text = jsonMsg.toString();
        const timestamp = new Date().toLocaleTimeString('ru-RU', { hour12: false });
        
        console.log(`[${botInfo.username} - #${botId}] [${timestamp}] ${text}`);
        
        // запись в analyze log если включен
        if (bot.analyzeMode && bot.analyzeLogStream) {
            bot.analyzeLogStream.write(`[${timestamp}] ${text}\n`);
        }
    });
    
    bot.on('error', (err) => {
        console.log(`[${botInfo.username}] [X] Ошибка подключения: ${err.message}`);
    });
    
    bot.on('kicked', (reason, loggedIn) => {
        if (botLogs.get(botId)) {
            console.log(`[${botInfo.username}] [X] Кикнут по причине: ${reason}`);
        }
    });
    
    bot.on('end', () => {
        if (botLogs.get(botId)) {
            console.log(`[${botInfo.username}] [X] Бот отключился от сервера`);
        }
    });
    
    bot.on('death', () => {
        if (botLogs.get(botId)) {
            console.log(`[${botInfo.username}] [X] Бот умер в игре`);
        }
    });
}

function getAnalyzeLogFileName(bot) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('ru-RU').replace(/\./g, '-');
    const timeStr = now.toLocaleTimeString('ru-RU', { hour12: false }).replace(/:/g, '-');
    return `analyzeLog_${bot.username}_${dateStr}_${timeStr}.txt`;
}

console.clear();
console.log(`
                     __                                    .___                   
_______  ____  _____|  | ______   _____   ____ _____     __| _/__________________ 
\\_  __ \\/  _ \\/  ___/  |/ /  _ \\ /     \\ /    \\\\__  \\   / __ |\\___   /  _ \\_  __ \\
 |  | \\(  <_> )___ \\|    <  <_> )  Y Y  \\   |  \\/ __ \\_/ /_/ | /    (  <_> )  | \\/
 |__|   \\____/____  >__|_ \\____/|__|_|  /___|  (____  /\\____ |/_____ \\____/|__|   
                  \\/     \\/           \\/     \\/     \\/      \\/      \\/             
`);
console.log('                           stronger, smarter, better.\n')
console.log('                    project by goddamnblessed and nithbann\n\n')
console.log('[*] Привет! Это настройка подключения к Minecraft серверу.\n');
askConfig();
