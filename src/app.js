// Globální proměnné a Stavy
let state = {
    screen: 'main-menu',
    phase: 'build', // build, defend, qte, shop, gameover
    stats: {
        score: 0,
        coins: 0,
        wave: 1,
        streak: 0,
        maxStreak: 0,
        kills: 0,
        totalCoins: 0,
        gamesPlayed: 0,
        maxWave: 0
    },
    build: {
        progress: 0, // 0 - 100
        target: 100, // kolik % je potřeba na dostavení
        increment: 20 // kolik % přidá jeden správný příklad
    },
    castle: {
        hp: 100,
        maxHp: 100
    },
    upgrades: {
        slowMultiplier: 1, // 1 = normální rychlost, < 1 zpomaleno
        fairyActive: false
    },
    currentProblem: null, // objekt { text: "2 + 2", answer: 4, type: "normal" }
    enemies: [], // pole aktivních nepřátel
    qte: {
        active: false,
        timer: null,
        timeLeft: 0,
        maxTime: 5000 // 5 sekund
    },
    intervals: {
        gameLoop: null,
        spawner: null,
        fairy: null
    }
};

// --- DOM Elementy ---
const els = {
    // Screens
    mainMenu: document.getElementById('main-menu'),
    buildScreen: document.getElementById('build-screen'),
    defendScreen: document.getElementById('defend-screen'),
    shopScreen: document.getElementById('shop-screen'),
    gameOverScreen: document.getElementById('game-over-screen'),
    statsMenuScreen: document.getElementById('stats-menu-screen'),
    
    // Tlačítka Menu
    btnStart: document.getElementById('btn-start'),
    btnStatsMenu: document.getElementById('btn-stats-menu'),
    btnStatsBack: document.getElementById('btn-stats-back'),
    
    // Build
    buildProgress: document.getElementById('build-progress'),
    buildProgressText: document.getElementById('build-progress-text'),
    buildMathProblem: document.getElementById('build-math-problem'),
    buildInput: document.getElementById('build-input'),
    buildCompareBtns: document.getElementById('build-compare-buttons'),
    
    // Defend HUD
    waveDisplay: document.getElementById('wave-display'),
    coinsDisplay: document.getElementById('coins-display'),
    streakDisplay: document.getElementById('streak-display'),
    castleHpBar: document.getElementById('castle-hp-bar'),
    castleHpText: document.getElementById('castle-hp-text'),
    enemiesArea: document.getElementById('enemies-area'),
    defendInput: document.getElementById('defend-input'),
    defendCompareBtns: document.getElementById('defend-compare-buttons'),
    
    // QTE
    qteContainer: document.getElementById('qte-container'),
    qteMathProblem: document.getElementById('qte-math-problem'),
    qteTimerBar: document.getElementById('qte-timer-bar'),
    
    // Shop
    shopWaveNum: document.getElementById('shop-wave-num'),
    shopCoins: document.getElementById('shop-coins'),
    btnNextWave: document.getElementById('btn-next-wave'),
    buyHpBtn: document.getElementById('buy-hp'),
    buySlowBtn: document.getElementById('buy-slow'),
    buyFairyBtn: document.getElementById('buy-fairy'),
    
    // Game Over
    statWave: document.getElementById('stat-wave'),
    statScore: document.getElementById('stat-score'),
    statStreak: document.getElementById('stat-streak'),
    statKills: document.getElementById('stat-kills'),
    btnRestart: document.getElementById('btn-restart'),
    btnToMain: document.getElementById('btn-to-main'),
    
    // Global Stats
    globalBestWave: document.getElementById('global-best-wave'),
    globalGamesPlayed: document.getElementById('global-games-played'),
    globalTotalCoins: document.getElementById('global-total-coins'),

    // Particles
    particles: document.getElementById('particles')
};

// --- Inicializace ---
function init() {
    loadGlobalStats();
    attachEventListeners();
    showScreen('main-menu');
}

// --- Systém Obrazovek ---
function showScreen(screenId) {
    // Skrytí všech
    els.mainMenu.classList.add('hidden');
    els.buildScreen.classList.add('hidden');
    els.defendScreen.classList.add('hidden');
    els.shopScreen.classList.add('hidden');
    els.gameOverScreen.classList.add('hidden');
    els.statsMenuScreen.classList.add('hidden');
    
    // Zobrazení vybrané
    if (screenId === 'main-menu') els.mainMenu.classList.remove('hidden');
    else if (screenId === 'build-screen') els.buildScreen.classList.remove('hidden');
    else if (screenId === 'defend-screen') els.defendScreen.classList.remove('hidden');
    else if (screenId === 'shop-screen') els.shopScreen.classList.remove('hidden');
    else if (screenId === 'game-over-screen') els.gameOverScreen.classList.remove('hidden');
    else if (screenId === 'stats-menu-screen') els.statsMenuScreen.classList.remove('hidden');
    
    state.screen = screenId;
}

// --- Správa událostí (Event Listeners) ---
function attachEventListeners() {
    // Main Menu
    els.btnStart.addEventListener('click', startGame);
    els.btnStatsMenu.addEventListener('click', () => {
        updateGlobalStatsUI();
        showScreen('stats-menu-screen');
    });
    els.btnStatsBack.addEventListener('click', () => showScreen('main-menu'));
    
    // Game Over
    els.btnRestart.addEventListener('click', startGame);
    els.btnToMain.addEventListener('click', () => showScreen('main-menu'));
}

// --- Generování matematických příkladů ---
function generateMathProblem(difficulty) {
    // difficulty: 1 (lehké, stavba), 2 (střední, vlny 1-3), 3 (těžší, vlny 4+), 4 (QTE - nejtěžší)
    const types = ['add', 'sub', 'mul', 'div', 'comp', 'round'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let text = "";
    let answer = null;
    let probType = "num"; // num (číselný vstup), comp (porovnávání)

    const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    switch (type) {
        case 'add':
            let maxAdd = difficulty === 1 ? 20 : (difficulty === 2 ? 50 : 100);
            let aAdd = getRandomInt(1, maxAdd);
            let bAdd = getRandomInt(1, maxAdd - aAdd > 0 ? maxAdd - aAdd : 10);
            if (difficulty >= 3) {
                 aAdd = getRandomInt(10, 50);
                 bAdd = getRandomInt(10, 50);
            }
            text = `${aAdd} + ${bAdd}`;
            answer = aAdd + bAdd;
            break;
            
        case 'sub':
            let maxSub = difficulty <= 2 ? 30 : 100;
            let aSub = getRandomInt(5, maxSub);
            let bSub = getRandomInt(1, aSub);
            text = `${aSub} - ${bSub}`;
            answer = aSub - bSub;
            break;
            
        case 'mul':
            let maxMul = difficulty === 1 ? 5 : (difficulty === 2 ? 8 : 10);
            let aMul = getRandomInt(1, maxMul);
            let bMul = getRandomInt(1, 10);
            text = `${aMul} × ${bMul}`;
            answer = aMul * bMul;
            break;
            
        case 'div':
            let divisor = getRandomInt(2, difficulty <= 2 ? 5 : 10);
            let quotient = getRandomInt(1, 10);
            let dividend = divisor * quotient;
            text = `${dividend} : ${divisor}`;
            answer = quotient;
            break;
            
        case 'comp':
            probType = "comp";
            let aComp = getRandomInt(1, 100);
            let bComp = getRandomInt(1, 100);
            // snaha o blízka čísla
            if(Math.random() > 0.5) bComp = aComp + getRandomInt(-5, 5);
            
            text = `${aComp} ? ${bComp}`;
            if (aComp < bComp) answer = '<';
            else if (aComp > bComp) answer = '>';
            else answer = '=';
            break;
            
        case 'round':
            let numRound = getRandomInt(11, 99);
            // Nechceme končící na 0
            if (numRound % 10 === 0) numRound += getRandomInt(1, 4);
            text = `Zaokrouhli ${numRound}`;
            answer = Math.round(numRound / 10) * 10;
            break;
    }
    
    return { text, answer, type: probType };
}

// --- Herní Loop a Základní stavy ---
function startGame() {
    console.log("Start hry...");
    
    // Reset statistik pro novou hru
    state.stats.score = 0;
    state.stats.coins = 0;
    state.stats.wave = 1;
    state.stats.streak = 0;
    state.stats.maxStreak = 0;
    state.stats.kills = 0;
    
    // Reset hradu
    state.castle.maxHp = 100;
    state.castle.hp = state.castle.maxHp;
    
    // Reset upgrady
    state.upgrades.slowMultiplier = 1;
    state.upgrades.fairyActive = false;
    
    // Zvýšit počítadlo her
    state.stats.gamesPlayed++;
    saveGlobalStats();
    
    startBuildPhase();
}

function startBuildPhase() {
    state.phase = 'build';
    state.build.progress = 0;
    
    updateBuildUI();
    generateBuildProblem();
    
    showScreen('build-screen');
    els.buildInput.focus();
}

function updateBuildUI() {
    els.buildProgress.style.width = `${state.build.progress}%`;
    els.buildProgressText.textContent = `${state.build.progress}% Postaveno`;
}

function generateBuildProblem() {
    state.currentProblem = generateMathProblem(1); // obtížnost 1 pro stavbu
    els.buildMathProblem.textContent = state.currentProblem.text;
    
    if (state.currentProblem.type === 'comp') {
        els.buildInput.classList.add('hidden');
        els.buildCompareBtns.classList.remove('hidden');
    } else {
        els.buildInput.classList.remove('hidden');
        els.buildCompareBtns.classList.add('hidden');
        els.buildInput.value = '';
        els.buildInput.focus();
    }
}

// Zpracování vstupu ve fázi stavby
function handleBuildInput(val) {
    if (state.phase !== 'build') return;
    
    // Převod na string pro snadné porovnání (čísla i znaky)
    if (val.toString() === state.currentProblem.answer.toString()) {
        // Správně
        state.build.progress += state.build.increment;
        createParticles(els.buildMathProblem, '#43bccd'); // modré jiskry
        
        // Mince za stavbu (1 za správnou odpověď)
        state.stats.coins += 1;
        state.stats.totalCoins += 1;
        saveGlobalStats();
        
        if (state.build.progress >= 100) {
            state.build.progress = 100;
            updateBuildUI();
            setTimeout(startDefendPhase, 1000); // pauza před obranou
        } else {
            updateBuildUI();
            generateBuildProblem();
        }
    } else {
        // Špatně
        createParticles(els.buildMathProblem, '#e94560'); // červené jiskry, shake
        els.buildMathProblem.style.animation = 'shake 0.5s';
        setTimeout(() => els.buildMathProblem.style.animation = '', 500);
        
        if (state.currentProblem.type !== 'comp') {
            els.buildInput.value = '';
            els.buildInput.focus();
        }
    }
}

// Bindování inputů pro Build
els.buildInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter' && els.buildInput.value !== '') {
        handleBuildInput(els.buildInput.value);
    }
});

Array.from(els.buildCompareBtns.children).forEach(btn => {
    btn.addEventListener('click', (e) => {
        handleBuildInput(e.target.dataset.val);
    });
});

function startDefendPhase() {
    state.phase = 'defend';
    console.log("Zahájení obrany vlna:", state.stats.wave);
    
    // Aktualizace HUD
    els.waveDisplay.textContent = state.stats.wave;
    els.coinsDisplay.textContent = state.stats.coins;
    els.streakDisplay.textContent = state.stats.streak;
    updateCastleHpUI();
    
    els.enemiesArea.innerHTML = '';
    state.enemies = [];
    
    showScreen('defend-screen');
    els.defendInput.value = '';
    els.defendInput.focus();
    
    // Nastavení obtížnosti podle vlny
    let difficulty = 2;
    if (state.stats.wave > 3) difficulty = 3;
    
    // Parametry vlny
    let totalEnemies = 5 + (state.stats.wave * 2);
    let spawnedEnemies = 0;
    
    // Hlavní herní loop pro obranu (pohyb nepřátel)
    state.intervals.gameLoop = setInterval(() => {
        if (state.phase !== 'defend') return;
        updateEnemies();
    }, 50); // 20 FPS
    
    // Spawner nepřátel
    let spawnRate = Math.max(1000, 3000 - (state.stats.wave * 200)); // Rychlejší spawn v dalších vlnách
    
    state.intervals.spawner = setInterval(() => {
        if (state.phase !== 'defend' || state.qte.active) return;
        
        if (spawnedEnemies < totalEnemies) {
            spawnEnemy(difficulty);
            spawnedEnemies++;
        } else if (state.enemies.length === 0 && !state.qte.active) {
            // Vlna dokončena
            endWave();
        }
        
        // Šance na QTE (Záchrana jednorožce) - cca 15% každou vteřinu spawnu, pokud už není a vlna ještě neskončila
        if (!state.qte.active && Math.random() < 0.15 && spawnedEnemies < totalEnemies) {
            triggerQTE();
        }
        
    }, spawnRate);
}

function spawnEnemy(difficulty) {
    const enemyEl = document.createElement('div');
    enemyEl.classList.add('enemy');
    
    // Grafika
    const spriteEl = document.createElement('div');
    spriteEl.classList.add('enemy-sprite');
    const emojis = ['👹', '👽', '👻', '👺', '🕷️'];
    spriteEl.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    
    // Příklad
    const mathEl = document.createElement('div');
    mathEl.classList.add('enemy-math');
    const problem = generateMathProblem(difficulty);
    mathEl.textContent = problem.text;
    
    enemyEl.appendChild(spriteEl);
    enemyEl.appendChild(mathEl);
    
    // Pozice (zprava, náhodná výška)
    const startX = els.enemiesArea.clientWidth;
    const startY = Math.random() * (els.enemiesArea.clientHeight - 80); // 80px je cca výška nepřítele
    
    enemyEl.style.left = `${startX}px`;
    enemyEl.style.top = `${startY}px`;
    
    els.enemiesArea.appendChild(enemyEl);
    
    const speed = (Math.random() * 0.5 + 0.5 + (state.stats.wave * 0.1)) * state.upgrades.slowMultiplier; // Rychlost podle vlny a upgrady
    
    const id = Date.now() + Math.random();
    
    state.enemies.push({
        id: id,
        el: enemyEl,
        x: startX,
        y: startY,
        speed: speed,
        problem: problem
    });
    
    // Aktualizuj input mód podle toho, co je nejblíž (nejblížící se nepřítel)
    updateDefendInputMode();
}

function updateEnemies() {
    for (let i = state.enemies.length - 1; i >= 0; i--) {
        let enemy = state.enemies[i];
        
        // Pohyb doleva
        enemy.x -= enemy.speed;
        enemy.el.style.left = `${enemy.x}px`;
        
        // Kolize s hradem (x <= 0)
        if (enemy.x <= 0) {
            damageCastle(10);
            enemy.el.remove();
            state.enemies.splice(i, 1);
            
            // Reset streak
            resetStreak();
            updateDefendInputMode();
        }
    }
}

function damageCastle(amount) {
    state.castle.hp -= amount;
    if (state.castle.hp < 0) state.castle.hp = 0;
    
    updateCastleHpUI();
    
    // Efekt na hrad
    const castleEl = document.querySelector('.castle');
    castleEl.style.animation = 'shake 0.5s';
    setTimeout(() => castleEl.style.animation = '', 500);
    
    if (state.castle.hp === 0) {
        gameOver();
    }
}

function updateDefendInputMode() {
    if (state.enemies.length === 0) return;
    if (state.qte.active) return; // Nepřepínat vstupy, pokud běží QTE
    
    // Najdi nejbližšího nepřítele
    let closestEnemy = state.enemies.reduce((prev, curr) => (prev.x < curr.x) ? prev : curr);
    
    // Vizuální označení cíle
    state.enemies.forEach(e => e.el.classList.remove('targeted'));
    closestEnemy.el.classList.add('targeted');
    
    if (closestEnemy.problem.type === 'comp') {
        els.defendInput.classList.add('hidden');
        els.defendCompareBtns.classList.remove('hidden');
    } else {
        els.defendInput.classList.remove('hidden');
        els.defendCompareBtns.classList.add('hidden');
        els.defendInput.focus();
    }
}

function handleDefendInput(val) {
    if (state.phase !== 'defend' || state.qte.active) return;
    if (state.enemies.length === 0) {
        els.defendInput.value = '';
        return;
    }
    
    let hit = false;
    let hitEnemyIndex = -1;
    
    // Najít nepřítele se správnou odpovědí (priorita nejbližší)
    // Seřadit nepřátele od nejbližšího (nejmenší X)
    let sortedEnemies = [...state.enemies].sort((a, b) => a.x - b.x);
    
    for (let enemy of sortedEnemies) {
        if (enemy.problem.answer.toString() === val.toString()) {
            hit = true;
            hitEnemyIndex = state.enemies.findIndex(e => e.id === enemy.id);
            break;
        }
    }
    
    if (hit && hitEnemyIndex !== -1) {
        // Zásah
        let enemy = state.enemies[hitEnemyIndex];
        createParticles(enemy.el, '#fca311'); // zlaté částice
        enemy.el.remove();
        state.enemies.splice(hitEnemyIndex, 1);
        
        state.stats.kills++;
        state.stats.score += 10 * (1 + Math.floor(state.stats.streak / 5)); // Bonus za streak
        
        // Mince + Streak
        state.stats.streak++;
        if (state.stats.streak > state.stats.maxStreak) state.stats.maxStreak = state.stats.streak;
        
        // Každých 5 ve streaku = bonusová mince
        let coinsEarned = 1 + Math.floor(state.stats.streak / 5);
        state.stats.coins += coinsEarned;
        state.stats.totalCoins += coinsEarned;
        
        els.streakDisplay.textContent = state.stats.streak;
        els.coinsDisplay.textContent = state.stats.coins;
        
        els.defendInput.value = '';
        updateDefendInputMode();
        
    } else {
        // Minutí
        resetStreak();
        
        // Efekt chyby
        els.defendInput.style.animation = 'shake 0.3s';
        els.defendCompareBtns.style.animation = 'shake 0.3s';
        setTimeout(() => {
            els.defendInput.style.animation = '';
            els.defendCompareBtns.style.animation = '';
        }, 300);
        
        if (els.defendInput.classList.contains('hidden') === false) {
             els.defendInput.value = '';
        }
    }
}

function resetStreak() {
    state.stats.streak = 0;
    els.streakDisplay.textContent = state.stats.streak;
}

// Bindování inputů pro Defend
els.defendInput.addEventListener('keyup', (e) => {
    if (state.phase !== 'defend') return;
    if (e.key === 'Enter' && els.defendInput.value !== '') {
        handleDefendInput(els.defendInput.value);
    }
});

Array.from(els.defendCompareBtns.children).forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (state.phase !== 'defend') return;
        handleDefendInput(e.target.dataset.val);
    });
});

// --- QTE (Záchrana jednorožce) ---
function triggerQTE() {
    console.log("QTE triggered!");
    state.qte.active = true;
    state.qte.timeLeft = state.qte.maxTime;
    
    // Zobrazení QTE UI
    els.qteContainer.classList.remove('hidden');
    els.qteTimerBar.style.width = '100%';
    
    // Generování těžšího příkladu (obtížnost 4)
    state.currentProblem = generateMathProblem(4);
    els.qteMathProblem.textContent = state.currentProblem.text;
    
    // Nastavení vstupu pro QTE
    if (state.currentProblem.type === 'comp') {
        els.defendInput.classList.add('hidden');
        els.defendCompareBtns.classList.remove('hidden');
    } else {
        els.defendInput.classList.remove('hidden');
        els.defendCompareBtns.classList.add('hidden');
        els.defendInput.value = '';
        els.defendInput.focus();
    }
    
    // Spuštění odpočtu (interval 50ms)
    state.qte.timer = setInterval(() => {
        state.qte.timeLeft -= 50;
        let percent = (state.qte.timeLeft / state.qte.maxTime) * 100;
        els.qteTimerBar.style.width = `${percent}%`;
        
        if (state.qte.timeLeft <= 0) {
            failQTE();
        }
    }, 50);
}

function resolveQTEInput(val) {
    if (val.toString() === state.currentProblem.answer.toString()) {
        successQTE();
    } else {
        failQTE();
    }
}

function successQTE() {
    clearInterval(state.qte.timer);
    
    // Efekt záchrany (magická vlna)
    createParticles(els.qteContainer, '#8e44ad'); // fialové
    createParticles(els.qteContainer, '#f1c40f'); // žluté
    
    // Odměna: Zničit všechny aktuální nepřátele na obrazovce
    state.enemies.forEach(enemy => {
        createParticles(enemy.el, '#8e44ad');
        enemy.el.remove();
        state.stats.kills++;
        state.stats.score += 20;
    });
    state.enemies = []; // vyprázdnit pole
    
    // Bonusové mince
    state.stats.coins += 10;
    state.stats.totalCoins += 10;
    els.coinsDisplay.textContent = state.stats.coins;
    
    closeQTE();
}

function failQTE() {
    clearInterval(state.qte.timer);
    
    // Jednorožec uteče - efekt zklamání
    els.qteContainer.style.animation = 'shake 0.5s';
    setTimeout(() => els.qteContainer.style.animation = '', 500);
    
    closeQTE();
}

function closeQTE() {
    els.qteContainer.classList.add('hidden');
    state.qte.active = false;
    
    // Návrat vstupu zpět na obranu (nebo skrytí, pokud nejsou nepřátelé)
    updateDefendInputMode();
    if (state.enemies.length === 0) {
         els.defendInput.classList.add('hidden');
         els.defendCompareBtns.classList.add('hidden');
    }
}

// Aktualizace vstupů v obraně (sloučení s QTE logic)
// Nahradíme původní handlery (ty z předchozího kroku) za nové, které zohledňují QTE
els.defendInput.removeEventListener('keyup', () => {}); // Nelze jednoduše odstranit anonymní funkce, takže je přepíšeme

// Ošetříme to přidáním nové podmínky přímo do `handleDefendInput` a zachováme původní event listenery
// ale přesuneme QTE logiku přímo tam, abychom zamezili duplikacím a problémům.
// Protože JS neumožňuje snadno odstranit anonymní event listenery vytvořené dříve, upravíme logiku uvnitř listenerů
// tím, že `handleDefendInput` bude vědět o QTE (což už dělá přes return).

function checkGlobalInput(e) {
    if (state.phase !== 'defend') return;
    
    // Pokud je aktivní QTE
    if (state.qte.active && e.key === 'Enter' && els.defendInput.value !== '') {
        resolveQTEInput(els.defendInput.value);
    }
}

// Přiřadíme do globálního listeneru, abychom nepoužívali duplicitní event listenery na inputu
window.addEventListener('keyup', (e) => {
    if (state.phase === 'defend' && state.qte.active) {
        if (e.key === 'Enter' && els.defendInput.value !== '') {
            resolveQTEInput(els.defendInput.value);
            els.defendInput.value = '';
        }
    }
});

// A pro tlačítka na porovnávání (pokud je QTE typu comp):
Array.from(els.defendCompareBtns.children).forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (state.phase === 'defend' && state.qte.active) {
            resolveQTEInput(e.target.dataset.val);
        }
    });
});


function endWave() {
    console.log("Konec vlny", state.stats.wave);
    
    // Clear intervals
    clearInterval(state.intervals.gameLoop);
    clearInterval(state.intervals.spawner);
    
    state.stats.wave++;
    if (state.stats.wave > state.stats.maxWave) state.stats.maxWave = state.stats.wave;
    saveGlobalStats();
    
    showShopPhase();
}

function showShopPhase() {
    state.phase = 'shop';
    els.shopWaveNum.textContent = state.stats.wave - 1;
    els.shopCoins.textContent = state.stats.coins;
    
    // Obnovení tlačítek a jejich textů
    els.buyHpBtn.disabled = state.stats.coins < 50;
    
    if (state.upgrades.slowMultiplier <= 0.5) {
        els.buySlowBtn.textContent = 'MAX (Vyprodáno)';
        els.buySlowBtn.disabled = true;
    } else {
        els.buySlowBtn.disabled = state.stats.coins < 100;
        els.buySlowBtn.textContent = 'Koupit (100 🪙)';
    }
    
    if (state.upgrades.fairyActive) {
        els.buyFairyBtn.textContent = 'Aktivní (Vyprodáno)';
        els.buyFairyBtn.disabled = true;
    } else {
        els.buyFairyBtn.disabled = state.stats.coins < 150;
        els.buyFairyBtn.textContent = 'Koupit (150 🪙)';
    }
    
    showScreen('shop-screen');
}

function updateShopUI() {
    els.shopCoins.textContent = state.stats.coins;
    showShopPhase(); // znovuzavolání pro přehodnocení disabled stavů
}

// Event Listenery pro Obchod
els.buyHpBtn.addEventListener('click', () => {
    if (state.stats.coins >= 50) {
        state.stats.coins -= 50;
        state.castle.maxHp += 20;
        state.castle.hp += 20; // vyléčí i aktuální
        updateShopUI();
    }
});

els.buySlowBtn.addEventListener('click', () => {
    if (state.stats.coins >= 100 && state.upgrades.slowMultiplier > 0.5) {
        state.stats.coins -= 100;
        state.upgrades.slowMultiplier -= 0.1; // zpomalení o 10%
        updateShopUI();
    }
});

els.buyFairyBtn.addEventListener('click', () => {
    if (state.stats.coins >= 150 && !state.upgrades.fairyActive) {
        state.stats.coins -= 150;
        state.upgrades.fairyActive = true;
        startFairy();
        updateShopUI();
    }
});

els.btnNextWave.addEventListener('click', () => {
    if (state.phase === 'shop') {
        startDefendPhase();
    }
});

function startFairy() {
    if (state.intervals.fairy) clearInterval(state.intervals.fairy);
    
    state.intervals.fairy = setInterval(() => {
        if (state.phase === 'defend' && state.enemies.length > 0 && !state.qte.active) {
            // Víla zničí náhodného nepřítele (nebo prvního)
            let enemyToKill = state.enemies[0];
            createParticles(enemyToKill.el, '#ff9ff3'); // růžová vílí barva
            enemyToKill.el.remove();
            state.enemies.shift(); // odstraní prvního z pole
            
            state.stats.kills++;
            state.stats.score += 10;
            
            updateDefendInputMode();
            
            // Ukázat vílu graficky (krátká animace)
            const fairySprite = document.createElement('div');
            fairySprite.textContent = '🧚‍♀️';
            fairySprite.style.position = 'absolute';
            fairySprite.style.left = enemyToKill.x + 'px';
            fairySprite.style.top = enemyToKill.y - 30 + 'px';
            fairySprite.style.fontSize = '3rem';
            fairySprite.style.animation = 'flyout 1s forwards';
            fairySprite.style.setProperty('--tx', `0px`);
            fairySprite.style.setProperty('--ty', `-100px`);
            els.enemiesArea.appendChild(fairySprite);
            setTimeout(() => fairySprite.remove(), 1000);
        }
    }, 5000); // Každých 5 sekund víla zasáhne
}

// Game Over logiky
function gameOver() {
    console.log("Hra skončila");
    state.phase = 'gameover';
    
    // Vyčištění všech intervalů
    if (state.intervals.gameLoop) clearInterval(state.intervals.gameLoop);
    if (state.intervals.spawner) clearInterval(state.intervals.spawner);
    if (state.intervals.fairy) clearInterval(state.intervals.fairy);
    if (state.qte.timer) clearInterval(state.qte.timer);
    
    // Skrytí QTE, pokud běželo
    els.qteContainer.classList.add('hidden');
    
    // Uložení aktuálních max statistik
    if (state.stats.wave > state.stats.maxWave) state.stats.maxWave = state.stats.wave;
    saveGlobalStats();
    
    // Zobrazení UI
    els.statWave.textContent = state.stats.wave;
    els.statScore.textContent = state.stats.score;
    els.statStreak.textContent = state.stats.maxStreak;
    els.statKills.textContent = state.stats.kills;
    
    showScreen('game-over-screen');
}

function updateCastleHpUI() {
    els.castleHpText.textContent = `${state.castle.hp} / ${state.castle.maxHp}`;
    let hpPercent = (state.castle.hp / state.castle.maxHp) * 100;
    els.castleHpBar.style.width = `${hpPercent}%`;
    if (hpPercent < 30) els.castleHpBar.style.backgroundColor = 'red';
    else els.castleHpBar.style.backgroundColor = '#e94560';
}

// Particle system helper
function createParticles(element, color) {
    const rect = element.getBoundingClientRect();
    const containerRect = document.getElementById('game-container').getBoundingClientRect();
    
    const centerX = (rect.left - containerRect.left) + rect.width / 2;
    const centerY = (rect.top - containerRect.top) + rect.height / 2;
    
    for (let i = 0; i < 10; i++) {
        const p = document.createElement('div');
        p.classList.add('particle');
        p.style.backgroundColor = color;
        p.style.width = Math.random() * 10 + 5 + 'px';
        p.style.height = p.style.width;
        p.style.left = centerX + 'px';
        p.style.top = centerY + 'px';
        
        // Náhodný směr
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 50 + 20;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;
        
        p.style.setProperty('--tx', `${tx}px`);
        p.style.setProperty('--ty', `${ty}px`);
        
        // Upravit animaci aby použila translate
        p.style.animation = 'flyout 0.8s forwards';
        
        document.getElementById('particles').appendChild(p);
        
        setTimeout(() => p.remove(), 800);
    }
}

// Add keyframes for flyout dynamically
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes flyout {
    0% { transform: translate(0, 0) scale(1); opacity: 1; }
    100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
}`;
document.head.appendChild(styleSheet);


// --- Ukládání / Načítání ---
function loadGlobalStats() {
    const saved = localStorage.getItem('mathFortressStats');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            state.stats.maxWave = parsed.maxWave || 0;
            state.stats.gamesPlayed = parsed.gamesPlayed || 0;
            state.stats.totalCoins = parsed.totalCoins || 0;
        } catch (e) {
            console.error("Failed to parse global stats from localStorage:", e);
        }
    }
}

function saveGlobalStats() {
    localStorage.setItem('mathFortressStats', JSON.stringify({
        maxWave: state.stats.maxWave,
        gamesPlayed: state.stats.gamesPlayed,
        totalCoins: state.stats.totalCoins
    }));
}

function updateGlobalStatsUI() {
    els.globalBestWave.textContent = state.stats.maxWave;
    els.globalGamesPlayed.textContent = state.stats.gamesPlayed;
    els.globalTotalCoins.textContent = state.stats.totalCoins;
}

// Spuštění po načtení
window.onload = init;
