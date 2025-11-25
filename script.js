const state = {
  pancakes: 0,
  totalPancakes: 0,
  clickValue: 1,
  perSecond: 0,
  prestigePoints: 0,
  prestigeBonus: 1,
  soundOn: true,
  upgrades: {},
  producers: {},
  lastUpdate: Date.now(),
};

const upgrades = [
  {
    id: 'fluffy',
    name: 'Fluffy Batter',
    icon: '🥞',
    description: '+1 Pancake per click. Unlocks at 15 pancakes.',
    cost: 15,
    type: 'click',
    value: 1,
  },
  {
    id: 'mapleDrizzle',
    name: 'Maple Drizzle',
    icon: '🍁',
    description: 'Clicking is 2x sweeter.',
    cost: 60,
    type: 'click-mult',
    value: 2,
  },
  {
    id: 'nonStick',
    name: 'Non-Stick Griddle',
    icon: '🍳',
    description: 'All producers work 1.5x faster.',
    cost: 150,
    type: 'producer-mult',
    value: 1.5,
  },
  {
    id: 'whippedCream',
    name: 'Whipped Cream Peak',
    icon: '🍨',
    description: 'Clicks splash +5 pancakes.',
    cost: 500,
    type: 'click',
    value: 5,
  },
  {
    id: 'goldenSyrup',
    name: 'Golden Syrup',
    icon: '🥇',
    description: 'Producers drip an extra +50% syrup.',
    cost: 1200,
    type: 'producer-mult',
    value: 1.5,
  },
];

const producers = [
  {
    id: 'griddle',
    name: 'Cozy Griddle',
    icon: '🔥',
    baseCost: 20,
    baseRate: 0.5,
    description: 'Keeps a gentle sizzle of pancakes going.',
  },
  {
    id: 'chef',
    name: 'Pancake Chef',
    icon: '👩‍🍳',
    baseCost: 120,
    baseRate: 4,
    description: 'A chef who flips with flair.',
  },
  {
    id: 'butterBot',
    name: 'Butter Bot',
    icon: '🤖',
    baseCost: 550,
    baseRate: 14,
    description: 'Automated butter pats for tastier stacks.',
  },
  {
    id: 'syrupFountain',
    name: 'Syrup Fountain',
    icon: '⛲',
    baseCost: 2200,
    baseRate: 55,
    description: 'Glistening syrup for endless pancakes.',
  },
  {
    id: 'sunriseParlor',
    name: 'Sunrise Parlor',
    icon: '🌅',
    baseCost: 9000,
    baseRate: 220,
    description: 'A whole corner booth working the morning rush.',
  },
];

const elements = {
  pancakeCount: document.getElementById('pancake-count'),
  pps: document.getElementById('pps'),
  prestigeBonus: document.getElementById('prestige-bonus'),
  clickValue: document.getElementById('click-value'),
  pancakeStack: document.getElementById('pancake-stack'),
  upgradesTab: document.getElementById('tab-upgrades'),
  producersTab: document.getElementById('tab-producers'),
  prestigeTab: document.getElementById('tab-prestige'),
  statsTab: document.getElementById('tab-stats'),
  settingsTab: document.getElementById('tab-settings'),
  floatingTextContainer: document.getElementById('floating-text-container'),
  tooltip: document.getElementById('tooltip'),
  toggleSound: document.getElementById('pulse-sound'),
};

const format = (num) => {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toFixed(1);
};

function loadState() {
  const saved = localStorage.getItem('pancake-peaks-save');
  if (saved) {
    const parsed = JSON.parse(saved);
    Object.assign(state, parsed);
  }
  state.upgrades = state.upgrades || {};
  state.producers = state.producers || {};
  state.soundOn = state.soundOn ?? true;
  state.lastUpdate = Date.now();
}

function saveState() {
  localStorage.setItem('pancake-peaks-save', JSON.stringify(state));
}

function resetState() {
  const prestigePoints = calculatePrestigeGain();
  state.pancakes = 0;
  state.totalPancakes = 0;
  state.clickValue = 1;
  state.perSecond = 0;
  state.upgrades = {};
  state.producers = {};
  state.lastUpdate = Date.now();
  state.prestigePoints += prestigePoints;
  state.prestigeBonus = 1 + state.prestigePoints * 0.15;
  return prestigePoints;
}

function calculatePrestigeGain() {
  return Math.floor(Math.pow(state.totalPancakes / 2000, 0.55));
}

function costWithScaling(base, count) {
  return Math.ceil(base * Math.pow(1.15, count));
}

function getProducerMultiplier() {
  let mult = 1;
  for (const id of Object.keys(state.upgrades)) {
    const upgrade = upgrades.find((u) => u.id === id);
    if (upgrade && upgrade.type === 'producer-mult') {
      mult *= upgrade.value;
    }
  }
  return mult;
}

function updatePerSecond() {
  let pps = 0;
  for (const producer of producers) {
    const count = state.producers[producer.id] || 0;
    if (count > 0) {
      pps += count * producer.baseRate;
    }
  }
  const producerMult = getProducerMultiplier();
  state.perSecond = pps * producerMult * state.prestigeBonus;
}

function getClickValue() {
  let value = state.clickValue * state.prestigeBonus;
  for (const id of Object.keys(state.upgrades)) {
    const upgrade = upgrades.find((u) => u.id === id);
    if (upgrade && upgrade.type === 'click') value += upgrade.value;
    if (upgrade && upgrade.type === 'click-mult') value *= upgrade.value;
  }
  return value;
}

function addPancakes(amount) {
  state.pancakes += amount;
  state.totalPancakes += amount;
  render();
}

function clickPancake(event) {
  const value = getClickValue();
  addPancakes(value);
  animateStack();
  spawnFloatingText(event, `+${value.toFixed(1)}`);
  playClickSound();
}

function animateStack() {
  elements.pancakeStack.classList.add('clicked');
  setTimeout(() => elements.pancakeStack.classList.remove('clicked'), 140);
}

function spawnFloatingText(event, text) {
  const rect = elements.pancakeStack.getBoundingClientRect();
  const x = (event?.clientX || rect.left + rect.width / 2) - rect.left;
  const y = (event?.clientY || rect.top + rect.height / 2) - rect.top;
  const el = document.createElement('div');
  el.className = 'float-text';
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  elements.floatingTextContainer.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}

function buyUpgrade(id) {
  const upgrade = upgrades.find((u) => u.id === id);
  if (!upgrade || state.upgrades[id]) return;
  if (state.pancakes < upgrade.cost) return;
  state.pancakes -= upgrade.cost;
  state.upgrades[id] = true;
  render();
  playUiSound();
}

function buyProducer(id) {
  const producer = producers.find((p) => p.id === id);
  if (!producer) return;
  const count = state.producers[id] || 0;
  const cost = costWithScaling(producer.baseCost, count);
  if (state.pancakes < cost) return;
  state.pancakes -= cost;
  state.producers[id] = count + 1;
  playUiSound();
  updatePerSecond();
  render();
}

function renderUpgrades() {
  elements.upgradesTab.innerHTML = '';
  upgrades.forEach((upgrade) => {
    const unlocked = state.totalPancakes >= upgrade.cost * 0.6;
    if (!unlocked) return;
    const card = document.createElement('div');
    card.className = 'card';
    const owned = state.upgrades[upgrade.id];
    const affordable = state.pancakes >= upgrade.cost;
    card.innerHTML = `
      <div class="icon">${upgrade.icon}</div>
      <div>
        <h3>${upgrade.name}</h3>
        <p>${upgrade.description}</p>
        <div class="tag">Cost: ${format(upgrade.cost)} pp</div>
      </div>
      <button ${owned ? 'disabled' : ''}>${owned ? 'Owned' : 'Purchase'}</button>
    `;
    const btn = card.querySelector('button');
    btn.disabled = owned || !affordable;
    btn.addEventListener('click', () => buyUpgrade(upgrade.id));
    card.addEventListener('mousemove', (e) => showTooltip(e, upgrade.description));
    card.addEventListener('mouseleave', hideTooltip);
    elements.upgradesTab.appendChild(card);
  });
}

function renderProducers() {
  elements.producersTab.innerHTML = '';
  producers.forEach((producer) => {
    const count = state.producers[producer.id] || 0;
    const cost = costWithScaling(producer.baseCost, count);
    const card = document.createElement('div');
    card.className = 'card';
    const rate = producer.baseRate * state.prestigeBonus * getProducerMultiplier();
    card.innerHTML = `
      <div class="icon">${producer.icon}</div>
      <div>
        <h3>${producer.name}</h3>
        <p>${producer.description}</p>
        <div class="tag">${count} owned</div>
        <div class="tag">${rate.toFixed(1)} /s each</div>
      </div>
      <button ${state.pancakes < cost ? 'disabled' : ''}>Buy for ${format(cost)}<br/>pp</button>
    `;
    card.querySelector('button').addEventListener('click', () => buyProducer(producer.id));
    card.addEventListener('mousemove', (e) =>
      showTooltip(e, `Cost scales by 15%. Current cost: ${format(cost)}`)
    );
    card.addEventListener('mouseleave', hideTooltip);
    elements.producersTab.appendChild(card);
  });
}

function renderPrestige() {
  const gain = calculatePrestigeGain();
  elements.prestigeTab.innerHTML = `
    <div class="prestige-box">
      <h2>Prestige for Fresh Start</h2>
      <p>Reset all progress for permanent <strong>Fluffy Points</strong> that boost everything.</p>
      <div class="big-number">+${gain} FP</div>
      <p>Current Bonus: x${state.prestigeBonus.toFixed(2)}</p>
      <button class="ghost-button" id="prestige-button" ${gain <= 0 ? 'disabled' : ''}>Prestige</button>
    </div>
  `;
  const btn = document.getElementById('prestige-button');
  btn?.addEventListener('click', () => {
    if (gain <= 0) return;
    const gained = resetState();
    spawnFloatingText(null, `+${gained} FP`);
    render();
    playUiSound();
  });
}

function renderStats() {
  elements.statsTab.innerHTML = `
    <div class="stats-grid">
      <div class="stat-box">
        <div class="label">Total Pancakes Earned</div>
        <div class="value">${format(state.totalPancakes)}</div>
      </div>
      <div class="stat-box">
        <div class="label">Upgrades Owned</div>
        <div class="value">${Object.keys(state.upgrades).length}</div>
      </div>
      <div class="stat-box">
        <div class="label">Producers Owned</div>
        <div class="value">${Object.values(state.producers).reduce((a, b) => a + b, 0)}</div>
      </div>
      <div class="stat-box">
        <div class="label">Prestige Points</div>
        <div class="value">${state.prestigePoints}</div>
      </div>
    </div>
  `;
}

function renderSettings() {
  elements.settingsTab.innerHTML = `
    <div class="settings-list">
      <button id="save-btn">Save Game</button>
      <button id="load-btn">Load Save</button>
      <button id="reset-btn">Hard Reset</button>
    </div>
  `;
  document.getElementById('save-btn').onclick = saveState;
  document.getElementById('load-btn').onclick = () => {
    loadState();
    updatePerSecond();
    render();
  };
  document.getElementById('reset-btn').onclick = () => {
    if (confirm('This will wipe your progress. Continue?')) {
      Object.assign(state, {
        pancakes: 0,
        totalPancakes: 0,
        clickValue: 1,
        perSecond: 0,
        prestigePoints: 0,
        prestigeBonus: 1,
        soundOn: state.soundOn,
        upgrades: {},
        producers: {},
        lastUpdate: Date.now(),
      });
      render();
      saveState();
    }
  };
}

function render() {
  updatePerSecond();
  elements.pancakeCount.textContent = format(state.pancakes);
  elements.pps.textContent = `${state.perSecond.toFixed(1)} /s`;
  elements.prestigeBonus.textContent = `x${state.prestigeBonus.toFixed(2)}`;
  elements.clickValue.textContent = `+${getClickValue().toFixed(1)} per click`;
  renderUpgrades();
  renderProducers();
  renderPrestige();
  renderStats();
}

let soundContext;
function ensureSound() {
  if (!soundContext) soundContext = new (window.AudioContext || window.webkitAudioContext)();
}

function playClickSound() {
  if (!state.soundOn) return;
  ensureSound();
  const o = soundContext.createOscillator();
  const g = soundContext.createGain();
  o.type = 'triangle';
  o.frequency.value = 420;
  g.gain.setValueAtTime(0.2, soundContext.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, soundContext.currentTime + 0.15);
  o.connect(g).connect(soundContext.destination);
  o.start();
  o.stop(soundContext.currentTime + 0.15);
}

function playUiSound() {
  if (!state.soundOn) return;
  ensureSound();
  const o = soundContext.createOscillator();
  const g = soundContext.createGain();
  o.type = 'sine';
  o.frequency.value = 200;
  g.gain.setValueAtTime(0.15, soundContext.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, soundContext.currentTime + 0.3);
  o.connect(g).connect(soundContext.destination);
  o.start();
  o.stop(soundContext.currentTime + 0.3);
}

function showTooltip(event, text) {
  elements.tooltip.textContent = text;
  elements.tooltip.style.opacity = 1;
  elements.tooltip.style.transform = 'translateY(0)';
  elements.tooltip.style.left = event.pageX + 12 + 'px';
  elements.tooltip.style.top = event.pageY + 12 + 'px';
}

function hideTooltip() {
  elements.tooltip.style.opacity = 0;
  elements.tooltip.style.transform = 'translateY(6px)';
}

function initTabs() {
  document.querySelectorAll('.tab-button').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const id = btn.dataset.tab;
      document.querySelectorAll('.tab-content').forEach((tab) => tab.classList.add('hidden'));
      document.getElementById(`tab-${id}`).classList.remove('hidden');
    });
  });
}

function tick() {
  const now = Date.now();
  const delta = (now - state.lastUpdate) / 1000;
  state.lastUpdate = now;
  const increment = state.perSecond * delta;
  if (increment > 0) {
    state.pancakes += increment;
    state.totalPancakes += increment;
    render();
  }
  requestAnimationFrame(tick);
}

function startAutosave() {
  setInterval(saveState, 5000);
}

function initFloatingBackground() {
  const colors = ['rgba(244,162,97,0.2)', 'rgba(231,111,81,0.2)', 'rgba(255,183,94,0.2)'];
  for (let i = 0; i < 24; i++) {
    const bubble = document.createElement('div');
    bubble.style.position = 'absolute';
    bubble.style.width = bubble.style.height = `${Math.random() * 12 + 6}px`;
    bubble.style.borderRadius = '50%';
    bubble.style.background = colors[i % colors.length];
    bubble.style.left = Math.random() * 100 + '%';
    bubble.style.top = Math.random() * 100 + '%';
    bubble.style.filter = 'blur(1px)';
    bubble.style.animation = `float ${6 + Math.random() * 6}s infinite ease-in-out`;
    document.body.appendChild(bubble);
  }
  const style = document.createElement('style');
  style.textContent = `@keyframes float {0%{transform:translateY(0);}50%{transform:translateY(-8px);}100%{transform:translateY(0);}}`;
  document.head.appendChild(style);
}

function init() {
  loadState();
  initTabs();
  initFloatingBackground();
  elements.pancakeStack.addEventListener('click', clickPancake);
  elements.toggleSound.addEventListener('click', () => {
    state.soundOn = !state.soundOn;
    elements.toggleSound.textContent = state.soundOn ? '🔊 Sound On' : '🔇 Sound Off';
  });
  elements.toggleSound.textContent = state.soundOn ? '🔊 Sound On' : '🔇 Sound Off';
  renderSettings();
  render();
  startAutosave();
  tick();
  window.pancakeGame = { state, addPancakes, render, buyProducer, buyUpgrade };
}

document.addEventListener('DOMContentLoaded', init);
