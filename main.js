const mineflayer = require('mineflayer');
const readline = require('readline');
const Socks = require('socks').SocksClient;
const vec3 = require('vec3');
const { mineflayer: createViewer } = require('prismarine-viewer');

process.on('warning', (warning) => {
    if (!warning.message.includes('is deprecated. Use entity.displayName instead')) {
        console.warn(warning.name, warning.message);
    }
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// МОЖНО ДОБАВИТЬ СВОИ БАНВОРДЫ И ДРУГИЕ ТРИГГЕРЫ ПУТЕМ ДОБАВЛЕНИЯ В МАССИВЫ ВНИЗУ
const banwords = ['мудила', 'пидор', 'пидорас', 'ебал', 'пздц', 'ебу', 'чмо', 'хуй', 'хуи']
const message_ads = ['заход', 'анка', 'анархия', 'гриф', 'айпи', 'ip', 'бесплатный', 'опка', 'free', 'бесплатный донат', 'бесплатный донат', 'free op', 'бесплатная опка']
const message_cheat_ads = ['thunderhack', 'neverlose', 'neverlose.cc', 'nursultan', 'celestial', 'catlavan', 'catlean', 'wexside', 'тх', 'тандерхак', 'неверлуз', 'нурик', 'нурсултан', 'целка', 'целестиал', 'катлаван']
const message_scum_ads = ['скам', 'раздача доната', 'раздача дк', 'раздача донат кейсов', 'раздача титул кейсов', 'раздача кейсов', 'раздача донат', 'раздача тк']
const message_incitement = ['дай акк', 'продай акк', 'акк', 'аккаунт', 'продам акк', 'куплю акк']
const message_server_abuse = ['сервер говн', 'сервер гавн', 'сервер хуй', 'серв говн', 'серв гавн', 'серв хуй']
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
    '4.11': '4.11 Разбан/размут нарушителя. (Наказание: бан 4 часа);м',
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
        commandMode(bot);
    });

    // viewer init
    bot.once('spawn', () => {
        createViewer(bot, { 
            port: 1488,
            firstPerson: true,
            viewDistance: 4
        });
        const oldLog = console.log;
        console.log = function(...args) {
            if (typeof args[0] === 'string' && args[0].includes('Prismarine viewer web server running on')) {
                oldLog('[+] Зрение бота доступно по адресу http://localhost:1488');
            } else {
                oldLog(...args);
            }
        };

        // o_0
        bot.on('message', (jsonMsg) => {
            const timestamp = new Date().toLocaleTimeString('ru-RU', { hour12: false });
            const text = jsonMsg.toString();
            const nickMatch = text.match(/^[^|]+\|\s*\[[^\]]+\]\s*([^\s\[\]*]+).*➯/);
            let nickname = '???';
            if (nickMatch) {
                nickname = nickMatch[1];
            }
            // вывод в консоль
            console.log(`[${timestamp}] ${text}`);
            // модерация
            if (bot.moderatorMode) {
                const msgMatch = text.match(/➯\s*(.+)$/i);
                if (msgMatch) {
                    const message = msgMatch[1].toLowerCase();
                    let triggered = false;

                    // банворды
                    for (const word of banwords) {
                        if (message.includes(word)) {
                            bot.chat(`@[MOD] Банворд в сообщении: "${message}" | detected: ${word} | Никнейм: ${nickname} | Время: ${timestamp}`);
                            waitingRealname = nickname;
                            setTimeout(() => {
                                bot.chat(`/realname ${nickname}`);
                            }, 150);
                            console.log(`[MOD] Обнаружен банворд "${word}" в сообщении: ${jsonMsg}`);
                            triggered = true;
                            break;
                        }
                    }
                    if (triggered) return;

                    // реклама
                    for (const word of message_ads) {
                        if (message.includes(word)) {
                            bot.chat(`@[MOD] Возможно реклама или созыв в сообщении: "${message}" | detected: ${word} | Никнейм: ${nickname} | Время: ${timestamp}`);
                            waitingRealname = nickname;
                            setTimeout(() => {
                                bot.chat(`/realname ${nickname}`);
                            }, 150);
                            console.log(`[MOD] Обнаружена возможная реклама или созыв "${word}" в сообщении: ${jsonMsg}`);
                            triggered = true;
                            break;
                        }
                    }
                    if (triggered) return;

                    // реклама читов
                    for (const word of message_cheat_ads) {
                        if (message.includes(word)) {
                            bot.chat(`@[MOD] Возможно реклама чит-клиентов в сообщении: "${message}" | detected: ${word} | Никнейм: ${nickname} | Время: ${timestamp}`);
                            waitingRealname = nickname;
                            setTimeout(() => {
                                bot.chat(`/realname ${nickname}`);
                            }, 150);
                            console.log(`[MOD] Обнаружена возможная реклама чит-клиентов "${word}" в сообщении: ${jsonMsg}`);
                            triggered = true;
                            break;
                        }
                    }
                    if (triggered) return;

                    // скам
                    for (const word of message_scum_ads) {
                        if (message.includes(word)) {
                            bot.chat(`@[MOD] Возможно скам в сообщении: "${message}" | detected: ${word} | Никнейм: ${nickname} | Время: ${timestamp}`);
                            waitingRealname = nickname;
                            setTimeout(() => {
                                bot.chat(`/realname ${nickname}`);
                            }, 150);
                            console.log(`[MOD] Кого-то хотят обмануть "${word}" в сообщении: ${jsonMsg}`);
                            triggered = true;
                            break;
                        }
                    }
                    if (triggered) return;

                    // подстрекательство
                    for (const word of message_incitement) {
                        if (message.includes(word)) {
                            bot.chat(`@[MOD] Возможно подстрекательство на нарушение в сообщении: "${message}" | detected: ${word} | Никнейм: ${nickname} | Время: ${timestamp}`);
                            waitingRealname = nickname;
                            setTimeout(() => {
                                bot.chat(`/realname ${nickname}`);
                            }, 150);
                            console.log(`[MOD] Обнаружено подстрекательство на нарушение "${word}" в сообщении: ${jsonMsg}`);
                            triggered = true;
                            break;
                        }
                    }
                    if (triggered) return;

                    // оск сервера
                    for (const word of message_server_abuse) {
                        if (message.includes(word)) {
                            bot.chat(`@[MOD] Возможно оскорбление сервера в сообщении: "${message}" | detected: ${word} | Никнейм: ${nickname} | Время: ${timestamp}`);
                            waitingRealname = nickname;
                            setTimeout(() => {
                                bot.chat(`/realname ${nickname}`);
                            }, 150);
                            console.log(`[MOD] Обнаружено оскорбление сервера "${word}" в сообщении: ${jsonMsg}`);
                            triggered = true;
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
                // на баны тоже но эт если вдруг забанит кто-то кого-то
                const banMatch = text.match(/Причина:\s*(\d+\.\d+)/i);
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
                // проверка на null
                if (!text.includes('Настоящее имя игрока null')) {
                    bot.chat(`@[MOD] ${text}`);
                    console.log(`[MOD] ${text}`);
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
        rl.close();
        process.exit(1);
    });

    bot.on('end', () => {
        console.log('[X] Бот отключился от сервера');
        rl.close();
        process.exit(0);
    });
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
            case '.attack':
            case '.a':
                performAttack(bot);
                break;              

            case '.head':
            case '.h':
                if (args.length < 2) {
                    console.log('[X] Использование: .head [направление] [градусы]');
                    console.log('    Направления: right(r)/left(l)/up(u)/down(d)');
                } else {
                    const direction = args[0].toLowerCase();
                    const degrees = parseFloat(args[1]);
                    
                    if (isNaN(degrees)) {
                        console.log('[X] Некорректное значение градусов');
                        break;
                    }

                    const radians = degrees * (Math.PI / 180);
                    let yaw = bot.entity.yaw;
                    let pitch = bot.entity.pitch;

                    switch(direction) {
                        case 'right':
                        case 'r':
                            yaw -= radians;
                            break;
                        case 'left':
                        case 'l':
                            yaw += radians;
                            break;
                        case 'down':
                        case 'd':
                            pitch -= radians;
                            break;
                        case 'up':
                        case 'u':
                            pitch += radians;
                            break;
                        default:
                            console.log('[X] Неизвестное направление');
                            return;
                    }

                    bot.look(yaw, pitch, false);
                    console.log(`[+] Повернул голову: ${direction} на ${degrees}°`);
		            bot.chat(`[+] Повернул голову: ${direction} на ${degrees}`)
                }
                break;

            case '.walk':
            case '.w':
                if (args.length < 2) {
                    console.log('[X] Использование: .walk [направление] [кол-во секунд, 0.5 = 1 блок]');
                    console.log('    Направления: forward(f)/back(b)/right(r)/left(l)');
                } else {
                    const direction = args[0].toLowerCase();
                    const blocks = parseFloat(args[1]);
                    
                    if (isNaN(blocks)) {
                        console.log('[X] Некорректное значение блоков');
                        break;
                    }

                    const controls = {
                        forward: false,
                        back: false,
                        left: false,
                        right: false
                    };

                    switch(direction) {
                        case 'forward':
                        case 'f':
                            controls.forward = true;
                            break;
                        case 'back':
                        case 'b':
                            controls.back = true;
                            break;
                        case 'right':
                        case 'r':
                            controls.right = true;
                            break;
                        case 'left':
                        case 'l':
                            controls.left = true;
                            break;
                        default:
                            console.log('[X] Неизвестное направление');
                            return;
                    }

                    bot.setControlState('forward', controls.forward);
                    bot.setControlState('back', controls.back);
                    bot.setControlState('left', controls.left);
                    bot.setControlState('right', controls.right);

                    setTimeout(() => {
                        bot.setControlState('forward', false);
                        bot.setControlState('back', false);
                        bot.setControlState('left', false);
                        bot.setControlState('right', false);
                        console.log(`[+] Шагал ${blocks} сек. в направлении ${direction}`)
			            bot.chat(`[+] Шагал ${blocks} сек. в направлении ${direction}`);
                    }, blocks * 500); // 0.5 = 1 block
                }
                break;

            case '.help':
            case '.h':
                console.log('[?] Доступные команды:');
                console.log('     .attack(.a) - ударить');
                console.log('     .head(.h) [направление] [градусы] - повернуть голову');
                console.log('         направления: right(r)/left(l)/up(u)/down(d)');
                console.log('     .walk(.w) [направление] [кол-во секунд, 0.5 = 1 блок] - пройти расстояние');
                console.log('         направления: forward(f)/back(b)/right(r)/left(l)');
                console.log('     .help - показать эту справку');
                console.log('     .debug - дебаг');
                console.log('     .jump(.j) - обычный прыжок');
                console.log('     .jump(.j) multi [N] - прыгнуть N раз');
                console.log('     .surv1(.s1) - зайти на 1 выживание');
                console.log('     .surv2(.s2) - зайти на 2 выживание');
                console.log('     .surv3(.s3) - зайти на 3 выживание');
                console.log('     .surv4(.s4) - зайти на 4 выживание');
                console.log('     .surv5(.s5) - зайти на 5 выживание');
                console.log('     .surv6(.s6) - зайти на 6 выживание');
                console.log('     .dance - станцевать лезгинку на минуту');
                console.log('     .position(.pos) - бот отправит свои координаты в клан-чат');
                console.log('     .playerlist(.pl) - посмотреть сколько игроков на сервере');
                console.log('     .moderator(.mod) on/off - включить/выключить модерацию (ТРЕБУЕТСЯ КЛАН!)');
                
                console.log('\n     Любой текст без точки будет отправлен в чат');
                break;
            
            case '.surv1':
            case '.s1':
                try {
                    bot.activateItem()
                    console.log('[+] Заходим на 1 выжу')
                    bot.on("windowOpen", window => {
                    })
                    bot.on('windowOpen', (window) => {
                        bot.clickWindow(2, 0, 0)

                        setTimeout(() => {
                            bot.clickWindow(0, 0, 0)
                        }, 300)
                    })
                } catch (err) {
                    console.log('[X] Ошибка:', err.message);
                }
                break;
            
            case '.surv2':
            case '.s2':
                try {
                    bot.activateItem()
                    console.log('[+] Заходим на 2 выжу')
                    bot.on("windowOpen", window => {
                    })
                    bot.on('windowOpen', (window) => {
                        bot.clickWindow(2, 0, 0)

                        setTimeout(() => {
                            bot.clickWindow(1, 0, 0)
                        }, 300)
                    })
                } catch (err) {
                    console.log('[X] Ошибка:', err.message);
                }
                break;
            
            case '.surv3':
            case '.s3':
                try {
                    bot.activateItem()
                    console.log('[+] Заходим на 3 выжу')
                    bot.on("windowOpen", window => {
                    })
                    bot.on('windowOpen', (window) => {
                        bot.clickWindow(2, 0, 0)

                        setTimeout(() => {
                            bot.clickWindow(2, 0, 0)
                        }, 300)
                    })
                } catch (err) {
                    console.log('[X] Ошибка:', err.message);
                }
                break;
            
            case '.surv4':
            case '.s4':
                try {
                    bot.activateItem()
                    console.log('[+] Заходим на 4 выжу')
                    bot.on("windowOpen", window => {
                    })
                    bot.on('windowOpen', (window) => {
                        bot.clickWindow(2, 0, 0)

                        setTimeout(() => {
                            bot.clickWindow(3, 0, 0)
                        }, 300)
                    })
                } catch (err) {
                    console.log('[X] Ошибка:', err.message);
                }
                break;
            
            case '.surv5':
            case '.s5':
                try {
                    bot.activateItem()
                    console.log('[+] Заходим на 5 выжу')
                    bot.on("windowOpen", window => {
                    })
                    bot.on('windowOpen', (window) => {
                        bot.clickWindow(2, 0, 0)

                        setTimeout(() => {
                            bot.clickWindow(4, 0, 0)
                        }, 300)
                    })
                } catch (err) {
                    console.log('[X] Ошибка:', err.message);
                }
                break;
            
            case '.surv6':
            case '.s6':
                try {
                    bot.activateItem()
                    console.log('[+] Заходим на 6 выжу')
                    bot.on("windowOpen", window => {
                    })
                    bot.on('windowOpen', (window) => {
                        bot.clickWindow(2, 0, 0)

                        setTimeout(() => {
                            bot.clickWindow(5, 0, 0)
                        }, 300)
                    })
                } catch (err) {
                    console.log('[X] Ошибка:', err.message);
                }
                break;
                
            case '.debug':
                const target = bot.entityAtCursor();
                const heldItem = bot.heldItem;
                const yaw = bot.entity.yaw;
                const pitch = bot.entity.pitch;
                
                // конвертация углов (бывает тупит и выводит +3000 градусов)
                const yawDeg = Math.round(yaw * (180 / Math.PI));
                const pitchDeg = Math.round(pitch * (180 / Math.PI));
    
                let direction;
                if (yawDeg >= -45 && yawDeg < 45) direction = 'north';
                else if (yawDeg >= 45 && yawDeg < 135) direction = 'west';
                else if (yawDeg >= 135 || yawDeg < -135) direction = 'south';
                else direction = 'east';
    
                console.log('--- Debug Info ---');
                console.log('Цель в прицеле:', target ? `${target.name} (${target.type})` : 'нет');
                console.log('Предмет в руке:', heldItem ? `${heldItem.name}` : 'нет');
                console.log('Позиция бота:', bot.entity.position.floored());
                console.log('Направление головы:');
                console.log(`   Yaw: ${yawDeg}° (${direction})`);
                console.log(`   Pitch: ${pitchDeg}° (${pitchDeg > 0 ? 'up' : 'down'})`);
    
                // инфа что перед ботом
                const block = bot.blockAtCursor(4);
                if (block) {
                    console.log('Блок перед глазами:', `${block.name} (${block.position})`);
                    console.log('Дистанция до блока:', 
                        block.position.distanceTo(bot.entity.position).toFixed(2), 'блоков');
                } else {
                    console.log('Блок перед глазами: нет в радиусе 4 блоков');
                }
                break;
              
            case '.jump':
            case '.j':
                // АААА БЛЯЯЯ Я ПРЫГАЮ??!!?!?
                if (args.length === 0) {
                    bot.setControlState('jump', true);
                    setTimeout(() => {
                        bot.setControlState('jump', false);
                        console.log('[+] Прыжок выполнен');
			            bot.chat('[+] Прыгнул!')
                    }, 300);
                }
                
                else if (args[0] === 'multi' && args[1]) {
                    const count = parseInt(args[1]);
                    if (!isNaN(count) && count > 0) {
                        console.log(`[~] Прыгаю ${count} раз...`);
			            bot.chat(`[~] Прыгаю ${count} раз...`)
                        let jumps = 0;
                        const interval = setInterval(() => {
                            bot.setControlState('jump', true);
                            setTimeout(() => {
                                bot.setControlState('jump', false);
                                jumps++;
                                if (jumps >= count) {
                                    clearInterval(interval);
                                    console.log('[+] Все прыжки выполнены');
                                    bot.chat('[+] Все прыжки выполнены');
                                }
                            }, 500);
                        }, 500); 
                    } else {
                        console.log('[X] Укажите корректное число прыжков: .jump multi 3');
                    }
                }
                else {
                    console.log('[X] Неизвестный вариант прыжка');
                    console.log('[?] Доступные варианты:');
                    console.log('     .jump          - обычный прыжок');
                    console.log('     .jump multi [N]  - прыгнуть N раз');
                }
                break;

            case '.dance':
                if (bot.danceInterval) {
                    clearInterval(bot.danceInterval);
                    bot.danceInterval = undefined;
                    bot.setControlState('sneak', false);
                }
                if (bot.danceLookInterval) {
                    clearInterval(bot.danceLookInterval);
                    bot.danceLookInterval = undefined;
                }
                console.log('[+] Начинаем жестко исполнять!');
                bot.setControlState('jump', true);

                let sneakState = true;
                const danceInterval = setInterval(() => {
                    sneakState = !sneakState;
                    bot.setControlState('sneak', sneakState);
                }, 100);
                bot.danceInterval = danceInterval;

                const danceLookInterval = setInterval(() => {
                    const yaw = bot.entity.yaw + (Math.random() - 0.5) * Math.PI; // +-90°
                    const pitch = (Math.random() - 0.5) * (Math.PI / 1); // +-90°
                    bot.look(yaw, pitch, true);
                }, 5);
                bot.danceLookInterval = danceLookInterval;

                setTimeout(() => {
                    console.log('[+] Прекращаем жестко исполнять (прошла минута)');
                    bot.setControlState('jump', false);
                    if (bot.danceInterval) {
                        clearInterval(bot.danceInterval);
                        bot.danceInterval = undefined;
                    }
                    if (bot.danceLookInterval) {
                        clearInterval(bot.danceLookInterval);
                        bot.danceLookInterval = undefined;
                    }
                    bot.setControlState('sneak', false);
                }, 60000);
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
                    console.log('[?] Использование: .moderator on|off');
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
                console.log('[X] Неизвестная команда');
                console.log('[?] Введите .help для списка команд');
        }
    });
}

function performAttack(bot) {
    console.log('[~] Выполняю удар...');
    bot.chat('[+] Атакую!')
    
    try {
        bot.swingArm('right');
        const entity = bot.entityAtCursor();
        if (entity && entity.position.distanceTo(bot.entity.position) < 4) {
            bot.attack(entity, () => {
                console.log('[+] Успешная атака по цели');
            });
        } else {
            bot.activateItem(() => {
                console.log('[+] Удар! (без цели)');
            });
        }
    } catch (err) {
        console.log('[X] Ошибка:', err.message);
    }
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

console.clear();
console.log(`
                     __                                    .___                   
_______  ____  _____|  | ______   _____   ____ _____     __| _/__________________ 
\\_  __ \\/  _ \\/  ___/  |/ /  _ \\ /     \\ /    \\\\__  \\   / __ |\\___   /  _ \\_  __ \\
 |  | \\(  <_> )___ \\|    <  <_> )  Y Y  \\   |  \\/ __ \\_/ /_/ | /    (  <_> )  | \\/
 |__|   \\____/____  >__|_ \\____/|__|_|  /___|  (____  /\\____ |/_____ \\____/|__|   
                  \\/     \\/           \\/     \\/     \\/      \\/      \\/             v1.1.6
`);
console.log('                    project by goddamnblessed and nithbann\n\n')
console.log('[*] Настройка подключения к Minecraft серверу\n');
askConfig();
