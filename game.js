(() => {
  const { Engine, Bodies, Body, Composite, Events } = Matter;
  const shotPhysics = window.onzeShotPhysics;
  const matchStatsApi = window.onzeMatchStats;
  const staminaPhysics = window.onzePlayerStamina;
  const canvas = document.querySelector("#pitch");
  const context = canvas.getContext("2d");
  const worldWidth = 1200;
  const worldHeight = 720;
  const field = { left: 80, right: 1120, top: 70, bottom: 650 };
  const goal = { top: 285, bottom: 435 };
  const engine = Engine.create({ gravity: { x: 0, y: 0 }, positionIterations: 8, velocityIterations: 6 });
  engine.enableSleeping = false;
  let wallImpactPending = false;

  const ui = {
    brand: document.querySelector("#brand-screen"),
    menu: document.querySelector("#menu-screen"),
    config: document.querySelector("#config-screen"),
    kickCharge: document.querySelector("#kick-charge"),
    kickChargeValue: document.querySelector("#kick-charge-value"),
    kickChargeFill: document.querySelector("#kick-charge-fill"),
    feintCooldown: document.querySelector("#feint-cooldown"),
    feintCooldownValue: document.querySelector("#feint-cooldown-value"),
    intro: document.querySelector("#intro-screen"),
    introCompetition: document.querySelector("#intro-competition"),
    introCompetitionMark: document.querySelector("#intro-competition-mark"),
    introHome: document.querySelector("#intro-home"),
    introAway: document.querySelector("#intro-away"),
    introDetails: document.querySelector("#intro-details"),
    skipIntro: document.querySelector("#skip-intro"),
    competitionReveal: document.querySelector("#competition-reveal-screen"),
    competitionRevealLogo: document.querySelector("#competition-reveal-logo"),
    competitionRevealName: document.querySelector("#competition-reveal-name"),
    kickoffCountdown: document.querySelector("#kickoff-countdown"),
    kickoffScore: document.querySelector("#kickoff-score"),
    kickoffScorers: document.querySelector("#kickoff-scorers"),
    kickoffDirections: document.querySelector("#kickoff-directions"),
    matchCountdownScreen: document.querySelector("#match-countdown-screen"),
    matchCountdownLabel: document.querySelector("#match-countdown-label"),
    matchCountdown: document.querySelector("#match-countdown"),
    loading: document.querySelector("#loading-screen"),
    loadingImage: document.querySelector("#loading-image"),
    loadingTitle: document.querySelector("#loading-title"),
    loadingCaption: document.querySelector("#loading-caption"),
    selectionBackdrop: document.querySelector("#selection-backdrop"),
    foul: document.querySelector("#foul-screen"),
    foulTeamMark: document.querySelector("#foul-team-mark"),
    foulCountdown: document.querySelector("#foul-countdown"),
    foulDetail: document.querySelector("#foul-detail"),
    freeKick: document.querySelector("#freekick-screen"),
    pause: document.querySelector("#pause-screen"),
    goal: document.querySelector("#goal-screen"),
    crowdCheer: document.querySelector("#crowd-cheer-screen"),
    cooling: document.querySelector("#cooling-screen"),
    result: document.querySelector("#result-screen"),
    homeScore: document.querySelector("#home-score"),
    awayScore: document.querySelector("#away-score"),
    homeMatchMark: document.querySelector("#home-match-mark"),
    awayMatchMark: document.querySelector("#away-match-mark"),
    homeMatchMark: document.querySelector("#home-match-mark"),
    awayMatchMark: document.querySelector("#away-match-mark"),
    clock: document.querySelector("#match-clock"),
    status: document.querySelector("#match-status"),
    statusPip: document.querySelector("#status-pip"),
    pauseEyebrow: document.querySelector("#pause-eyebrow"),
    pauseTitle: document.querySelector("#pause-title"),
    resumeLabel: document.querySelector("#resume-label"),
    halftimeHome: document.querySelector("#halftime-home"),
    halftimeAway: document.querySelector("#halftime-away"),
    halftimeResult: document.querySelector("#halftime-result"),
    halftimeScorers: document.querySelector("#halftime-scorers"),
    halftimeScorers: document.querySelector("#halftime-scorers"),
    halftimeCountdown: document.querySelector("#halftime-countdown"),
    halftimeScore: document.querySelector("#halftime-score"),
    halftimeSides: document.querySelector("#halftime-sides"),
    halftimeActions: document.querySelector("#halftime-actions"),
    goalTitle: document.querySelector("#goal-title"),
    goalTeam: document.querySelector("#goal-team"),
    goalTeamMark: document.querySelector("#goal-team-mark"),
    goalScore: document.querySelector("#goal-score"),
    goalCountdown: document.querySelector("#goal-countdown"),
    resultHomeTeam: document.querySelector("#result-home-team"),
    resultAwayTeam: document.querySelector("#result-away-team"),
    onlineResultDelta: document.querySelector("#online-result-delta"),
    forfeitButton: document.querySelector("#forfeit-button"),
    afkWarning: document.querySelector("#afk-warning"),
    coolingCountdown: document.querySelector("#cooling-countdown"),
  };

  const kits = {
    rivage: { name: "RIVAGE", color: "#c4f277", rival: "ATLAS", rivalColor: "#ff796c" },
    atlas: { name: "ATLAS", color: "#ff796c", rival: "RIVAGE", rivalColor: "#c4f277" },
    azur: { name: "AZUR", color: "#63d9ef", rival: "SOLAIRE", rivalColor: "#ffd166" },
    solaire: { name: "SOLAIRE", color: "#ffd166", rival: "AZUR", rivalColor: "#63d9ef" },
  };

  const clubs = {
    barcelona: { name: "FC BARCELONA", player: "LAMINE YAMAL", crest: "1/barca.webp", competition: "laliga", color: "#a50044", accent: "#004d98" },
    "real-madrid": { name: "REAL MADRID", player: "KYLIAN MBAPPÉ", crest: "1/rm.svg", competition: "laliga", color: "#f5f1e8", accent: "#d8b14a" },
    "man-city": { name: "MANCHESTER CITY", player: "ERLING HAALAND", crest: "1/manc.webp", competition: "premier-league", color: "#6cabdd", accent: "#1c2c5b" },
    arsenal: { name: "ARSENAL", player: "BUKAYO SAKA", crest: "1/ars.png", competition: "premier-league", color: "#ef0107", accent: "#ffffff" },
    psg: { name: "PARIS SAINT-GERMAIN", player: "DÉSIRÉ DOUE", crest: "1/psg.webp", competition: "ligue-1", color: "#004170", accent: "#da291c" },
    marseille: { name: "OLYMPIQUE DE MARSEILLE", player: "MASON GREENWOOD", crest: "1/mars.svg", competition: "ligue-1", color: "#54b9e8", accent: "#ffffff" },
  };
  const nations = {
    "nation-france": { name: "FRANCE", player: "KYLIAN MBAPPÉ", flag: "1/flags/france.svg", color: "#183b8b", accent: "#ef3340" },
    "nation-spain": { name: "ESPAGNE", player: "LAMINE YAMAL", flag: "1/flags/spain.svg", color: "#c60b1e", accent: "#ffc400" },
    "nation-england": { name: "ANGLETERRE", player: "JUDE BELLINGHAM", flag: "1/flags/england.svg", color: "#f4f4f4", accent: "#d71920" },
    "nation-germany": { name: "ALLEMAGNE", player: "JAMAL MUSIALA", flag: "1/flags/germany.svg", color: "#171717", accent: "#d71920" },
    "nation-argentina": { name: "ARGENTINE", player: "LIONEL MESSI", flag: "1/flags/argentina.svg", color: "#75aadb", accent: "#f5f5f0" },
    "nation-brazil": { name: "BRÉSIL", player: "VINÍCIUS JÚNIOR", flag: "1/flags/brazil.svg", color: "#159447", accent: "#ffdf00" },
    "nation-portugal": { name: "PORTUGAL", player: "CRISTIANO RONALDO", flag: "1/flags/portugal.svg", color: "#046a38", accent: "#da291c" },
    "nation-morocco": { name: "MAROC", player: "ACHRAF HAKIMI", flag: "1/flags/morocco.svg", color: "#c1272d", accent: "#006233" },
    "nation-congo": { name: "RD CONGO", player: "YOANE WISSA", flag: "1/1/rdc.png", color: "#007fff", accent: "#f7d618" },
    "nation-mali": { name: "MALI", player: "YVES BISSOUMA", flag: "1/1/mali.svg", color: "#14a44d", accent: "#f3d03e" },
    "nation-cameroon": { name: "CAMEROUN", player: "VINCENT ABOUBAKAR", crest: "1/1/camer.webp", color: "#007a3d", accent: "#ce1126" },
    "nation-cote-ivoire": { name: "CÔTE D’IVOIRE", player: "SÉBASTIEN HALLER", flag: "1/flags/cote-ivoire.svg", color: "#f77f00", accent: "#009e60" },
    "nation-russia": { name: "RUSSIE", player: "ALEKSANDR GOLOVIN", flag: "1/1/ru.png", color: "#ffffff", accent: "#d52b1e" },
  };
  for (const select of document.querySelectorAll("#home-club, #away-club")) {
    const nationGroup = select.querySelector('optgroup[label="Sélections nationales"]');
    for (const [value, nation] of Object.entries(nations)) {
      if (select.querySelector(`option[value="${value}"]`)) continue;
      const option = document.createElement("option");
      option.value = value;
      option.textContent = nation.name;
      nationGroup.append(option);
    }
  }
  const competitions = {
    laliga: { name: "LALIGA", crest: "1/lali.png" },
    "premier-league": { name: "PREMIER LEAGUE", crest: "1/pl.svg" },
    "ligue-1": { name: "LIGUE 1", crest: "1/ligue1.png" },
    "champions-league": { name: "LIGUE DES CHAMPIONS", crest: "1/ldc.png" },
    "world-cup": { name: "COUPE DU MONDE", crest: "1/wc.png" },
  };

  const competitionBackdrops = {
    laliga: "1/1/laligamatchloading.jpg",
    "premier-league": "1/1/haalandloading.webp",
    "ligue-1": "1/1/ligue1matchloading.jpeg",
    "champions-league": "1/1/uclmatchloading.webp",
    "world-cup": "1/1/WC26matchLoading_.jpg",
  };
  const playerImagesByTeam = {
    barcelona: ["1/1/yamal26loading.jpg", "1/1/yamalloading.webp"],
    "man-city": ["1/1/haalandloading.webp", "1/1/mancity.webp"],
    arsenal: ["1/1/declanriceloading.celeb"],
    psg: ["1/1/desireloading.webp"],
    marseille: ["1/1/marseilleloading.webp"],
    "nation-spain": ["1/1/yamal26loading.jpg", "1/1/yamalloading.webp"],
    "nation-argentina": ["1/1/argloading.webp"],
  };
  const competitionColors = { laliga: "#f2764f", "premier-league": "#81c7e8", "ligue-1": "#54b9e8", "champions-league": "#8db6ff", "world-cup": "#f2c65d" };
  const stadiumPalettes = {
    clear: { background: "#172a21", pitch: "#286843", stripes: ["#347d50", "#30764b"], stand: "#111a17", rows: ["#26382f", "#1b2b25"], seats: ["#21352f", "#31473e", "#3b4e43", "#293e37", "#5a4939"], rail: "#a5ad95", roof: "#53645a" },
    rain: { background: "#17262a", pitch: "#245a49", stripes: ["#2d7058", "#28634f"], stand: "#10191c", rows: ["#1b2b30", "#142226"], seats: ["#23383d", "#304a4c", "#3d5554", "#263b40", "#4a4941"], rail: "#78918d", roof: "#3c5555" },
    snow: { background: "#202c34", pitch: "#426c54", stripes: ["#4d795f", "#3e684f"], stand: "#161f27", rows: ["#27343c", "#1e2a32"], seats: ["#34434a", "#435157", "#536066", "#303f48", "#5a594f"], rail: "#aebdc0", roof: "#718087" },
  };
  const ballStyles = {
    classic: { name: "CLASSIQUE", base: "#f5f2e8", panel: "#19251f", accent: "#19251f", glow: "#1023198c" },
    neon: { name: "NÉON", base: "#10182b", panel: "#12e6df", accent: "#ff4f9b", glow: "#18e7e0cc" },
    gold: { name: "OR", base: "#f5c84b", panel: "#70401e", accent: "#fff0ac", glow: "#f5c84bcc" },
    street: { name: "STREET", base: "#ee5b34", panel: "#172b4c", accent: "#f7f3e8", glow: "#ee5b34cc" },
  };
  const weatherPicker = document.querySelector(".weather-picker");
  const clearWeatherButton = weatherPicker.querySelector('[data-weather="clear"]');
  clearWeatherButton.classList.remove("is-selected");
  clearWeatherButton.setAttribute("aria-pressed", "false");
  const randomWeatherButton = document.createElement("button");
  randomWeatherButton.type = "button";
  randomWeatherButton.dataset.weather = "random";
  randomWeatherButton.textContent = "ALÉATOIRE";
  randomWeatherButton.className = "is-selected";
  randomWeatherButton.setAttribute("aria-pressed", "true");
  weatherPicker.prepend(randomWeatherButton);
  const matchSettingsGrid = weatherPicker.closest(".match-settings-grid");
  const ballStyleSetting = document.createElement("div");
  ballStyleSetting.className = "match-setting ball-match-setting";
  const ballStyleTitle = document.createElement("span");
  ballStyleTitle.className = "setup-label";
  ballStyleTitle.textContent = "BALLON DU MATCH";
  const ballStylePicker = document.createElement("div");
  ballStylePicker.className = "ball-picker";
  ballStylePicker.setAttribute("role", "group");
  ballStylePicker.setAttribute("aria-label", "Choisir un ballon");
  for (const [style, details] of Object.entries(ballStyles)) {
    const option = document.createElement("button");
    option.type = "button";
    option.dataset.ballStyle = style;
    option.setAttribute("aria-pressed", String(style === "classic"));
    option.classList.toggle("is-selected", style === "classic");
    const swatch = document.createElement("i");
    swatch.className = `ball-swatch ball-swatch-${style}`;
    swatch.setAttribute("aria-hidden", "true");
    const name = document.createElement("span");
    name.textContent = details.name;
    option.append(swatch, name);
    ballStylePicker.append(option);
  }
  ballStyleSetting.append(ballStyleTitle, ballStylePicker);
  matchSettingsGrid.append(ballStyleSetting);
  const halftimeSetting = document.createElement("label");
  halftimeSetting.className = "toggle-setting";
  halftimeSetting.htmlFor = "halftime-toggle";
  const halftimeDescription = document.createElement("span");
  const halftimeTitle = document.createElement("b");
  halftimeTitle.textContent = "ENLEVER LA MI-TEMPS";
  const halftimeHelp = document.createElement("small");
  halftimeHelp.textContent = "Jouer sans pause ni changement de côté à mi-match";
  halftimeDescription.append(halftimeTitle, halftimeHelp);
  const halftimeToggle = document.createElement("input");
  halftimeToggle.type = "checkbox";
  halftimeToggle.id = "halftime-toggle";
  halftimeToggle.checked = false;
  const halftimeIndicator = document.createElement("i");
  halftimeIndicator.setAttribute("aria-hidden", "true");
  halftimeSetting.append(halftimeDescription, halftimeToggle, halftimeIndicator);
  matchSettingsGrid.append(halftimeSetting);
  ballStylePicker.addEventListener("click", (event) => {
    const option = event.target.closest("[data-ball-style]");
    if (!option) return;
    selectedBallStyle = option.dataset.ballStyle;
    ballStylePicker.querySelectorAll("[data-ball-style]").forEach((choice) => {
      const selected = choice === option;
      choice.classList.toggle("is-selected", selected);
      choice.setAttribute("aria-pressed", String(selected));
    });
  });
  halftimeToggle.addEventListener("change", () => { halftimeEnabled = !halftimeToggle.checked; });
  const imageCache = new Map();

  const botLevels = {
    easy: { speed: 6.4, strength: 0.0018, reaction: 0.32, power: 8.5, accuracy: 0.58, cooldown: 1.25, dribble: 0.62 },
    normal: { speed: 8.1, strength: 0.0025, reaction: 0.2, power: 10.5, accuracy: 0.78, cooldown: 0.82, dribble: 0.42 },
    hard: { speed: 8.1, strength: 0.0025, reaction: 0.05, power: 15, accuracy: 0.92, cooldown: 0.45, dribble: 0.2 },
  };
  const previewBot = { ...botLevels.hard, speed: 4.2, strength: 0.0075, reaction: 0.06, power: 12, accuracy: 0.82, cooldown: 0.45, avoidCorners: true };

  let selectedKit = "rivage";
  let selectedCompetition = "laliga";
  let matchCompetitionName = "LALIGA";
  let matchCompetitionCrest = "1/lali.png";
  let competitionIsAutomatic = true;
  let matchHomeTeam = { name: clubs.barcelona.name, crest: clubs.barcelona.crest };
  let matchAwayTeam = { name: clubs["real-madrid"].name, crest: clubs["real-madrid"].crest };
  let configStep = 0;
  let introElapsed = 0;
  let selectedBotLevel = "hard";
  let selectedWeather = "random";
  let matchWeather = "clear";
  let selectedBallStyle = "classic";
  let halftimeEnabled = true;
  let trainingMode = false;
  let trainingGoalResetEnabled = true;
  let trainingGoalLatched = false;
  let localDuelMode = false;
  let onlineMatch = null;
  let onlineSide = null;
  let lastNetworkInputAt = 0;
  let matchLength = 90;
  let remaining = matchLength;
  let halftimeExtraRemaining = 0;
  let finalTimeBonusRemaining = null;
  let elapsed = 0;
  let previewElapsed = 0;
  let eventRemaining = 0;
  let loadingChangeRemaining = 0;
  let loadingImages = [];
  let foulSpot = null;
  let freeKickOrigin = null;
  let freeKickPending = false;
  let foulOffenderSide = null;
  let freeKickVictimSide = null;
  let freeKickBallPlayed = false;
  let shirtPullAttempt = null;
  let shirtPullFlashUntil = 0;
  let shotFlash = null;
  let feintUntil = 0;
  let feintCooldownRemaining = 0;
  let feintDirection = { x: 0, y: 1 };
  let boardElapsed = 0;
  let boardNextChange = 4 + Math.random() * 9;
  let boardMode = "score";
  let boardPlayerImage = null;
  let boardPlayerName = "";
  let boardAd = "ONZE · LE MATCH EST À VOUS";
  let halftimeRevealElapsed = 0;
  let playerSpeed = 1;
  let stamina = 100;
  let rivalStamina = 100;
  let botResting = false;
  let botRestElapsed = 0;
  let goalBallLocked = false;
  let runTrailPoints = [];
  let rivalRunTrailPoints = [];
  let lastRunTrailRecordAt = -Infinity;
  let lastRivalRunTrailRecordAt = -Infinity;
  let crowdPhase = "match";
  let crowdElapsed = 0;
  let celebrationElapsed = 0;
  let crowdFocusX = 600;
  let crowdFocusY = 360;
  let crowdAnimationTime = 0;
  let weatherTime = 0;
  let screenShakeRemaining = 0;
  let screenShakeDuration = 0;
  let screenShakeAmplitude = 0;
  let ballJostleTime = 0;
  let lastBallJostleAt = -Infinity;
  let bumpBoostTime = 0;
  const refereePosition = { x: 600, y: 318 };
  let confetti = [];
  let menuPhraseIndex = 0;
  let coolingBreakEnabled = true;
  const coolingBreaks = new Set();
  let half = 1;
  let homeAttackDirection = 1;
  let lastFrame = 0;
  let lastHudUpdate = 0;
  let physicsRemainder = 0;
  let screen = "brand";
  let homeGoals = 0;
  let awayGoals = 0;
  const goalScorers = { home: 0, away: 0 };
  let currentMatchStats = matchStatsApi.createMatchStats();
  let kickStarted = null;
  let lastKickAt = -1;
  let ballOwner = null;
  const possessionLockedUntil = { human: 0, rival: 0 };
  let player2KickStarted = null;
  let player2LastKickAt = -1;
  let player2FeintUntil = 0;
  let player2FeintCooldownRemaining = 0;
  let player2FeintDirection = { x: 0, y: 1 };
  let player2ShirtPullFlashUntil = 0;
  let touchShoot = false;
  let bindingAction = null;
  let bindingPlayer = 1;
  let celebrationSide = "home";
  let goalKickoffOwner = null;
  let goalRepositionStarted = false;
  let ballTrail = [];
  let activeShot = null;
  let shotEffect = null;
  let touchEffect = null;
  let floatEffect = null;
  const keyBindings = { up: "arrowup", down: "arrowdown", left: "arrowleft", right: "arrowright", shoot: " ", slow: "b", feint: "f" };
  const secondKeyBindings = { up: "w", down: "s", left: "a", right: "d", shoot: "enter", slow: "p", feint: "m" };
  try {
    const savedBindings = JSON.parse(localStorage.getItem("onze-key-bindings") || "{}");
    Object.assign(keyBindings, savedBindings);
    if (savedBindings.player2) {
      Object.assign(secondKeyBindings, savedBindings.player2);
      delete keyBindings.player2;
    }
  } catch {}
  const menuPhrases = [
    "Un ballon, un terrain, et rien d’autre à prouver.",
    "Chaque seconde peut changer le match.",
    "Le prochain but n’attend que vous.",
    "Jouez ensemble. Battez-les à la fin.",
    "Les tribunes sont prêtes. À vous de jouer.",
  ];
  const crowdPalette = ["#f4f0dc", "#e4b85d", "#e96858", "#6fc5bb", "#aec9e9", "#f2d4b8"];
  const skinPalette = ["#f0c49a", "#d99b70", "#ad714f", "#80533e"];
  const keys = new Set();
  const mobileKeys = new Set();

  const ball = Bodies.circle(600, 360, 11, {
    label: "ball", density: 0.0012, friction: 0.055, frictionAir: 0.008, restitution: 0.58,
    collisionFilter: { category: 0x0002, mask: 0x0001 | 0x0004 },
  });
  const human = makePlayer(430, 360, "human");
  const rival = makePlayer(775, 360, "rival");
  const crowd = createCrowd();

  function makePlayer(x, y, label, radius = 21) {
    return Bodies.circle(x, y, radius, {
      label, density: 0.004, friction: 0.07, frictionAir: 0.12, restitution: 0.08,
      collisionFilter: { category: 0x0004, mask: 0x0001 | 0x0002 | 0x0004 },
    });
  }

  function wall(x, y, width, height, label = "wall") {
    return Bodies.rectangle(x, y, width, height, {
      label, isStatic: true, restitution: 0.48, friction: 0.02,
      collisionFilter: { category: 0x0001, mask: 0x0002 | 0x0004 },
    });
  }

  const boundaries = [
    wall(600, field.top - 10, 1060, 20), wall(600, field.bottom + 10, 1060, 20),
    wall(field.left - 10, 177.5, 20, 215), wall(field.left - 10, 542.5, 20, 215),
    wall(field.right + 10, 177.5, 20, 215), wall(field.right + 10, 542.5, 20, 215),
    wall(51, goal.top - 8, 58, 16, "post"), wall(51, goal.bottom + 8, 58, 16, "post"),
    wall(1149, goal.top - 8, 58, 16, "post"), wall(1149, goal.bottom + 8, 58, 16, "post"),
    wall(22, 360, 14, 150), wall(1178, 360, 14, 150),
  ];

  Composite.add(engine.world, [...boundaries, ball, human, rival]);

  Events.on(engine, "collisionStart", ({ pairs }) => {
    if (screen !== "playing" && screen !== "freekick") return;
    let hitWall = false;
    for (const { bodyA, bodyB } of pairs) {
      const obstacle = bodyA === ball ? bodyB : bodyB === ball ? bodyA : null;
      if (!obstacle || (obstacle.label !== "post" && obstacle.label !== "wall")) continue;
      const impactSpeed = Math.hypot(ball.velocity.x - obstacle.velocity.x, ball.velocity.y - obstacle.velocity.y);
      const impact = Math.min(1, impactSpeed / 17);
      if (obstacle.label === "post") startScreenShake(1 + impact * 4, 1 + impact * 3);
      else {
        hitWall = true;
        startScreenShake(0.35 + impact * 2.65, 0.45 + impact * 1.65);
      }
    }
    if (hitWall) wallImpactPending = true;
  });

  function resolveTeam(selectId, nameInputId, fallback, defaultColor, defaultAccent) {
    const selection = document.querySelector(selectId).value;
    if (clubs[selection] || nations[selection]) return { ...(clubs[selection] || nations[selection]) };
    if (selection === "custom") {
      const name = document.querySelector(nameInputId).value.trim() || fallback;
      return { name: name.toLocaleUpperCase("fr"), crest: null, color: defaultColor, accent: defaultAccent };
    }
    return { name: fallback, crest: null, color: defaultColor, accent: defaultAccent };
  }

  function syncClubChoice(side) {
    const select = document.querySelector(`#${side}-club`);
    const crest = document.querySelector(`#${side}-club-crest`);
    const flag = document.querySelector(`#${side}-club-flag`);
    const team = clubs[select.value] || nations[select.value];
    crest.hidden = !team?.crest;
    flag.hidden = !team?.flag;
    if (team?.crest) {
      crest.onerror = () => { crest.hidden = true; };
      crest.src = team.crest;
    }
    if (team?.flag) flag.src = team.flag;
  }

  function syncCompetitionChoice() {
    const homeChoice = document.querySelector("#home-club").value;
    const awayChoice = document.querySelector("#away-club").value;
    const countryMatch = Boolean(nations[homeChoice] || nations[awayChoice]);
    const interLeagueMatch = Boolean(clubs[homeChoice] && clubs[awayChoice] && clubs[homeChoice].competition !== clubs[awayChoice].competition);
    selectedCompetition = countryMatch ? "world-cup" : interLeagueMatch ? "champions-league" : clubs[homeChoice]?.competition || clubs[awayChoice]?.competition || "laliga";
    const competition = competitions[selectedCompetition];
    document.querySelector("#competition-auto").textContent = competition?.name || "MATCH AMICAL";
  }

  function updateMatchup(changedSide = null) {
    const homeSelect = document.querySelector("#home-club");
    const awaySelect = document.querySelector("#away-club");
    let homeChoice = homeSelect.value;
    let awayChoice = awaySelect.value;
    const alternateNation = (country) => country === "nation-france" ? "nation-brazil" : "nation-france";
    const alternateClub = (club) => club === "barcelona" ? "man-city" : "barcelona";

    if (nations[homeChoice] && clubs[awayChoice]) {
      if (changedSide === "away") homeSelect.value = alternateClub(awayChoice);
      else awaySelect.value = alternateNation(homeChoice);
    } else if (nations[awayChoice] && clubs[homeChoice]) {
      if (changedSide === "home") awaySelect.value = alternateClub(homeChoice);
      else homeSelect.value = alternateNation(awayChoice);
    }
    homeChoice = homeSelect.value;
    awayChoice = awaySelect.value;
    syncClubChoice("home");
    syncClubChoice("away");

    const countryMatch = Boolean(nations[homeChoice] || nations[awayChoice]);
    const interLeagueMatch = Boolean(clubs[homeChoice] && clubs[awayChoice] && clubs[homeChoice].competition !== clubs[awayChoice].competition);
    if (countryMatch) {
      selectedCompetition = "world-cup";
    } else if (interLeagueMatch) {
      selectedCompetition = "champions-league";
    } else {
      selectedCompetition = clubs[homeChoice]?.competition || clubs[awayChoice]?.competition || "laliga";
    }
    syncCompetitionChoice();
    const jersey = kits[selectedKit] || kits.rivage;
    matchHomeTeam = resolveTeam("#home-club", "", "ÉQUIPE LOCALE", jersey.color, jersey.rivalColor);
    matchAwayTeam = resolveTeam("#away-club", "", "ADVERSAIRE", jersey.rivalColor, jersey.color);
    if (onlineMatch?.teams) {
      matchHomeTeam.name = `${matchHomeTeam.name} · ${onlineMatch.teams.home.name}`;
      matchAwayTeam.name = `${matchAwayTeam.name} · ${onlineMatch.teams.away.name}`;
    }
    boardMode = "score";
    boardPlayerImage = null;
    const competition = competitions[selectedCompetition];
    matchCompetitionName = competition?.name || "MATCH AMICAL";
    matchCompetitionCrest = competition?.crest || null;
    document.querySelector("#home-name").textContent = matchHomeTeam.name;
    document.querySelector("#away-name").textContent = matchAwayTeam.name;
    document.querySelector("#pitch-competition-label").textContent = matchCompetitionName;
    updateTeamColors();
  }

  function renderTeamMark(container, team) {
    container.replaceChildren();
    if (team.crest) {
      const image = document.createElement("img");
      image.src = team.crest;
      image.alt = "";
      image.addEventListener("error", () => {
        const fallback = document.createElement("span");
        fallback.className = "custom-crest";
        fallback.textContent = team.name.slice(0, 2);
        image.replaceWith(fallback);
      }, { once: true });
      container.append(image);
    } else if (team.flag) {
      const flag = document.createElement("img");
      flag.className = "flag-crest";
      flag.src = team.flag;
      flag.alt = "";
      container.append(flag);
    } else {
      const crest = document.createElement("span");
      crest.className = "custom-crest";
      crest.textContent = team.name.slice(0, 2);
      container.append(crest);
    }
  }

  function renderIntroTeam(container, team) {
    renderTeamMark(container, team);
    const name = document.createElement("span");
    name.textContent = team.name;
    container.append(name);
  }

  function renderCompactTeamMark(container, team) {
    container.replaceChildren();
    if (team.crest || team.flag) {
      const mark = document.createElement("img");
      mark.src = team.flag || team.crest;
      mark.alt = "";
      mark.addEventListener("error", () => {
        const fallback = document.createElement("span");
        fallback.className = "custom-crest";
        fallback.textContent = team.name.slice(0, 2);
        mark.replaceWith(fallback);
      }, { once: true });
      container.append(mark);
    } else {
      const mark = document.createElement("span");
      mark.className = "custom-crest";
      mark.textContent = team.name.slice(0, 2);
      container.append(mark);
    }
    container.hidden = false;
  }

  const configTitles = [
    ["Équipes", "du match."],
    ["Durée", "du match."],
    ["Niveau", "du bot."],
    ["Vitesse", "du joueur."],
    ["Conditions", "du match."],
  ];

  function showConfigStep(step) {
    configStep = step;
    document.querySelectorAll("[data-config-step]").forEach((panel) => {
      const active = Number(panel.dataset.configStep) === step;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });
    const title = configTitles[step];
    document.querySelector("#config-title").innerHTML = `${title[0]}<br><span>${title[1]}</span>`;
    document.querySelector("#config-step-label").textContent = `AVANT-MATCH · ${String(step + 1).padStart(2, "0")} / 05`;
    document.querySelectorAll("#config-progress i").forEach((dot, index) => {
      dot.classList.toggle("is-current", index === step);
      dot.classList.toggle("is-done", index < step);
    });
    document.querySelector("#config-back").disabled = false;
    document.querySelector("#config-back").textContent = step === 0 ? "MENU" : "RETOUR";
    document.querySelector("#config-next span").textContent = step === configTitles.length - 1 ? "JOUER LE MATCH" : "CONTINUER";
  }

  function showMatchPresentation() {
    updateMatchup();
    renderIntroTeam(ui.introHome, matchHomeTeam);
    renderIntroTeam(ui.introAway, matchAwayTeam);
    ui.introCompetition.textContent = matchCompetitionName;
    ui.introCompetitionMark.hidden = !matchCompetitionCrest;
    if (matchCompetitionCrest) ui.introCompetitionMark.src = matchCompetitionCrest;
    ui.introDetails.textContent = trainingMode ? `ENTRAÎNEMENT LIBRE · ${matchCompetitionName}` : localDuelMode ? `DUEL LOCAL · 1 CONTRE 1 · ${matchCompetitionName}` : `${formatClock(matchLength)} · BOT ${selectedBotLevel.toUpperCase()} · ${matchCompetitionName}`;
    ui.skipIntro.hidden = true;
    introElapsed = 0;
    eventRemaining = 7.5;
    setScreen("intro");
  }

  function randomBetween(minimum, maximum) {
    return minimum + Math.random() * (maximum - minimum);
  }

  function loadCanvasImage(source) {
    if (!source) return null;
    if (!imageCache.has(source)) {
      const image = new Image();
      image.src = source;
      imageCache.set(source, image);
    }
    return imageCache.get(source);
  }

  function selectedPlayerImages() {
    const home = document.querySelector("#home-club").value;
    const away = document.querySelector("#away-club").value;
    const images = [...(playerImagesByTeam[home] || []), ...(playerImagesByTeam[away] || [])];
    const franceArgentinaWorldCup = selectedCompetition === "world-cup" && ((home === "nation-france" && away === "nation-argentina") || (home === "nation-argentina" && away === "nation-france"));
    if (franceArgentinaWorldCup) images.push("1/1/mbappefrloading.jpeg", "1/1/mbappeloading.webp");
    return [...new Set(images)];
  }

  function playerImagesForTeam(teamId) {
    const images = [...(playerImagesByTeam[teamId] || [])];
    const home = document.querySelector("#home-club").value;
    const away = document.querySelector("#away-club").value;
    const franceArgentinaWorldCup = selectedCompetition === "world-cup" && ((home === "nation-france" && away === "nation-argentina") || (home === "nation-argentina" && away === "nation-france"));
    if (franceArgentinaWorldCup && teamId === "nation-france") images.push("1/1/mbappefrloading.jpeg", "1/1/mbappeloading.webp");
    return images;
  }

  function prepareLoadingSequence() {
    const players = selectedPlayerImages();
    const backdrop = competitionBackdrops[selectedCompetition];
    loadingImages = [...new Set([...players, backdrop].filter(Boolean))];
    ui.loadingTitle.textContent = trainingMode ? "LE TERRAIN SE PRÉPARE" : "LE STADE SE PRÉPARE";
    ui.loadingCaption.textContent = `${matchCompetitionName} · ${matchHomeTeam.name} — ${matchAwayTeam.name}`;
    loadingChangeRemaining = 0;
    eventRemaining = randomBetween(2, 10);
    setScreen("loading");
    updateLoadingImage();
  }

  function updateLoadingImage() {
    if (!loadingImages.length) return;
    const current = ui.loadingImage.getAttribute("src");
    const candidates = loadingImages.filter((source) => source !== current);
    const next = (candidates.length ? candidates : loadingImages)[Math.floor(Math.random() * (candidates.length || loadingImages.length))];
    ui.loadingImage.classList.remove("is-visible");
    ui.loadingImage.onload = () => ui.loadingImage.classList.add("is-visible");
    ui.loadingImage.onerror = () => {
      loadingImages = loadingImages.filter((source) => source !== next);
      if (loadingImages.length) updateLoadingImage();
    };
    ui.loadingImage.src = next;
    loadingChangeRemaining = randomBetween(0.65, 1.35);
  }

  function showTeamBackdrop(teamId) {
    const availableBackdrops = [competitionBackdrops[selectedCompetition]].filter(Boolean);
    const image = availableBackdrops[Math.floor(Math.random() * availableBackdrops.length)];
    if (!ui.selectionBackdrop || !image) return;
    ui.selectionBackdrop.onerror = () => {
      ui.selectionBackdrop.onerror = null;
      ui.selectionBackdrop.src = competitionBackdrops[selectedCompetition] || "1/1/ligue1matchloading.jpeg";
    };
    ui.selectionBackdrop.src = image;
    ui.selectionBackdrop.hidden = false;
  }

  function finishTeamIntro() {
    ui.skipIntro.hidden = true;
    ui.competitionReveal.querySelector(".eyebrow").textContent = "COMPÉTITION DU MATCH";
    ui.competitionRevealName.textContent = matchCompetitionName;
    ui.competitionRevealLogo.hidden = !matchCompetitionCrest;
    if (matchCompetitionCrest) ui.competitionRevealLogo.src = matchCompetitionCrest;
    eventRemaining = 3;
    setScreen("competitionReveal");
  }

  function startConfiguredMatch() {
    if (configStep < configTitles.length - 1) {
      const nextStep = configStep + 1;
      showConfigStep((trainingMode || localDuelMode) && nextStep === 2 ? 3 : nextStep);
      return;
    }
    prepareLoadingSequence();
  }

  function createCrowd() {
    let seed = 92417;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const fans = [];
    for (let index = 0; index < 280; index += 1) {
      const x = 8 + random() * 1184;
      fans.push({ x, y: 8 + random() * 42, zone: "top", support: random() < 0.5 ? "home" : "away", color: crowdPalette[Math.floor(random() * crowdPalette.length)], skin: skinPalette[Math.floor(random() * skinPalette.length)], size: 2.4 + random() * 2, phase: random() * Math.PI * 2, gatherX: (random() - 0.5) * 230, gatherY: (random() - 0.5) * 250, rallySpeed: 0.9 + random() * 0.7, rushDelay: random() * 0.3 });
      fans.push({ x, y: 670 + random() * 42, zone: "bottom", support: random() < 0.5 ? "home" : "away", color: crowdPalette[Math.floor(random() * crowdPalette.length)], skin: skinPalette[Math.floor(random() * skinPalette.length)], size: 2.4 + random() * 2, phase: random() * Math.PI * 2, gatherX: (random() - 0.5) * 230, gatherY: (random() - 0.5) * 250, rallySpeed: 0.9 + random() * 0.7, rushDelay: random() * 0.3 });
    }
    for (let index = 0; index < 42; index += 1) {
      const y = 82 + random() * 555;
      fans.push({ x: 8 + random() * 42, y, zone: "left", support: "home", color: crowdPalette[Math.floor(random() * crowdPalette.length)], skin: skinPalette[Math.floor(random() * skinPalette.length)], size: 2.4 + random() * 1.8, phase: random() * Math.PI * 2, gatherX: (random() - 0.5) * 230, gatherY: (random() - 0.5) * 250, rallySpeed: 0.9 + random() * 0.7, rushDelay: random() * 0.3 });
      fans.push({ x: 1150 + random() * 42, y, zone: "right", support: "away", color: crowdPalette[Math.floor(random() * crowdPalette.length)], skin: skinPalette[Math.floor(random() * crowdPalette.length)], size: 2.4 + random() * 1.8, phase: random() * Math.PI * 2, gatherX: (random() - 0.5) * 230, gatherY: (random() - 0.5) * 250, rallySpeed: 0.9 + random() * 0.7, rushDelay: random() * 0.3 });
    }
    return fans;
  }

  function setScreen(name) {
    screen = name;
    ui.brand.hidden = name !== "brand";
    ui.menu.hidden = name !== "menu";
    ui.config.hidden = name !== "config";
    ui.intro.hidden = name !== "intro";
    ui.competitionReveal.hidden = name !== "competitionReveal";
    ui.kickoffCountdown.closest(".screen").hidden = name !== "kickoffCountdown";
    ui.matchCountdownScreen.hidden = name !== "playing";
    ui.loading.hidden = name !== "loading";
    ui.foul.hidden = name !== "foul";
    ui.freeKick.hidden = name !== "freekick";
    ui.pause.hidden = name !== "pause" && name !== "halftime";
    ui.goal.hidden = name !== "goal";
    ui.crowdCheer.hidden = name !== "crowdCheer";
    ui.cooling.hidden = name !== "cooling";
    ui.result.hidden = name !== "result";
    ui.pause.classList.toggle("is-halftime", name === "halftime");
    if (name === "pause") {
      ui.pauseEyebrow.textContent = "MATCH EN PAUSE";
      ui.pauseTitle.innerHTML = "On reprend<br><span>quand vous voulez.</span>";
      ui.resumeLabel.textContent = "REPRENDRE";
      document.querySelector("#resume-button").disabled = false;
      document.querySelector("#home-button").disabled = false;
      document.querySelector("#restart-button").disabled = false;
    } else if (name === "halftime") {
      ui.pauseEyebrow.textContent = "MI-TEMPS · CHANGEMENT DE CÔTÉ";
      ui.pauseTitle.innerHTML = "On change<br><span>de côté.</span>";
      ui.resumeLabel.textContent = "JOUER LA 2E MI-TEMPS";
    } else if (name === "goal") {
      ui.status.textContent = "BUT · CÉLÉBRATION";
    } else if (name === "cooling") {
      ui.status.textContent = "PAUSE FRAÎCHEUR";
    } else if (name === "crowdCheer") {
      ui.status.textContent = "LES TRIBUNES S’ENFLAMMENT";
    } else if (name === "crowdReturn") {
      ui.status.textContent = "LES SUPPORTERS REGAGNENT LES TRIBUNES";
    } else if (name === "intro") {
      ui.status.textContent = "PRÉSENTATION DES ÉQUIPES";
    } else if (name === "competitionReveal") {
      ui.status.textContent = "PRÉSENTATION DE LA COMPÉTITION";
    } else if (name === "kickoffCountdown") {
      ui.status.textContent = "COUP D’ENVOI DANS 3";
    } else if (name === "loading") {
      ui.status.textContent = "PRÉPARATION DU TERRAIN";
    } else if (name === "foul") {
      ui.status.textContent = "FAUTE · TIRAGE DE MAILLOT";
    } else if (name === "freekick") {
      ui.status.textContent = "COUP FRANC · JOUEZ LE BALLON";
    }
    if (!["goal", "cooling", "crowdCheer", "crowdReturn", "intro", "competitionReveal", "kickoffCountdown", "loading", "foul", "freekick", "brand"].includes(name)) ui.status.textContent = name === "playing" ? onlineMatch ? "MATCH CLASSÉ · EN LIGNE" : trainingMode ? "ENTRAÎNEMENT LIBRE" : localDuelMode ? "DUEL LOCAL · 1 CONTRE 1" : halftimeEnabled ? `MATCH EN COURS · ${half}${half === 1 ? "RE" : "E"} MI-TEMPS` : "MATCH EN COURS" : name === "pause" ? "MATCH EN PAUSE" : name === "halftime" ? "MI-TEMPS · CHANGEMENT DE CÔTÉ" : name === "result" ? "COUP DE SIFFLET FINAL" : "EN ATTENTE DU COUP D’ENVOI";
    ui.statusPip.classList.toggle("is-live", name === "playing");
  }

  function resetMatch() {
    remaining = matchLength;
    halftimeExtraRemaining = randomBetween(1, 2);
    finalTimeBonusRemaining = null;
    elapsed = 0;
    half = 1;
    homeAttackDirection = 1;
    homeGoals = 0;
    awayGoals = 0;
    goalScorers.home = 0;
    goalScorers.away = 0;
    stamina = 100;
    rivalStamina = 100;
    botResting = false;
    botRestElapsed = 0;
    goalBallLocked = false;
    runTrailPoints = [];
    rivalRunTrailPoints = [];
    goalKickoffOwner = null;
    goalRepositionStarted = false;
    lastRunTrailRecordAt = -Infinity;
    lastRivalRunTrailRecordAt = -Infinity;
    currentMatchStats = matchStatsApi.createMatchStats();
    trainingGoalLatched = false;
    ballJostleTime = 0;
    lastBallJostleAt = -Infinity;
    bumpBoostTime = 0;
    screenShakeRemaining = 0;
    player2KickStarted = null;
    player2LastKickAt = -1;
    player2FeintUntil = 0;
    player2FeintCooldownRemaining = 0;
    player2ShirtPullFlashUntil = 0;
    ballOwner = null;
    ball.collisionFilter.group = 0;
    human.collisionFilter.group = 0;
    rival.collisionFilter.group = 0;
    possessionLockedUntil.human = 0;
    possessionLockedUntil.rival = 0;
    crowdPhase = "match";
    crowdElapsed = 0;
    for (const fan of crowd) {
      delete fan.targetX;
      delete fan.targetY;
    }
    coolingBreaks.clear();
    keys.clear();
    mobileKeys.clear();
    kickStarted = null;
    lastKickAt = -1;
    ballTrail = [];
    activeShot = null;
    shotFlash = null;
    shotEffect = null;
    touchEffect = null;
    floatEffect = null;
    feintUntil = 0;
    feintCooldownRemaining = 0;
    shirtPullFlashUntil = 0;
    freeKickPending = false;
    foulOffenderSide = null;
    freeKickVictimSide = null;
    freeKickBallPlayed = false;
    shirtPullAttempt = null;
    touchShoot = false;
    document.querySelectorAll("[data-key].is-held").forEach((button) => button.classList.remove("is-held"));
    document.querySelector("#mobile-shoot").classList.remove("is-held");
    ui.homeScore.textContent = "0";
    ui.awayScore.textContent = "0";
    Body.setPosition(ball, { x: 600, y: 360 });
    Body.setVelocity(ball, { x: 0, y: 0 });
    ballTrail = [];
    Body.setAngularVelocity(ball, 0);
    Body.setPosition(human, { x: 430, y: 360 });
    Body.setVelocity(human, { x: 0, y: 0 });
    human.lastShot = -Infinity;
    Body.setPosition(rival, { x: 775, y: 360 });
    Body.setVelocity(rival, { x: 0, y: 0 });
    rival.collisionFilter.mask = trainingMode ? 0 : 0x0001 | 0x0002 | 0x0004;
    rival.lastShot = -Infinity;
    ui.clock.textContent = formatClock(remaining);
    updateMatchup();
  }

  function formatClock(seconds) {
    const whole = Math.max(0, Math.ceil(seconds));
    return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
  }

  function updateMatchCountdown() {
    if (screen !== "playing" || trainingMode || onlineMatch) {
      ui.matchCountdownScreen.hidden = true;
      return;
    }
    const showingHalftime = halftimeEnabled && half === 1;
    const mainTime = showingHalftime ? matchLength / 2 - elapsed : remaining;
    const bonusTime = showingHalftime ? halftimeExtraRemaining : finalTimeBonusRemaining;
    if (mainTime > 0 && mainTime <= 10) {
      ui.matchCountdownLabel.textContent = showingHalftime ? "MI-TEMPS DANS" : "FIN DU MATCH DANS";
      ui.matchCountdown.textContent = String(Math.ceil(mainTime));
      ui.matchCountdownScreen.hidden = false;
    } else if (mainTime <= 0 && bonusTime !== null && bonusTime > 0) {
      ui.matchCountdownLabel.textContent = "TEMPS ADDITIONNEL";
      ui.matchCountdown.textContent = String(Math.ceil(bonusTime));
      ui.matchCountdownScreen.hidden = false;
    } else {
      ui.matchCountdownScreen.hidden = true;
    }
  }

  function beginMatch() {
    setMatchWeather();
    resetMatch();
    physicsRemainder = 0;
    if (trainingMode) ui.clock.textContent = "∞";
    setScreen("playing");
  }

  function setMatchWeather() {
    const weatherOptions = ["clear", "rain", "snow"];
    matchWeather = selectedWeather === "random" ? weatherOptions[Math.floor(Math.random() * weatherOptions.length)] : selectedWeather;
    weatherTime = 0;
  }

  function startKickoffCountdown() {
    setMatchWeather();
    resetMatch();
    physicsRemainder = 0;
    if (trainingMode) ui.clock.textContent = "∞";
    startRestartCountdown();
  }

  function startRestartCountdown() {
    ui.kickoffScore.textContent = `${homeGoals} — ${awayGoals}`;
    ui.kickoffScorers.textContent = formatScorerSummary();
    const homeTarget = homeAttackDirection > 0 ? "BUT DROIT" : "BUT GAUCHE";
    const awayTarget = homeAttackDirection > 0 ? "BUT GAUCHE" : "BUT DROIT";
    ui.kickoffDirections.textContent = `${matchHomeTeam.name} · ATTAQUE ${homeTarget}  |  ${matchAwayTeam.name} · ATTAQUE ${awayTarget}`;
    eventRemaining = 3;
    ui.kickoffCountdown.textContent = "3";
    setScreen("kickoffCountdown");
  }

  function beginSecondHalf() {
    document.querySelector("#resume-button").disabled = false;
    document.querySelector("#home-button").disabled = false;
    startRestartCountdown();
  }

  function formatScorerSummary() {
    const homePlayer = matchHomeTeam.player || `${matchHomeTeam.name} · N°10`;
    const awayPlayer = matchAwayTeam.player || `${matchAwayTeam.name} · N°9`;
    return `BUTEURS · ${homePlayer} (${goalScorers.home}) · ${awayPlayer} (${goalScorers.away})`;
  }

  function beginHalftime() {
    half = 2;
    remaining = matchLength / 2;
    switchSides();
    ui.clock.textContent = formatClock(remaining);
    ui.halftimeHome.textContent = matchHomeTeam.name;
    ui.halftimeAway.textContent = matchAwayTeam.name;
    ui.halftimeResult.textContent = `${homeGoals} — ${awayGoals}`;
    ui.halftimeCountdown.textContent = "LA REPRISE ATTEND VOTRE SIGNAL";
    ui.halftimeScorers.textContent = formatScorerSummary();
    for (const element of [ui.halftimeScore, ui.halftimeScorers, ui.halftimeSides, ui.halftimeActions]) element.classList.remove("is-revealed");
    document.querySelector("#resume-button").disabled = true;
    document.querySelector("#home-button").disabled = true;
    document.querySelector("#restart-button").disabled = true;
    halftimeRevealElapsed = 0;
    setScreen("halftime");
  }

  function updateHalftimeSequence(delta) {
    halftimeRevealElapsed += delta;
    if (halftimeRevealElapsed >= 0.35) ui.halftimeScore.classList.add("is-revealed");
    if (halftimeRevealElapsed >= 0.7) ui.halftimeScorers.classList.add("is-revealed");
    if (halftimeRevealElapsed >= 1.05) ui.halftimeSides.classList.add("is-revealed");
    if (halftimeRevealElapsed >= 1.8) ui.halftimeActions.classList.add("is-revealed");
    if (halftimeRevealElapsed >= 2.35) {
      document.querySelector("#resume-button").disabled = false;
      document.querySelector("#home-button").disabled = false;
      document.querySelector("#restart-button").disabled = false;
    }
  }

  function beginCoolingBreak() {
    eventRemaining = 4;
    ui.coolingCountdown.innerHTML = "<strong>4</strong>s";
    setScreen("cooling");
  }

  function switchSides() {
    homeAttackDirection = -1;
    for (const body of [ball, human, rival]) {
      Body.setPosition(body, { x: worldWidth - body.position.x, y: body.position.y });
      Body.setVelocity(body, { x: -body.velocity.x, y: body.velocity.y });
    }
  }

  function updateCelebrationCrowd() {
    const scorer = celebrationSide === "home" ? human : rival;
    crowdFocusX = Math.max(field.left, Math.min(field.right, scorer.position.x));
    crowdFocusY = Math.max(field.top, Math.min(field.bottom, scorer.position.y));
    for (const fan of crowd) {
      if (fan.support !== celebrationSide) continue;
      fan.targetX = Math.max(field.left + 12, Math.min(field.right - 12, crowdFocusX + fan.gatherX));
      fan.targetY = Math.max(field.top + 12, Math.min(field.bottom - 12, crowdFocusY + fan.gatherY));
    }
  }

  function updateCelebrationMovement(delta) {
    keepPlayerInField(human);
    if (!trainingMode) keepPlayerInField(rival);
    const movement = readMovement();
    stamina = staminaPhysics.updateStamina(stamina, movement.moving, delta);
    const movementMultiplier = (isActionHeld("slow") ? 0.68 : 1) * staminaPhysics.getSpeedMultiplier(stamina);
    if (movement.moving) {
      Body.applyForce(human, human.position, { x: movement.x * 0.0025 * playerSpeed * movementMultiplier, y: movement.y * 0.0025 * playerSpeed * movementMultiplier });
      limitSpeed(human, 8.1 * playerSpeed * movementMultiplier);
    }
    if (localDuelMode) {
      const secondMovement = readMovementFor(secondKeyBindings);
      rivalStamina = staminaPhysics.updateStamina(rivalStamina, secondMovement.moving, delta);
      const secondMultiplier = (keys.has(secondKeyBindings.slow) ? 0.68 : 1) * staminaPhysics.getSpeedMultiplier(rivalStamina);
      if (secondMovement.moving) {
        Body.applyForce(rival, rival.position, { x: secondMovement.x * 0.0025 * playerSpeed * secondMultiplier, y: secondMovement.y * 0.0025 * playerSpeed * secondMultiplier });
        limitSpeed(rival, 8.1 * playerSpeed * secondMultiplier);
      }
    } else {
      rivalStamina = staminaPhysics.updateStamina(rivalStamina, Math.hypot(rival.velocity.x, rival.velocity.y) > 0.6, delta);
    }
    if (!trainingMode && !onlineMatch && celebrationElapsed >= 2 && !goalRepositionStarted) startGoalKickoff();
    if (goalRepositionStarted) movePlayersToKickoff(delta);
    updateCelebrationCrowd();
    if (goalBallLocked) lockGoalBallAtCenter();
  }

  function getGoalKickoffPositions() {
    const attackDirection = goalKickoffOwner === "human" ? homeAttackDirection : -homeAttackDirection;
    const kickoffX = 600 - attackDirection * 30;
    const otherX = 600 + attackDirection * 145;
    return goalKickoffOwner === "human"
      ? { human: { x: kickoffX, y: 360 }, rival: { x: otherX, y: 360 } }
      : { rival: { x: kickoffX, y: 360 }, human: { x: otherX, y: 360 } };
  }

  function startGoalKickoff(snapPlayers = false) {
    if (!goalKickoffOwner || goalRepositionStarted) return;
    goalRepositionStarted = true;
    goalBallLocked = false;
    const positions = getGoalKickoffPositions();
    if (snapPlayers) {
      Body.setPosition(human, positions.human);
      Body.setPosition(rival, positions.rival);
      Body.setVelocity(human, { x: 0, y: 0 });
      Body.setVelocity(rival, { x: 0, y: 0 });
    }
    const carrier = goalKickoffOwner === "human" ? human : rival;
    carrier.lastMoveX = goalKickoffOwner === "human" ? homeAttackDirection : -homeAttackDirection;
    carrier.lastMoveY = 0;
    setBallOwner(goalKickoffOwner);
  }

  function movePlayersToKickoff(delta) {
    const positions = getGoalKickoffPositions();
    for (const [body, target] of [[human, positions.human], [rival, positions.rival]]) {
      const dx = target.x - body.position.x;
      const dy = target.y - body.position.y;
      const distance = Math.hypot(dx, dy);
      const step = 210 * delta;
      if (distance <= step) {
        Body.setPosition(body, target);
        Body.setVelocity(body, { x: 0, y: 0 });
      } else {
        Body.setVelocity(body, { x: dx / distance * step, y: dy / distance * step });
      }
    }
  }

  function advanceTrainingCrowdCelebration(delta) {
    if (crowdPhase === "match") return;
    updateCelebrationCrowd();
    crowdElapsed += delta;
    celebrationElapsed += delta;
    if (crowdPhase === "rushingIn" && crowdElapsed >= 2.2) {
      crowdPhase = "onPitch";
      crowdElapsed = 0;
    } else if (crowdPhase === "onPitch" && celebrationElapsed >= 5.2) {
      crowdPhase = "retreating";
      crowdElapsed = 0;
    } else if (crowdPhase === "retreating" && crowdElapsed >= 1.7) {
      crowdPhase = "match";
      goalBallLocked = false;
      for (const fan of crowd) {
        delete fan.targetX;
        delete fan.targetY;
      }
    }
  }

  function announceGoal(forHome) {
    const scorer = forHome ? human : rival;
    celebrationSide = forHome ? "home" : "away";
    stamina = 100;
    rivalStamina = 100;
    botResting = false;
    botRestElapsed = 0;
    runTrailPoints = [];
    rivalRunTrailPoints = [];
    lastRunTrailRecordAt = -Infinity;
    lastRivalRunTrailRecordAt = -Infinity;
    goalBallLocked = trainingMode ? trainingGoalResetEnabled : !onlineMatch;
    if (forHome) {
      homeGoals += 1;
      goalScorers.home += 1;
      matchStatsApi.recordGoal(currentMatchStats, "home");
      ui.homeScore.textContent = String(homeGoals);
    } else {
      awayGoals += 1;
      goalScorers.away += 1;
      matchStatsApi.recordGoal(currentMatchStats, "away");
      ui.awayScore.textContent = String(awayGoals);
    }
    freeKickPending = false;
    foulOffenderSide = null;
    freeKickVictimSide = null;
    freeKickBallPlayed = false;
    shirtPullAttempt = null;
    setBallOwner(null);
    if (trainingMode) {
      trainingGoalLatched = !trainingGoalResetEnabled;
      crowdPhase = "rushingIn";
      crowdElapsed = 0;
      celebrationElapsed = 0;
      updateCelebrationCrowd();
      if (trainingGoalResetEnabled) {
        lockGoalBallAtCenter();
      }
      return;
    }
    goalKickoffOwner = forHome ? "rival" : "human";
    goalRepositionStarted = false;
    lockGoalBallAtCenter();
    ui.goalTitle.textContent = "BUUUT !";
    const scoringTeam = forHome ? matchHomeTeam : matchAwayTeam;
    ui.goalTeam.textContent = scoringTeam.name;
    renderCompactTeamMark(ui.goalTeamMark, scoringTeam);
    ui.goalScore.textContent = `${homeGoals} — ${awayGoals}`;
    ui.goalCountdown.innerHTML = 'REPRISE DU MATCH DANS <strong>3</strong>s';
    if (onlineMatch) {
      setScreen("playing");
      return;
    }
    crowdPhase = "rushingIn";
    crowdElapsed = 0;
    updateCelebrationCrowd();
    celebrationElapsed = 0;
    confetti = Array.from({ length: 110 }, () => ({
      x: 430 + Math.random() * 340,
      y: 170 + Math.random() * 210,
      vx: (Math.random() - 0.5) * 210,
      vy: -80 - Math.random() * 210,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 9,
      color: [matchHomeTeam.color, matchAwayTeam.color, "#ffe27a", "#f4f0dc"][Math.floor(Math.random() * 4)],
      size: 3 + Math.random() * 5,
    }));
    eventRemaining = 2.2;
    setScreen("crowdCheer");
  }

  function skipGoalCelebration() {
    if (!ui.goal || screen !== "goal") return;
    crowdPhase = "match";
    crowdElapsed = 0;
    startGoalKickoff(true);
    for (const fan of crowd) {
      delete fan.targetX;
      delete fan.targetY;
    }
    startRestartCountdown();
  }

  function callShirtPullFoul(offenderSide = "home", automatic = false) {
    if (screen !== "playing" || trainingMode || onlineMatch || freeKickPending || shirtPullAttempt) return false;
    const offender = offenderSide === "home" ? human : rival;
    const victim = offenderSide === "home" ? rival : human;
    const contact = Math.hypot(offender.position.x - victim.position.x, offender.position.y - victim.position.y);
    const ballContact = Math.hypot(ball.position.x - victim.position.x, ball.position.y - victim.position.y);
    if (contact > 62 || ballContact > 80) return false;
    shirtPullAttempt = { offenderSide, automatic, elapsed: 0, duration: randomBetween(1, 5) };
    return true;
  }

  function isShirtPullHeld(offenderSide) {
    return offenderSide === "home"
      ? keys.has(keyBindings.slow) || mobileKeys.has(keyBindings.slow)
      : keys.has(secondKeyBindings.slow) || mobileKeys.has(secondKeyBindings.slow);
  }

  function updateShirtPullAttempt(delta) {
    if (!shirtPullAttempt) return;
    if (!shirtPullAttempt.automatic && !isShirtPullHeld(shirtPullAttempt.offenderSide)) {
      shirtPullAttempt = null;
      return;
    }
    shirtPullAttempt.elapsed += delta;
    if (shirtPullAttempt.elapsed < shirtPullAttempt.duration) return;
    const offenderSide = shirtPullAttempt.offenderSide;
    shirtPullAttempt = null;
    whistleShirtPullFoul(offenderSide);
  }

  function whistleShirtPullFoul(offenderSide) {
    if (screen !== "playing" || trainingMode || onlineMatch || freeKickPending) return false;
    const offender = offenderSide === "home" ? human : rival;
    const victim = offenderSide === "home" ? rival : human;
    const awardedTeam = offenderSide === "home" ? matchAwayTeam : matchHomeTeam;
    const foulContact = Math.hypot(ball.position.x - (offenderSide === "home" ? rival : human).position.x, ball.position.y - (offenderSide === "home" ? rival : human).position.y);
    if (foulContact > 140) return false;
    foulSpot = { x: Math.max(field.left + 40, Math.min(field.right - 40, ball.position.x)), y: Math.max(field.top + 35, Math.min(field.bottom - 35, ball.position.y)) };
    freeKickOrigin = { ...foulSpot };
    freeKickPending = true;
    matchStatsApi.recordFoul(currentMatchStats, offenderSide);
    foulOffenderSide = offenderSide;
    freeKickVictimSide = offenderSide === "home" ? "away" : "home";
    freeKickBallPlayed = false;
    if (ballOwner) releaseBall(ballOwner, 0.25);
    else ball.collisionFilter.group = 0;
    const looseBall = Math.random() < 0.3;
    Body.setPosition(ball, looseBall ? { x: foulSpot.x + homeAttackDirection * 22, y: foulSpot.y + (Math.random() - 0.5) * 12 } : foulSpot);
    Body.setVelocity(ball, looseBall ? { x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 4 } : { x: 0, y: 0 });
    Body.setAngularVelocity(ball, 0);
    ballTrail = [];
    const awardedDirection = offenderSide === "home" ? -homeAttackDirection : homeAttackDirection;
    Body.setPosition(victim, { x: foulSpot.x - awardedDirection * 34, y: foulSpot.y });
    Body.setVelocity(victim, { x: 0, y: 0 });
    const offenderGoalX = offenderSide === "home" ? (homeAttackDirection > 0 ? field.left + 28 : field.right - 28) : (homeAttackDirection > 0 ? field.right - 28 : field.left + 28);
    Body.setPosition(offender, { x: offenderGoalX, y: 360 });
    Body.setVelocity(offender, { x: 0, y: 0 });
    ui.foulTeamMark.src = offender.flag || offender.crest || "";
    ui.foulTeamMark.alt = offender.name;
    ui.foulDetail.textContent = `FAUTE DE ${offender.name} · COUP FRANC POUR ${awardedTeam.name}`;
    eventRemaining = 1.35;
    setScreen("foul");
    return true;
  }

  function drawCrowd() {
    for (const fan of crowd) {
      const followsX = fan.zone === "top" || fan.zone === "bottom";
      const trackedX = Math.max(7, Math.min(1193, fan.x + Math.max(-92, Math.min(92, (crowdFocusX - fan.x) * 0.48))));
      const trackedY = Math.max(80, Math.min(640, fan.y + Math.max(-76, Math.min(76, (crowdFocusY - fan.y) * 0.46))));
      const rushProgress = crowdPhase === "rushingIn" ? Math.max(0, Math.min(1, (crowdElapsed - 0.6) / 0.45)) : 1;
      const standX = followsX ? fan.x + (trackedX - fan.x) * rushProgress : fan.x;
      const standY = followsX ? fan.y : fan.y + (trackedY - fan.y) * rushProgress;
      let blend = 0;
      const cheeringSide = fan.support === celebrationSide;
      if (crowdPhase === "rushingIn") blend = cheeringSide ? Math.max(0, Math.min(1, (crowdElapsed - 0.6 - fan.rushDelay) * fan.rallySpeed / 1.1)) : 0.06;
      else if (crowdPhase === "onPitch") blend = cheeringSide ? 1 : 0.06;
      else if (crowdPhase === "retreating") blend = cheeringSide ? 1 - Math.min(1, crowdElapsed * fan.rallySpeed / 1.45) : 0.06;
      blend = blend * blend * (3 - 2 * blend);
      const x = fan.targetX === undefined ? standX : standX + (fan.targetX - standX) * blend;
      const y = fan.targetY === undefined ? standY : standY + (fan.targetY - standY) * blend;
      const viewX = followsX ? standX : fan.zone === "left" ? field.left : field.right;
      const viewY = followsX ? fan.zone === "top" ? field.top : field.bottom : standY;
      const proximity = Math.max(0, 1 - Math.hypot(crowdFocusX - viewX, crowdFocusY - viewY) / 390);
      const ballSpeed = Math.hypot(ball.velocity.x, ball.velocity.y);
      const excitement = Math.max(proximity, Math.min(0.55, ballSpeed / 24));
      const cheering = cheeringSide && (crowdPhase === "rushingIn" || crowdPhase === "onPitch" || crowdPhase === "retreating");
      const energy = Math.max(excitement, cheering ? 1 : 0);
      const supportTeam = fan.support === "home" ? matchHomeTeam : matchAwayTeam;
      const shirtColor = supportTeam.color || fan.color;
      const shirtAccent = supportTeam.accent || fan.color;
      const animating = energy > 0.24;
      const bob = animating ? Math.sin(crowdAnimationTime * (3.2 + energy * 3.5) + fan.phase) * (0.45 + energy * 1.4) : 0;
      const headY = y + bob;
      const armLift = 1 + energy * 4 + Math.max(0, Math.sin(crowdAnimationTime * 5 + fan.phase)) * energy * 2.4;
      const armSwing = Math.sin(crowdAnimationTime * 3.6 + fan.phase) * energy * 1.7;

      const standClip = crowdPhase === "match" || crowdPhase === "stands";
      context.save();
      if (standClip) {
        context.beginPath();
        if (fan.zone === "top") context.rect(0, 0, worldWidth, 59);
        else if (fan.zone === "bottom") context.rect(0, 661, worldWidth, 59);
        else if (fan.zone === "left") context.rect(0, 76, 59, 568);
        else context.rect(1141, 76, 59, 568);
        context.clip();
      }

      context.strokeStyle = shirtColor;
      context.lineWidth = Math.max(1, fan.size * 0.45);
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(x - fan.size * 0.48, headY + fan.size * 2.2);
      context.lineTo(x - fan.size * (1.1 + armSwing), headY + fan.size * (1.8 - armLift));
      context.moveTo(x + fan.size * 0.48, headY + fan.size * 2.2);
      context.lineTo(x + fan.size * (1.1 - armSwing), headY + fan.size * (1.8 - armLift));
      context.moveTo(x - fan.size * 0.28, headY + fan.size * 4.1);
      context.lineTo(x - fan.size * 0.5, headY + fan.size * 5.2);
      context.moveTo(x + fan.size * 0.28, headY + fan.size * 4.1);
      context.lineTo(x + fan.size * 0.5, headY + fan.size * 5.2);
      context.stroke();
      context.fillStyle = shirtColor;
      context.globalAlpha = 0.72 + energy * 0.28;
      context.fillRect(x - fan.size * 0.58, headY + fan.size * 1.8, fan.size * 1.16, fan.size * 2.3);
      context.fillStyle = shirtAccent;
      context.fillRect(x - fan.size * 0.18, headY + fan.size * 1.9, fan.size * 0.36, fan.size * 2.1);
      context.fillStyle = fan.skin;
      context.beginPath();
      context.arc(x, headY + fan.size * 0.9, fan.size * 0.72, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }
    context.globalAlpha = 1;
  }

  function drawConfetti() {
    if (crowdPhase !== "rushingIn" && crowdPhase !== "onPitch" && crowdPhase !== "retreating") return;
    context.save();
    for (const piece of confetti) {
      const time = celebrationElapsed;
      const x = piece.x + piece.vx * time;
      const y = piece.y + piece.vy * time + 55 * time * time;
      if (y < field.top || y > field.bottom || x < field.left || x > field.right) continue;
      context.save();
      context.translate(x, y);
      context.rotate(piece.rotation + piece.spin * time);
      context.fillStyle = piece.color;
      context.globalAlpha = Math.max(0, 1 - time / 6);
      context.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * 1.7);
      context.restore();
    }
    context.restore();
  }

  function moveToward(body, target, strength, maxSpeed) {
    const dx = target.x - body.position.x;
    const dy = target.y - body.position.y;
    const distance = Math.hypot(dx, dy) || 1;
    Body.applyForce(body, body.position, { x: (dx / distance) * strength, y: (dy / distance) * strength });
    limitSpeed(body, maxSpeed);
  }

  function limitSpeed(body, maxSpeed) {
    const speed = Math.hypot(body.velocity.x, body.velocity.y);
    if (speed > maxSpeed) Body.setVelocity(body, { x: body.velocity.x * maxSpeed / speed, y: body.velocity.y * maxSpeed / speed });
  }

  function readMovement() {
    return readMovementFor(keyBindings, true);
  }

  function readOnlineInput() {
    const movement = readMovement();
    return {
      x: movement.moving ? movement.x : 0,
      y: movement.moving ? movement.y : 0,
      slow: isActionHeld("slow"),
      shoot: touchShoot || keys.has(keyBindings.shoot),
      feint: keys.has(keyBindings.feint),
    };
  }

  function applyOnlineState(state) {
    const applyBodyState = (body, value) => {
      Body.setPosition(body, { x: value.x, y: value.y });
      Body.setVelocity(body, { x: value.vx, y: value.vy });
    };
    applyBodyState(ball, state.ball);
    applyBodyState(human, state.home);
    applyBodyState(rival, state.away);
    homeGoals = state.homeGoals;
    awayGoals = state.awayGoals;
    stamina = onlineSide === "away" ? state.awayStamina : state.homeStamina;
    rivalStamina = onlineSide === "away" ? state.homeStamina : state.awayStamina;
    remaining = state.remaining;
    ui.homeScore.textContent = String(homeGoals);
    ui.awayScore.textContent = String(awayGoals);
    ui.clock.textContent = formatClock(remaining);
  }

  function showMatchResult() {
    document.querySelector("#result-title").textContent = homeGoals === awayGoals ? "Match nul." : homeGoals > awayGoals ? "Victoire !" : "À la prochaine.";
    document.querySelector("#result-score").textContent = `${homeGoals} — ${awayGoals}`;
    renderIntroTeam(ui.resultHomeTeam, matchHomeTeam);
    renderIntroTeam(ui.resultAwayTeam, matchAwayTeam);
    renderMatchStats();
    setScreen("result");
  }

  function recordShot(side, directionX, directionY) {
    const attackDirection = side === "home" ? homeAttackDirection : -homeAttackDirection;
    const goalLineX = attackDirection > 0 ? 1128 : 72;
    const distanceToGoal = goalLineX - ball.position.x;
    const projectedY = Math.abs(directionX) > 0.001 ? ball.position.y + directionY / directionX * distanceToGoal : Infinity;
    const onTarget = directionX * attackDirection > 0 && projectedY > goal.top && projectedY < goal.bottom;
    matchStatsApi.recordShot(currentMatchStats, side, onTarget);
  }

  function formatStatTime(seconds) {
    return formatClock(seconds);
  }

  function renderMatchStats() {
    const table = document.querySelector("#match-stats");
    const onlineNote = document.querySelector("#online-match-stats-note");
    table.hidden = Boolean(onlineMatch);
    onlineNote.hidden = !onlineMatch;
    if (onlineMatch) return;

    const summary = matchStatsApi.summarizeMatchStats(currentMatchStats);
    for (const [side, team] of [["home", matchHomeTeam], ["away", matchAwayTeam]]) {
      const heading = document.querySelector(`#stats-${side}-name`);
      const crest = team.crest || team.flag;
      heading.textContent = team.name;
      heading.style.setProperty("--team-color", team.color || "#c4f277");
      heading.style.setProperty("--team-crest", crest ? `url("${crest}")` : "none");
    }
    for (const [side, values] of Object.entries(summary)) {
      const set = (key, value) => { document.querySelector(`#stats-${side}-${key}`).textContent = value; };
      set("goals", String(values.goals));
      set("touches", String(values.touches));
      set("recoveries", String(values.recoveries));
      set("dribbles", String(values.dribbles));
      set("fouls", String(values.fouls));
      set("possession", `${Math.round(values.possessionPercent * 100)} %`);
      set("time", formatStatTime(values.possessionSeconds));
      set("average", formatStatTime(values.averagePossessionSeconds));
      set("shots", `${values.shots} / ${values.shotsOnTarget}`);
      set("accuracy", `${Math.round(values.shotAccuracy * 100)} %`);
      set("efficiency", `${Math.round(values.efficiency * 100)} %`);
    }
  }

  function readMovementFor(bindings, includeMobile = false) {
    const horizontal = Number(keys.has(bindings.right) || includeMobile && mobileKeys.has("right")) - Number(keys.has(bindings.left) || includeMobile && mobileKeys.has("left"));
    const vertical = Number(keys.has(bindings.down) || includeMobile && mobileKeys.has("down")) - Number(keys.has(bindings.up) || includeMobile && mobileKeys.has("up"));
    const magnitude = Math.hypot(horizontal, vertical) || 1;
    return { x: horizontal / magnitude, y: vertical / magnitude, moving: horizontal !== 0 || vertical !== 0 };
  }

  function isActionHeld(action) {
    return keys.has(keyBindings[action]);
  }
  function formatBinding(key) {
    return ({ " ": "ESPACE", enter: "↵", shift: "MAJ", arrowup: "↑", arrowdown: "↓", arrowleft: "←", arrowright: "→" })[key] || key.toUpperCase();
  }

  function renderKeyBindings() {
    document.querySelectorAll("[data-bind-action]").forEach((button) => {
      const action = button.dataset.bindAction;
      const player = Number(button.dataset.bindPlayer || 1);
      const bindings = player === 2 ? secondKeyBindings : keyBindings;
      button.textContent = bindingAction === action && bindingPlayer === player ? "…" : formatBinding(bindings[action]);
      button.classList.toggle("is-listening", bindingAction === action && bindingPlayer === player);
    });
    document.querySelectorAll("[data-key-label]").forEach((label) => {
      label.textContent = formatBinding(keyBindings[label.dataset.keyLabel]);
    });
  }

  function startKick() {
    if (onlineMatch && onlineSide !== "home") return;
    if ((screen === "playing" || screen === "freekick") && !(freeKickPending && foulOffenderSide === "home") && kickStarted === null) kickStarted = performance.now();
  }

  function triggerShotEffect(body, power, profile) {
    shotEffect = {
      x: ball.position.x,
      y: ball.position.y,
      angle: Math.atan2(ball.velocity.y, ball.velocity.x),
      startedAt: elapsed,
      strength: Math.min(1, power / 15),
      color: body === human ? matchHomeTeam.color || "#c4f277" : matchAwayTeam.color || "#ff796c",
    };
    activeShot = { ...profile, age: 0, initialSpeed: Math.hypot(ball.velocity.x, ball.velocity.y) };
    floatEffect = { startedAt: elapsed, strength: Math.min(1, power / 15) };
  }

  function releaseKick() {
    if (onlineMatch && onlineSide !== "home") return;
    if (kickStarted === null) return;
    const heldFor = performance.now() - kickStarted;
    kickStarted = null;
    if (heldFor < 140) {
      performFeint();
      return;
    }
    const charge = staminaPhysics.limitShotCharge(stamina, Math.min(1, heldFor / 1200));
    const now = performance.now();
    if (now - lastKickAt < 280) {
      performFeint();
      return;
    }
    const dx = ball.position.x - human.position.x;
    const dy = ball.position.y - human.position.y;
    const distance = Math.hypot(dx, dy);
    if (distance > 69) return;

    const movement = readMovement();
    const targetX = movement.moving ? movement.x * 0.65 + homeAttackDirection * 1.4 : homeAttackDirection;
    const targetY = movement.moving ? movement.y : (360 - ball.position.y) * 0.0014;
    const aimLength = Math.hypot(targetX, targetY) || 1;
    const power = 5 + charge * 10;
    const profile = shotPhysics.createShotProfile(charge, ball.position.y);
    Body.setVelocity(ball, { x: targetX / aimLength * power, y: targetY / aimLength * power });
    releaseBall("human", 0.3);
    matchStatsApi.recordTouch(currentMatchStats, "home");
    recordShot("home", targetX, targetY);
    Body.setAngularVelocity(ball, profile.spin);
    if (screen === "freekick" && freeKickVictimSide === "home") freeKickBallPlayed = true;
    shotFlash = { body: human, until: elapsed + 0.42 };
    triggerShotEffect(human, power, profile);
    lastKickAt = now;
  }

  function performFeint() {
    if (onlineMatch && onlineSide !== "home") return;
    if (feintCooldownRemaining > 0 || (screen !== "playing" && screen !== "freekick")) return;
    const movement = readMovement();
    if (movement.moving) feintDirection = { x: movement.x, y: movement.y };
    else {
      const dx = ball.position.x - human.position.x;
      const dy = ball.position.y - human.position.y;
      const length = Math.hypot(dx, dy) || 1;
      feintDirection = { x: -dy / length, y: dx / length };
    }
    Body.setVelocity(human, {
      x: human.velocity.x + feintDirection.x * 3.4,
      y: human.velocity.y + feintDirection.y * 3.4,
    });
    feintUntil = elapsed + 0.34;
    feintCooldownRemaining = 6;
    const ballDistance = Math.hypot(ball.position.x - human.position.x, ball.position.y - human.position.y);
    const rivalDistance = trainingMode ? Infinity : Math.hypot(ball.position.x - rival.position.x, ball.position.y - rival.position.y);
    if (ballDistance < 58 && human.position.x !== rival.position.x && ballDistance < rivalDistance) {
      matchStatsApi.recordTouch(currentMatchStats, "home");
      matchStatsApi.recordDribble(currentMatchStats, "home");
      Body.setVelocity(ball, {
        x: ball.velocity.x * 0.55 + feintDirection.x * 3.2,
        y: ball.velocity.y * 0.55 + feintDirection.y * 3.2,
      });
    }
  }

  function startSecondPlayerKick() {
    if (localDuelMode && screen === "playing" && player2KickStarted === null) player2KickStarted = performance.now();
  }

  function releaseSecondPlayerKick() {
    if (player2KickStarted === null) return;
    const charge = staminaPhysics.limitShotCharge(rivalStamina, Math.min(1, (performance.now() - player2KickStarted) / 1200));
    player2KickStarted = null;
    const distance = Math.hypot(ball.position.x - rival.position.x, ball.position.y - rival.position.y);
    if (ballOwner !== "rival" || distance > 69 || performance.now() - player2LastKickAt < 280) return;
    const movement = onlineMatch ? readRemoteMovement() : readMovementFor(secondKeyBindings);
    const targetX = movement.moving ? movement.x * 0.65 - homeAttackDirection * 1.4 : -homeAttackDirection;
    const targetY = movement.moving ? movement.y : (360 - ball.position.y) * 0.0014;
    const aimLength = Math.hypot(targetX, targetY) || 1;
    const power = 5 + charge * 10;
    const profile = shotPhysics.createShotProfile(charge, ball.position.y);
    Body.setVelocity(ball, { x: targetX / aimLength * power, y: targetY / aimLength * power });
    matchStatsApi.recordTouch(currentMatchStats, "away");
    recordShot("away", targetX, targetY);
    Body.setAngularVelocity(ball, profile.spin);
    if (screen === "freekick" && freeKickVictimSide === "away") freeKickBallPlayed = true;
    releaseBall("rival", 0.3);
    shotFlash = { body: rival, until: elapsed + 0.42 };
    triggerShotEffect(rival, power, profile);
    player2LastKickAt = performance.now();
  }

  function performSecondPlayerFeint() {
    if (!localDuelMode || screen !== "playing" || player2FeintCooldownRemaining > 0) return;
    const movement = onlineMatch ? readRemoteMovement() : readMovementFor(secondKeyBindings);
    if (movement.moving) player2FeintDirection = { x: movement.x, y: movement.y };
    else {
      const dx = ball.position.x - rival.position.x;
      const dy = ball.position.y - rival.position.y;
      const length = Math.hypot(dx, dy) || 1;
      player2FeintDirection = { x: -dy / length, y: dx / length };
    }
    Body.setVelocity(rival, {
      x: rival.velocity.x + player2FeintDirection.x * 3.4,
      y: rival.velocity.y + player2FeintDirection.y * 3.4,
    });
    player2FeintUntil = elapsed + 0.34;
    player2FeintCooldownRemaining = 6;
    player2ShirtPullFlashUntil = elapsed + 0.8;
  }

  function applyBallCurve() {
    const speed = Math.hypot(ball.velocity.x, ball.velocity.y);
    if (speed < 0.15 || Math.abs(ball.angularVelocity) < 0.01) return;
    const magnus = ball.angularVelocity * 0.00007;
    Body.applyForce(ball, ball.position, {
      x: -ball.velocity.y * magnus,
      y: ball.velocity.x * magnus,
    });
    Body.setAngularVelocity(ball, ball.angularVelocity * 0.995);
  }

  function applyShotMotion(delta) {
    if (!activeShot) return;
    const motion = shotPhysics.advanceShotMotion(activeShot, ball.velocity, delta);
    if (!motion) {
      activeShot = null;
      return;
    }
    Body.setVelocity(ball, { x: ball.velocity.x * motion.velocityScale, y: ball.velocity.y * motion.velocityScale });
    if (motion.forceX || motion.forceY) Body.applyForce(ball, ball.position, { x: motion.forceX, y: motion.forceY });
  }

  function recordBallTrail() {
    if (Math.abs(ball.angularVelocity) < 0.035) {
      ballTrail = [];
      return;
    }
    ballTrail.push({ x: ball.position.x, y: ball.position.y });
    if (ballTrail.length > 24) ballTrail.shift();
  }

  function keepPlayerInField(player) {
    const minX = field.left + player.circleRadius;
    const maxX = field.right - player.circleRadius;
    const minY = field.top + player.circleRadius;
    const maxY = field.bottom - player.circleRadius;
    const oldX = player.position.x;
    const oldY = player.position.y;
    const x = Math.max(minX, Math.min(maxX, oldX));
    const y = Math.max(minY, Math.min(maxY, oldY));
    if (x !== oldX || y !== oldY) Body.setPosition(player, { x, y });
    const velocityX = (oldX <= minX && player.velocity.x < 0) || (oldX >= maxX && player.velocity.x > 0) ? 0 : player.velocity.x;
    const velocityY = (oldY <= minY && player.velocity.y < 0) || (oldY >= maxY && player.velocity.y > 0) ? 0 : player.velocity.y;
    if (velocityX !== player.velocity.x || velocityY !== player.velocity.y) Body.setVelocity(player, { x: velocityX, y: velocityY });
  }

  function lockGoalBallAtCenter() {
    Body.setPosition(ball, { x: 600, y: 360 });
    Body.setVelocity(ball, { x: 0, y: 0 });
    Body.setAngularVelocity(ball, 0);
    ballTrail = [];
    activeShot = null;
    shotEffect = null;
    touchEffect = null;
    floatEffect = null;
  }

  function updatePlayers(delta) {
    keepPlayerInField(human);
    if (!trainingMode) keepPlayerInField(rival);
    const bumpSpeedMultiplier = bumpBoostTime > 0 ? 1.5 : 1;
    bumpBoostTime = Math.max(0, bumpBoostTime - delta);
    const movement = readMovement();
    const secondMovement = localDuelMode ? readMovementFor(secondKeyBindings) : null;
    const slowed = isActionHeld("slow");
    const humanCanMove = movement.moving && !(freeKickPending && foulOffenderSide === "home");
    stamina = staminaPhysics.updateStamina(stamina, humanCanMove, delta);
    const botControlsRival = !trainingMode && !localDuelMode && !onlineMatch;
    if (botControlsRival && rivalStamina <= 0) botResting = true;
    const rivalMoving = secondMovement ? secondMovement.moving : !botResting && Math.hypot(rival.velocity.x, rival.velocity.y) > 0.6;
    rivalStamina = staminaPhysics.updateStamina(rivalStamina, rivalMoving, delta);
    if (botControlsRival && rivalStamina <= 0) botResting = true;
    if (botControlsRival && botResting) {
      Body.setVelocity(rival, { x: 0, y: 0 });
      botRestElapsed += delta;
      if (rivalStamina >= 50 && botRestElapsed >= 0.5) {
        botResting = false;
        botRestElapsed = 0;
      }
    }
    const humanPulling = shirtPullAttempt?.offenderSide === "home";
    const movementMultiplier = (humanPulling ? 0.24 : slowed ? 0.68 : 1) * staminaPhysics.getSpeedMultiplier(stamina);
    if (movement.moving && !(freeKickPending && foulOffenderSide === "home")) {
      Body.applyForce(human, human.position, { x: movement.x * 0.0025 * playerSpeed * movementMultiplier, y: movement.y * 0.0025 * playerSpeed * movementMultiplier });
      limitSpeed(human, 8.1 * playerSpeed * movementMultiplier * bumpSpeedMultiplier);
    }
    if (secondMovement?.moving && !(freeKickPending && foulOffenderSide === "away")) {
      const secondSlowed = keys.has(secondKeyBindings.slow);
      const rivalPulling = shirtPullAttempt?.offenderSide === "away";
      const secondMultiplier = (rivalPulling ? 0.24 : secondSlowed ? 0.68 : 1) * staminaPhysics.getSpeedMultiplier(rivalStamina);
      Body.applyForce(rival, rival.position, { x: secondMovement.x * 0.0025 * playerSpeed * secondMultiplier, y: secondMovement.y * 0.0025 * playerSpeed * secondMultiplier });
      limitSpeed(rival, 8.1 * playerSpeed * secondMultiplier * bumpSpeedMultiplier);
    }
    if (goalBallLocked) lockGoalBallAtCenter();
    else updateBallPossession(movement);
    matchStatsApi.updateMatchStats(currentMatchStats, delta);
    if (freeKickPending && screen === "freekick" && ballOwner === (freeKickVictimSide === "home" ? "human" : "rival")) freeKickBallPlayed = true;
    const botCanPlayFreeKick = freeKickPending && screen === "freekick" && freeKickVictimSide === "away";
    if (!trainingMode && !localDuelMode && !onlineMatch && (!freeKickPending || botCanPlayFreeKick)) {
      const botLevel = botLevels[selectedBotLevel];
      const botPulling = shirtPullAttempt?.offenderSide === "away";
      const playerSpeedMultiplier = (slowed ? 0.68 : 1) * staminaPhysics.getSpeedMultiplier(stamina);
      const botSpeed = 8.1 * playerSpeed * playerSpeedMultiplier * bumpSpeedMultiplier * (botPulling ? 0.24 : 1);
      if (!botResting || botCanPlayFreeKick) controlBot(rival, -homeAttackDirection, { ...botLevel, speed: botSpeed }, elapsed, rivalStamina);
    }

    if (wallImpactPending) {
      Body.setVelocity(ball, shotPhysics.reduceVelocityAfterWall(ball.velocity));
      wallImpactPending = false;
    }
    updateBallJostle(delta);
    applyBallCurve();
    applyShotMotion(delta);
    recordBallTrail();
    const ownerSpeed = ballOwner === "human" ? Math.hypot(human.velocity.x, human.velocity.y) : ballOwner === "rival" ? Math.hypot(rival.velocity.x, rival.velocity.y) : 0;
    limitSpeed(ball, Math.max(17, ownerSpeed + 4));
    if (!ballOwner && Math.hypot(ball.velocity.x, ball.velocity.y) < 0.18) {
      Body.setVelocity(ball, { x: 0, y: 0 });
      Body.setAngularVelocity(ball, 0);
    }
    if (trainingMode) {
      const inGoalMouth = ball.position.y > goal.top && ball.position.y < goal.bottom;
      const homeGoalLine = homeAttackDirection > 0 ? ball.position.x > 1128 : ball.position.x < 72;
      const awayGoalLine = homeAttackDirection > 0 ? ball.position.x < 72 : ball.position.x > 1128;
      const returnedToField = homeAttackDirection > 0 ? ball.position.x < 1128 : ball.position.x > 72;
      if (trainingGoalLatched && returnedToField) trainingGoalLatched = false;
      else if (!trainingGoalLatched && inGoalMouth) {
        if (homeGoalLine) announceGoal(true);
        else if (awayGoalLine) announceGoal(false);
      }
      return;
    }
    if (ball.position.y > goal.top && ball.position.y < goal.bottom) {
      if (homeAttackDirection > 0 && ball.position.x > 1128) announceGoal(true);
      else if (homeAttackDirection < 0 && ball.position.x < 72) announceGoal(true);
      else if (homeAttackDirection > 0 && ball.position.x < 72) announceGoal(false);
      else if (homeAttackDirection < 0 && ball.position.x > 1128) announceGoal(false);
    }
  }

  function updateBallJostle(delta) {
    if (trainingMode || (screen !== "playing" && screen !== "freekick")) {
      ballJostleTime = 0;
      return;
    }
    const humanDistance = Math.hypot(ball.position.x - human.position.x, ball.position.y - human.position.y);
    const rivalDistance = Math.hypot(ball.position.x - rival.position.x, ball.position.y - rival.position.y);
    const playersDistance = Math.hypot(human.position.x - rival.position.x, human.position.y - rival.position.y);
    const ballSpeed = Math.hypot(ball.velocity.x, ball.velocity.y);
    const stuck = humanDistance < 56 && rivalDistance < 56 && playersDistance < 76 && ballSpeed < 5.5;
    if (!stuck) {
      ballJostleTime = Math.max(0, ballJostleTime - delta * 2);
      return;
    }
    ballJostleTime += delta;
    if (ballJostleTime < 1.35 || elapsed - lastBallJostleAt < 2.8) return;

    ballJostleTime = 0;
    lastBallJostleAt = elapsed;
    bumpBoostTime = 0.42;
    const pushPlayer = (player, fallback) => {
      let x = player.position.x - ball.position.x;
      let y = player.position.y - ball.position.y;
      const distance = Math.hypot(x, y);
      if (distance < 1) { x = fallback; y = 0; }
      else { x /= distance; y /= distance; }
      Body.setVelocity(player, { x: player.velocity.x + x * 7.5, y: player.velocity.y + y * 7.5 });
    };
    pushPlayer(human, -homeAttackDirection);
    pushPlayer(rival, homeAttackDirection);
    const ballDirection = ballOwner === "rival" ? -homeAttackDirection : homeAttackDirection;
    const verticalBias = (human.position.y + rival.position.y) / 2 - ball.position.y;
    if (ballOwner) releaseBall(ballOwner, 0.45);
    Body.setVelocity(ball, { x: ballDirection * 13, y: Math.max(-4.2, Math.min(4.2, verticalBias * 0.18 + (Math.random() - 0.5) * 2)) });
    Body.setAngularVelocity(ball, (Math.random() - 0.5) * 0.7);
    matchStatsApi.recordTouch(currentMatchStats, "home");
    matchStatsApi.recordTouch(currentMatchStats, "away");
    touchEffect = { x: ball.position.x, y: ball.position.y, startedAt: elapsed };
    startScreenShake(0.8, 2.2);
  }

  function setBallOwner(owner) {
    if (ballOwner === owner) return;
    if (ballOwner) {
      const previousCarrier = ballOwner === "human" ? human : rival;
      previousCarrier.collisionFilter.group = 0;
      possessionLockedUntil[ballOwner] = elapsed + 2;
    }
    ballOwner = owner;
    if (owner) {
      activeShot = null;
      matchStatsApi.setPossession(currentMatchStats, owner === "human" ? "home" : "away");
      const carrier = owner === "human" ? human : rival;
      touchEffect = { x: ball.position.x, y: ball.position.y, startedAt: elapsed };
      floatEffect = { startedAt: elapsed, strength: 0.3 };
      const possessionGroup = -carrier.id;
      carrier.collisionFilter.group = possessionGroup;
      ball.collisionFilter.group = possessionGroup;
    } else {
      matchStatsApi.setPossession(currentMatchStats, null);
      ball.collisionFilter.group = 0;
    }
  }

  function releaseBall(owner, lockDuration = 0.45) {
    if (ballOwner === owner) {
      const carrier = owner === "human" ? human : rival;
      carrier.collisionFilter.group = 0;
      ball.collisionFilter.group = 0;
      ballOwner = null;
      matchStatsApi.setPossession(currentMatchStats, null);
    }
    possessionLockedUntil[owner] = Math.max(possessionLockedUntil[owner], elapsed + lockDuration);
  }

  function updateBallPossession(movement) {
    if (freeKickPending && screen !== "freekick") return;
    const humanDistance = Math.hypot(ball.position.x - human.position.x, ball.position.y - human.position.y);
    const rivalDistance = trainingMode ? Infinity : Math.hypot(ball.position.x - rival.position.x, ball.position.y - rival.position.y);
    if (ballOwner === "human" && !trainingMode && rivalDistance < 34 && elapsed >= possessionLockedUntil.rival) setBallOwner("rival");
    else if (ballOwner === "rival" && humanDistance < 34 && elapsed >= possessionLockedUntil.human) setBallOwner("human");

    if (!ballOwner) {
      const humanCanCollect = elapsed >= possessionLockedUntil.human && humanDistance < 40;
      const rivalCanCollect = !trainingMode && elapsed >= possessionLockedUntil.rival && rivalDistance < 40;
      if (humanCanCollect && (!rivalCanCollect || humanDistance <= rivalDistance)) setBallOwner("human");
      else if (rivalCanCollect) setBallOwner("rival");
    }

    if (ballOwner === "human") carryBall(human, "human", movement);
    else if (ballOwner === "rival") carryBall(rival, "rival");
  }

  function carryBall(player, owner, movement = null) {
    const speed = Math.hypot(player.velocity.x, player.velocity.y);
    let direction;
    if (owner === "human" && elapsed < feintUntil) direction = feintDirection;
    else if (owner === "rival" && localDuelMode && elapsed < player2FeintUntil) direction = player2FeintDirection;
    else if (movement?.moving) direction = movement;
    else if (speed > 0.35) direction = { x: player.velocity.x / speed, y: player.velocity.y / speed };
    else if (Number.isFinite(player.lastMoveX) && Number.isFinite(player.lastMoveY)) direction = { x: player.lastMoveX, y: player.lastMoveY };
    else direction = { x: owner === "human" ? homeAttackDirection : -homeAttackDirection, y: 0 };

    player.lastMoveX = direction.x;
    player.lastMoveY = direction.y;
    const footDistance = player.circleRadius + ball.circleRadius - 5;
    const target = {
      x: player.position.x + direction.x * footDistance - direction.y * 5,
      y: player.position.y + direction.y * footDistance + direction.x * 5,
    };
    Body.setPosition(ball, target);
    Body.setVelocity(ball, { x: player.velocity.x, y: player.velocity.y });
    Body.setAngularVelocity(ball, 0);
  }

  function controlBot(body, attackDirection, level, time, shotStamina = 100) {
    const prediction = level.reaction;
    const targetGoalX = attackDirection > 0 ? 1145 : 55;
    const predictedBall = {
      x: Math.max(field.left, Math.min(field.right, ball.position.x + ball.velocity.x * prediction)),
      y: Math.max(field.top, Math.min(field.bottom, ball.position.y + ball.velocity.y * prediction)),
    };
    const goalDirection = Math.sign(targetGoalX - predictedBall.x) || attackDirection;
    const defensivePressure = Math.hypot(human.position.x - ball.position.x, human.position.y - ball.position.y) < 115;
    const botHasBall = body === rival && !trainingMode && !localDuelMode && ballOwner === "rival";
    const humanHasBall = body === rival && ballOwner === "human";
    const botFreeKick = body === rival && freeKickPending && screen === "freekick" && freeKickVictimSide === "away";
    const humanContact = Math.hypot(human.position.x - body.position.x, human.position.y - body.position.y);
    const humanChargingShot = body === rival && !trainingMode && !localDuelMode && ballOwner === "human" && kickStarted !== null && Math.hypot(ball.position.x - human.position.x, ball.position.y - human.position.y) < 72;
    if (humanChargingShot && humanContact < 190 && time >= (body.nextShotReadAt ?? 0) && Math.random() < 0.025) {
      body.shotFakeUntil = time + 0.34;
      body.shotFakeSide = Math.random() < 0.5 ? -1 : 1;
      body.nextShotReadAt = time + 2.2 + Math.random() * 1.3;
    }
    if (botHasBall && humanContact < 120 && time >= (body.nextFeintAt ?? 0)) {
      body.feintSide = (body.feintSide || 1) * -1;
      body.nextFeintAt = time + 0.38 + Math.random() * 0.16;
      body.feintUntil = time + 0.28;
    }
    const feint = botHasBall && time < (body.feintUntil || 0) ? body.feintSide * 54 : 0;
    const shotFake = time < (body.shotFakeUntil || 0) ? body.shotFakeSide * 58 : 0;
    const steeringBall = level.avoidCorners ? {
      x: Math.max(field.left + 28, Math.min(field.right - 28, predictedBall.x)),
      y: Math.max(field.top + 28, Math.min(field.bottom - 28, predictedBall.y)),
    } : predictedBall;
    const approach = {
      x: Math.max(field.left + 28, Math.min(field.right - 28, steeringBall.x - goalDirection * 32)),
      y: steeringBall.y + Math.max(-26, Math.min(26, (360 - steeringBall.y) * 0.08)) + feint + shotFake,
    };
    const pressing = Math.hypot(human.position.x - ball.position.x, human.position.y - ball.position.y) < 105;
    const ownGoalX = targetGoalX > worldWidth / 2 ? field.left + 34 : field.right - 34;
    const closingOnGoal = Math.abs(predictedBall.x - ownGoalX) < 500;
    const defensiveTarget = {
      x: ownGoalX + (predictedBall.x - ownGoalX) * 0.62,
      y: 360 + (predictedBall.y - 360) * 0.62,
    };
    const botTarget = humanHasBall && closingOnGoal
      ? defensiveTarget
      : pressing && shotFake === 0 ? steeringBall : approach;
    moveToward(body, botTarget, level.strength * playerSpeed * (pressing ? 1.35 : 1), level.speed);

    if (botFreeKick) {
      if (Math.hypot(ball.position.x - body.position.x, ball.position.y - body.position.y) > 70) return;
      const upperTarget = goal.top + 24;
      const lowerTarget = goal.bottom - 24;
      const targetY = Math.abs(human.position.y - upperTarget) > Math.abs(human.position.y - lowerTarget) ? upperTarget : lowerTarget;
      const aimX = targetGoalX - ball.position.x;
      const aimY = (targetY - ball.position.y) * level.accuracy;
      const aimLength = Math.hypot(aimX, aimY) || 1;
      const charge = staminaPhysics.limitShotCharge(shotStamina, Math.max(0, Math.min(1, (level.power - 5) / 10)));
      const power = 5 + charge * 10;
      const profile = shotPhysics.createShotProfile(charge, ball.position.y);
      Body.setVelocity(ball, { x: aimX / aimLength * power, y: aimY / aimLength * power });
      if (ballOwner === "rival") releaseBall("rival", 0.12);
      matchStatsApi.recordTouch(currentMatchStats, "away");
      recordShot("away", aimX, aimY);
      Body.setAngularVelocity(ball, profile.spin);
      shotFlash = { body, until: elapsed + 0.42 };
      triggerShotEffect(body, power, profile);
      startScreenShake(0.18, power > 11 ? 2.8 : 1.6);
      freeKickBallPlayed = true;
      body.lastShot = time;
      return;
    }

    if (!trainingMode && !localDuelMode && ballOwner === "human" && humanContact < 54 && time - (body.lastShirtPull ?? -Infinity) > 3 && Math.random() < 0.012) {
      if (callShirtPullFoul("away", true)) {
        body.lastShirtPull = time;
        return;
      }
    }

    const distance = Math.hypot(ball.position.x - body.position.x, ball.position.y - body.position.y);
    if (distance > 50 || ballOwner === "human") return;

    const goalDistance = Math.abs(targetGoalX - ball.position.x);
    const shotReady = goalDistance < 420 || goalDistance < 620 && Math.abs(ball.position.y - 360) < 90;
    if (shotReady && time - (body.lastShot ?? -Infinity) >= level.cooldown) {
      const upperTarget = goal.top + 24;
      const lowerTarget = goal.bottom - 24;
      const targetY = Math.abs(human.position.y - upperTarget) > Math.abs(human.position.y - lowerTarget) ? upperTarget : lowerTarget;
      const aimX = targetGoalX - ball.position.x;
      const aimY = (targetY - ball.position.y) * level.accuracy;
      const length = Math.hypot(aimX, aimY) || 1;
      const defaultCharge = Math.max(0, Math.min(1, (level.power - 5) / 10));
      const requestedCharge = botHasBall
        ? shotPhysics.chooseBotShotCharge(homeGoals - awayGoals, defaultCharge)
        : defaultCharge;
      const charge = staminaPhysics.limitShotCharge(shotStamina, requestedCharge);
      const power = 5 + charge * 10;
      const profile = shotPhysics.createShotProfile(charge, ball.position.y);
      Body.setVelocity(ball, { x: aimX / length * power, y: aimY / length * power });
      releaseBall("rival", 0.12);
      matchStatsApi.recordTouch(currentMatchStats, "away");
      recordShot("away", aimX, aimY);
      Body.setAngularVelocity(ball, profile.spin);
      shotFlash = { body, until: elapsed + 0.42 };
      triggerShotEffect(body, power, profile);
      startScreenShake(0.18, power > 11 ? 2.8 : 1.6);
      body.lastShot = time;
      return;
    }

    if (time - (body.lastDribble ?? -Infinity) >= level.dribble) {
      const laneY = 360 + Math.max(-80, Math.min(80, (360 - ball.position.y) * 0.45));
      const dribbleX = targetGoalX - ball.position.x;
      const dribbleY = (laneY - ball.position.y) * 0.65 + feint * 0.12;
      const length = Math.hypot(dribbleX, dribbleY) || 1;
      const touch = defensivePressure ? 5.2 : 6.4;
      Body.setVelocity(ball, { x: dribbleX / length * touch, y: dribbleY / length * touch });
      releaseBall("rival", 0.3);
      matchStatsApi.recordTouch(currentMatchStats, "away");
      matchStatsApi.recordDribble(currentMatchStats, "away");
      body.lastDribble = time;
    }
  }

  function updatePreviewMatch() {
    previewElapsed += 1 / 60;
    keepPlayerInField(human);
    keepPlayerInField(rival);
    controlBot(human, 1, previewBot, previewElapsed);
    controlBot(rival, -1, previewBot, previewElapsed);
    keepPlayerInField(human);
    keepPlayerInField(rival);
    applyBallCurve();
    recordBallTrail();
    limitSpeed(ball, 15);
    if (ball.position.y > goal.top && ball.position.y < goal.bottom && (ball.position.x < 72 || ball.position.x > 1128)) {
      Body.setPosition(ball, { x: 600, y: 360 });
      Body.setVelocity(ball, { x: 0, y: 0 });
      ballTrail = [];
      Body.setPosition(human, { x: 430, y: 360 });
      Body.setVelocity(human, { x: 0, y: 0 });
      Body.setPosition(rival, { x: 775, y: 360 });
      Body.setVelocity(rival, { x: 0, y: 0 });
      human.lastShot = -Infinity;
      rival.lastShot = -Infinity;
    }
  }

  function updateTeamColors() {
    const kit = kits[selectedKit] || kits.rivage;
    document.documentElement.style.setProperty("--teal", competitionColors[selectedCompetition] || kit.color);
    document.documentElement.style.setProperty("--coral", matchAwayTeam.color || kit.rivalColor);
    document.documentElement.style.setProperty("--home-team-color", matchHomeTeam.color || kit.color);
    document.documentElement.style.setProperty("--away-team-color", matchAwayTeam.color || kit.rivalColor);
    document.querySelector("#home-name").textContent = matchHomeTeam.name;
    document.querySelector("#away-name").textContent = matchAwayTeam.name;
    renderCompactTeamMark(ui.homeMatchMark, matchHomeTeam);
    renderCompactTeamMark(ui.awayMatchMark, matchAwayTeam);
    document.querySelector("#pitch-competition-label").textContent = matchCompetitionName;
  }

  function drawField() {
    const palette = stadiumPalettes[matchWeather] || stadiumPalettes.clear;
    context.clearRect(0, 0, worldWidth, worldHeight);
    context.fillStyle = palette.background;
    context.fillRect(0, 0, worldWidth, worldHeight);
    context.fillStyle = palette.pitch;
    context.fillRect(64, 64, 1072, 592);
    context.fillStyle = "#d8d5c6";
    context.fillRect(64, 61, 1072, 3);
    context.fillRect(64, 656, 1072, 3);
    for (let stripe = 0; stripe < 10; stripe += 1) {
      context.fillStyle = palette.stripes[stripe % 2];
      context.fillRect(field.left + stripe * 104, field.top, 104, field.bottom - field.top);
    }

    context.strokeStyle = "#eff7e4c9";
    context.lineWidth = 3;
    context.strokeRect(field.left, field.top, field.right - field.left, field.bottom - field.top);
    context.beginPath();
    context.moveTo(600, field.top);
    context.lineTo(600, field.bottom);
    context.stroke();
    context.beginPath();
    context.arc(600, 360, 88, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = "#eff7e4";
    context.beginPath();
    context.arc(600, 360, 4, 0, Math.PI * 2);
    context.fill();

    context.strokeRect(field.left, 246, 165, 228);
    context.strokeRect(field.right - 165, 246, 165, 228);
    context.strokeRect(field.left, 302, 55, 116);
    context.strokeRect(field.right - 55, 302, 55, 116);
    context.beginPath();
    context.arc(field.left + 115, 360, 3.5, 0, Math.PI * 2);
    context.arc(field.right - 115, 360, 3.5, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.arc(field.left + 115, 360, 46, -0.82, 0.82);
    context.stroke();
    context.beginPath();
    context.arc(field.right - 115, 360, 46, Math.PI - 0.82, Math.PI + 0.82);
    context.stroke();

    context.fillStyle = "#f2f3df";
    context.fillRect(20, goal.top, 60, 5);
    context.fillRect(20, goal.bottom - 5, 60, 5);
    context.fillRect(20, goal.top, 5, goal.bottom - goal.top);
    context.fillRect(1120, goal.top, 60, 5);
    context.fillRect(1120, goal.bottom - 5, 60, 5);
    context.fillRect(1175, goal.top, 5, goal.bottom - goal.top);
    context.strokeStyle = "#f2f3df35";
    context.lineWidth = 1;
    for (let x = 31; x < 80; x += 12) {
      context.beginPath(); context.moveTo(x, goal.top + 5); context.lineTo(x, goal.bottom - 5); context.stroke();
    }
    for (let x = 1120; x < 1175; x += 12) {
      context.beginPath(); context.moveTo(x, goal.top + 5); context.lineTo(x, goal.bottom - 5); context.stroke();
    }
  }

  function drawStadiumStands() {
    const palette = stadiumPalettes[matchWeather] || stadiumPalettes.clear;
    const seats = palette.seats;
    context.save();
    context.fillStyle = palette.stand;
    context.fillRect(0, 0, worldWidth, 64);
    context.fillRect(0, 656, worldWidth, 64);
    context.fillRect(0, 64, 64, 592);
    context.fillRect(1136, 64, 64, 592);
    for (let row = 0; row < 4; row += 1) {
      const topY = 3 + row * 14;
      const bottomY = 657 + row * 14;
      context.fillStyle = palette.rows[row % 2];
      context.fillRect(0, topY, worldWidth, 12);
      context.fillRect(0, bottomY, worldWidth, 12);
      for (let seat = 0; seat < 48; seat += 1) {
        const x = seat * 26 + 3;
        context.fillStyle = seats[(seat * 3 + row) % seats.length];
        context.fillRect(x, topY + 2, 19, 7);
        context.fillRect(x, bottomY + 2, 19, 7);
      }
    }
    for (let row = 0; row < 4; row += 1) {
      const leftX = 3 + row * 14;
      const rightX = 1139 + row * 14;
      context.fillStyle = palette.rows[row % 2];
      context.fillRect(leftX, 64, 12, 592);
      context.fillRect(rightX, 64, 12, 592);
      for (let seat = 0; seat < 32; seat += 1) {
        const y = 78 + seat * 18;
        context.fillStyle = seats[(seat * 2 + row) % seats.length];
        context.fillRect(leftX + 2, y, 7, 12);
        context.fillRect(rightX + 2, y, 7, 12);
      }
    }
    context.fillStyle = palette.rail;
    context.fillRect(0, 60, worldWidth, 4);
    context.fillRect(0, 656, worldWidth, 4);
    context.fillStyle = palette.roof;
    context.fillRect(0, 0, worldWidth, 3);
    context.fillRect(0, 717, worldWidth, 3);
    context.restore();
  }

  function drawWeather() {
    if (matchWeather === "clear" || !["playing", "freekick", "kickoffCountdown"].includes(screen)) return;
    context.save();
    if (matchWeather === "rain") {
      context.fillStyle = "#20374320";
      context.fillRect(0, 0, worldWidth, worldHeight);
      for (let drop = 0; drop < 220; drop += 1) {
        const speed = 440 + drop % 9 * 24;
        const x = (drop * 173 + weatherTime * speed * 0.58 + worldWidth) % worldWidth;
        const y = (drop * 97 + weatherTime * speed + worldHeight) % worldHeight;
        const length = 9 + drop % 7 * 2.2;
        context.globalAlpha = 0.16 + drop % 5 * 0.035;
        context.strokeStyle = drop % 4 === 0 ? "#f2fbff" : "#c5e1ed";
        context.lineWidth = drop % 3 === 0 ? 1.2 : 0.7;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x - 4, y + length);
        context.stroke();
      }
    } else {
      context.fillStyle = "#f6fbff";
      for (let flake = 0; flake < 150; flake += 1) {
        const drift = Math.sin(weatherTime * 0.65 + flake * 0.73) * (10 + flake % 15);
        const x = (flake * 149 + drift + worldWidth) % worldWidth;
        const y = (flake * 83 + weatherTime * (18 + flake % 22) + worldHeight) % worldHeight;
        context.globalAlpha = 0.3 + (flake % 6) * 0.1;
        context.beginPath();
        context.arc(x, y, 0.8 + flake % 4 * 0.45, 0, Math.PI * 2);
        context.fill();
      }
    }
    context.restore();
  }

  function drawPlayer(body, color, label, facing, accent, energy) {
    const pullingShirt = shirtPullAttempt?.offenderSide === (body === human ? "home" : "away");
    const exhausted = energy <= 0;
    const shake = pullingShirt ? Math.sin(crowdAnimationTime * 68) * 2 : exhausted ? Math.sin(crowdAnimationTime * 54) * 3 : 0;
    const x = body.position.x + shake;
    const y = body.position.y + (pullingShirt ? Math.cos(crowdAnimationTime * 74) * 1.4 : exhausted ? Math.cos(crowdAnimationTime * 61) * 2 : 0);
    const shirtPull = pullingShirt || body === human && (isActionHeld("slow") || elapsed < shirtPullFlashUntil) || body === rival && localDuelMode && (keys.has(secondKeyBindings.slow) || elapsed < player2ShirtPullFlashUntil);
    const goldShot = shotFlash?.body === body && elapsed < shotFlash.until;
    const feint = body === human && elapsed < feintUntil || body === rival && localDuelMode && elapsed < player2FeintUntil;
    const feintOffset = body === human ? feintDirection : player2FeintDirection;
    const playerColor = exhausted ? "#ff304d" : shirtPull ? "#ef3340" : goldShot ? "#f6c847" : feint ? "#72e5e3" : color;
    const goldPulse = goldShot ? 1 + Math.sin((shotFlash.until - elapsed) * 24) * 0.08 : 1;
    context.save();
    context.shadowColor = exhausted ? "#ff304dcc" : shirtPull ? "#ff435dcc" : goldShot ? "#ffd750dd" : "#11261c99";
    context.shadowBlur = exhausted || shirtPull || goldShot ? 25 : 12;
    context.shadowOffsetY = 5;
    if (feint) {
      context.globalAlpha = 0.3;
      context.fillStyle = "#d8ffff";
      context.beginPath();
      context.arc(x - feintOffset.x * 14, y - feintOffset.y * 14, body.circleRadius * 0.82, 0, Math.PI * 2);
      context.fill();
      context.globalAlpha = 1;
    }
    context.fillStyle = playerColor;
    context.beginPath();
    context.arc(x, y, body.circleRadius * goldPulse, 0, Math.PI * 2);
    context.fill();
    context.save();
    context.beginPath();
    context.arc(x, y, body.circleRadius - 2, 0, Math.PI * 2);
    context.clip();
    context.fillStyle = accent;
    context.fillRect(x - body.circleRadius, y - 3, body.circleRadius * 2, 6);
    context.restore();
    context.shadowColor = "transparent";
    context.strokeStyle = "#ffffffc0";
    context.lineWidth = 2;
    context.stroke();
    context.fillStyle = "#17231b";
    context.font = "700 13px 'Cruyff Sans', Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, x, y + 1);
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.arc(x + facing * (body.circleRadius - 4), y - 6, 3, 0, Math.PI * 2);
    context.fill();
    if (shirtPull) {
      const team = body === human ? matchHomeTeam : matchAwayTeam;
      const badge = loadCanvasImage(team.flag || team.crest);
      if (badge?.complete && badge.naturalWidth) context.drawImage(badge, x - 10, y - 57, 20, 20);
      context.font = "800 12px 'Cruyff Sans', Arial, sans-serif";
      context.fillStyle = "#fff";
      context.shadowColor = "#6e1220";
      context.shadowBlur = 5;
      context.fillText("TIRAGE DE MAILLOT", x, y - 37);
    }
    context.restore();
  }

  function updateRunTrail() {
    const activeScreen = ["playing", "freekick", "crowdCheer", "goal", "crowdReturn"].includes(screen);
    if (!activeScreen) {
      runTrailPoints = [];
      rivalRunTrailPoints = [];
      return;
    }
    const rivalSpeed = Math.hypot(rival.velocity.x, rival.velocity.y);
    const rivalMovement = localDuelMode ? readMovementFor(secondKeyBindings) : {
      x: rivalSpeed ? rival.velocity.x / rivalSpeed : 0,
      y: rivalSpeed ? rival.velocity.y / rivalSpeed : 0,
      moving: rivalSpeed > 0.6,
    };
    const recordTrail = (points, body, energy, movement, lastRecordAt) => {
      let nextRecordAt = lastRecordAt;
      if (staminaPhysics.shouldShowTrail(energy, movement.moving) && crowdAnimationTime - lastRecordAt >= 0.06) {
        points.push({ x: body.position.x, y: body.position.y, angle: Math.atan2(movement.y, movement.x), at: crowdAnimationTime });
        nextRecordAt = crowdAnimationTime;
      }
      while (points.length && crowdAnimationTime - points[0].at > 0.42) points.shift();
      return nextRecordAt;
    };
    lastRunTrailRecordAt = recordTrail(runTrailPoints, human, stamina, readMovement(), lastRunTrailRecordAt);
    if (!trainingMode) lastRivalRunTrailRecordAt = recordTrail(rivalRunTrailPoints, rival, rivalStamina, rivalMovement, lastRivalRunTrailRecordAt);
    else rivalRunTrailPoints = [];
  }

  function drawRunTrail(points, body, team, fallbackColor, fallbackAccent) {
    if (!points.length) return;
    const teamColor = team.color || fallbackColor;
    const teamAccent = team.accent || fallbackAccent;
    for (let index = 0; index < points.length; index += 1) {
      const ghost = points[index];
      const age = crowdAnimationTime - ghost.at;
      const fade = Math.max(0, 1 - age / 0.42);
      const radius = body.circleRadius * (0.7 + fade * 0.12);
      const separation = (index + 1) * 9;
      context.save();
      context.globalAlpha = fade * 0.42;
      context.translate(ghost.x - Math.cos(ghost.angle) * separation, ghost.y - Math.sin(ghost.angle) * separation);
      context.rotate(ghost.angle);
      context.shadowColor = teamColor;
      context.shadowBlur = 18 + fade * 12;
      context.fillStyle = teamColor;
      context.beginPath();
      context.arc(0, 0, radius, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
      context.beginPath();
      context.arc(0, 0, radius - 1.5, 0, Math.PI * 2);
      context.clip();
      context.fillStyle = teamAccent;
      context.fillRect(-radius, -3.2, radius * 2, 6.4);
      context.restore();
    }
  }

  function drawStaminaBar(body, energy, team, side) {
    if (!["playing", "freekick", "crowdCheer", "goal", "crowdReturn"].includes(screen)) return;
    const width = 48;
    const height = 6;
    const x = body.position.x - width / 2;
    const y = body.position.y - body.circleRadius - 16 - (side === "away" ? 30 : 0);
    const color = energy > 35 ? "#c4f277" : energy > 15 ? "#ffd166" : "#ff796c";
    context.save();
    context.font = "800 9px 'Cruyff Sans', Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "bottom";
    context.fillStyle = "#fff";
    context.shadowColor = "#07110de8";
    context.shadowBlur = 4;
    context.fillText(team.player || team.name, body.position.x, y - 3, 92);
    if (energy <= 0) {
      context.fillStyle = "#ff5264";
      context.shadowColor = "#4a000bcc";
      context.shadowBlur = 5;
      context.font = "900 9px 'Cruyff Sans', Arial, sans-serif";
      context.fillText("ENDURANCE LIMITÉE", body.position.x, y - 12, 118);
    }
    context.shadowBlur = 0;
    context.fillStyle = "#07110de8";
    context.fillRect(x - 2, y - 2, width + 4, height + 4);
    context.fillStyle = "#ffffff36";
    context.fillRect(x, y, width, height);
    context.fillStyle = color;
    context.fillRect(x, y, width * Math.max(0, Math.min(1, energy / 100)), height);
    context.strokeStyle = "#ffffffb0";
    context.lineWidth = 1;
    context.strokeRect(x - 0.5, y - 0.5, width + 1, height + 1);
    context.restore();
  }

  function drawBallTrail() {
    if (ballTrail.length < 2 || Math.abs(ball.angularVelocity) < 0.035) return;
    const color = ball.angularVelocity >= 0 ? matchHomeTeam.color || "#c4f277" : matchAwayTeam.color || "#ff796c";
    context.save();
    context.lineCap = "round";
    for (let index = 1; index < ballTrail.length; index += 1) {
      const progress = index / ballTrail.length;
      context.globalAlpha = progress * 0.64;
      context.strokeStyle = color;
      context.lineWidth = progress * 10;
      context.beginPath();
      context.moveTo(ballTrail[index - 1].x, ballTrail[index - 1].y);
      context.lineTo(ballTrail[index].x, ballTrail[index].y);
      context.stroke();
    }
    context.restore();
  }

  function drawImpactEffects() {
    if (shotEffect) {
      const progress = (elapsed - shotEffect.startedAt) / 0.48;
      if (progress >= 1) shotEffect = null;
      else {
        context.save();
        context.globalAlpha = 1 - progress;
        context.translate(shotEffect.x, shotEffect.y);
        context.rotate(shotEffect.angle);
        context.strokeStyle = shotEffect.color;
        context.shadowColor = shotEffect.color;
        context.shadowBlur = 16;
        context.lineWidth = 3 * (1 - progress) + 0.5;
        context.beginPath();
        context.arc(0, 0, 12 + progress * (38 + shotEffect.strength * 18), -0.75, 0.75);
        context.stroke();
        context.lineWidth = 2;
        for (let streak = -2; streak <= 2; streak += 1) {
          const angle = streak * 0.2;
          const start = 10 + progress * 12;
          const end = 24 + progress * (22 + shotEffect.strength * 24);
          context.beginPath();
          context.moveTo(Math.cos(angle) * start, Math.sin(angle) * start);
          context.lineTo(Math.cos(angle) * end, Math.sin(angle) * end);
          context.stroke();
        }
        context.restore();
      }
    }

    if (touchEffect) {
      const progress = (elapsed - touchEffect.startedAt) / 0.3;
      if (progress >= 1) touchEffect = null;
      else {
        context.save();
        context.globalAlpha = 1 - progress;
        context.strokeStyle = "#70fff0";
        context.fillStyle = "#d8fff8";
        context.shadowColor = "#70fff0";
        context.shadowBlur = 12;
        context.lineWidth = 2.5 * (1 - progress) + 0.5;
        context.beginPath();
        context.arc(touchEffect.x, touchEffect.y, 13 + progress * 23, 0, Math.PI * 2);
        context.stroke();
        for (let spark = 0; spark < 8; spark += 1) {
          const angle = spark * Math.PI / 4;
          const inner = 10 + progress * 13;
          const outer = 17 + progress * 23;
          context.beginPath();
          context.moveTo(touchEffect.x + Math.cos(angle) * inner, touchEffect.y + Math.sin(angle) * inner);
          context.lineTo(touchEffect.x + Math.cos(angle) * outer, touchEffect.y + Math.sin(angle) * outer);
          context.stroke();
        }
        context.restore();
      }
    }
  }

  function drawKickCharge() {
    if (isActionHeld("shoot") && kickStarted === null) startKick();
    if (localDuelMode && keys.has(secondKeyBindings.shoot) && player2KickStarted === null) startSecondPlayerKick();
    const player2Charging = localDuelMode && player2KickStarted !== null;
    const startedAt = player2Charging ? player2KickStarted : kickStarted;
    const chargingPlayer = player2Charging ? rival : human;
    const visible = startedAt !== null && (screen === "playing" || screen === "freekick");
    ui.kickCharge.hidden = !visible;
    if (!visible) return;
    const charge = Math.min(1, (performance.now() - startedAt) / 1200);
    const bounds = canvas.getBoundingClientRect();
    const scale = Math.min(bounds.width / worldWidth, bounds.height / worldHeight);
    const offsetX = (bounds.width - worldWidth * scale) / 2;
    const offsetY = (bounds.height - worldHeight * scale) / 2;
    ui.kickCharge.style.left = `${offsetX + chargingPlayer.position.x * scale}px`;
    ui.kickCharge.style.top = `${offsetY + (chargingPlayer.position.y - 34) * scale}px`;
    ui.kickChargeValue.textContent = `${Math.round(charge * 100)}%`;
    ui.kickChargeFill.style.width = `${charge * 100}%`;
  }

  function drawStadiumBoards() {
    const boardWidth = 500;
    const boardHeight = 42;
    const boardX = (worldWidth - boardWidth) / 2;
    const boardYs = [8, 670];
    const featuredImage = boardMode === "player" ? loadCanvasImage(boardPlayerImage) : null;
    for (const boardY of boardYs) {
      context.save();
      context.fillStyle = "#08120feF";
      context.fillRect(boardX, boardY, boardWidth, boardHeight);
      context.strokeStyle = "#ffffff65";
      context.lineWidth = 1;
      context.strokeRect(boardX + 0.5, boardY + 0.5, boardWidth - 1, boardHeight - 1);
      if (screen === "halftime") {
        const adMark = loadCanvasImage(matchCompetitionCrest || "1/psg.webp");
        if (adMark?.complete && adMark.naturalWidth) context.drawImage(adMark, boardX + 8, boardY + 6, 30, 30);
        context.fillStyle = "#ffd166";
        context.font = "900 15px 'Cruyff Sans', Arial, sans-serif";
        context.textAlign = "left";
        context.textBaseline = "middle";
        context.fillText("PAUSE PUBLICITAIRE", boardX + 50, boardY + 16);
        context.fillStyle = "#f4f0dc";
        context.font = "700 10px 'Cruyff Sans', Arial, sans-serif";
        context.fillText("LA REPRISE ATTEND VOTRE SIGNAL", boardX + 50, boardY + 31);
        context.restore();
        continue;
      }
      if (boardMode === "advert") {
        const advert = context.createLinearGradient(boardX, boardY, boardX + boardWidth, boardY + boardHeight);
        advert.addColorStop(0, "#173e36");
        advert.addColorStop(0.55, "#214b41");
        advert.addColorStop(1, "#171f1d");
        context.fillStyle = advert;
        context.fillRect(boardX + 1, boardY + 1, boardWidth - 2, boardHeight - 2);
        const leagueMark = loadCanvasImage(matchCompetitionCrest);
        if (leagueMark?.complete && leagueMark.naturalWidth) context.drawImage(leagueMark, boardX + 10, boardY + 5, 32, 32);
        context.fillStyle = "#c4f277";
        context.fillRect(boardX + 50, boardY + 8, 3, 26);
        context.fillStyle = "#f4f0dc";
        context.font = "900 15px 'Cruyff Sans', Arial, sans-serif";
        context.textAlign = "left";
        context.textBaseline = "middle";
        context.fillText(boardAd, boardX + 64, boardY + 22, 380);
        context.restore();
        continue;
      }
      if (boardMode === "logos") {
        const marks = [
          { source: matchHomeTeam.crest, label: matchHomeTeam.name, x: boardX + 12 },
          { source: matchCompetitionCrest, label: matchCompetitionName, x: boardX + 205 },
          { source: matchAwayTeam.crest, label: matchAwayTeam.name, x: boardX + 398 },
        ];
        for (const mark of marks) {
          const image = loadCanvasImage(mark.source);
          if (image?.complete && image.naturalWidth) context.drawImage(image, mark.x, boardY + 6, 30, 30);
          context.fillStyle = "#f4f0dc";
          context.font = "700 9px 'Cruyff Sans', Arial, sans-serif";
          context.textAlign = "left";
          context.textBaseline = "middle";
          context.fillText(mark.label, mark.x + 36, boardY + 22, 150);
        }
        context.restore();
        continue;
      }
      if (featuredImage?.complete && featuredImage.naturalWidth) {
        context.drawImage(featuredImage, boardX + 5, boardY + 4, 48, 34);
        context.fillStyle = "#f4f0dc";
        context.font = "800 17px 'Cruyff Sans', Arial, sans-serif";
        context.textAlign = "left";
        context.textBaseline = "middle";
        context.fillText(boardPlayerName, boardX + 64, boardY + 15, 195);
        context.fillStyle = competitionColors[selectedCompetition] || "#c4f277";
        context.font = "700 11px 'Cruyff Sans', Arial, sans-serif";
        context.textAlign = "left";
        context.fillText(matchCompetitionName, boardX + 64, boardY + 30, 200);
        context.fillStyle = "#fff";
        context.font = "900 20px 'Cruyff Sans', Arial, sans-serif";
        context.textAlign = "right";
        context.fillText(`${homeGoals} — ${awayGoals}`, boardX + boardWidth - 12, boardY + 22);
      } else {
        const homeBadge = loadCanvasImage(matchHomeTeam.crest);
        if (homeBadge?.complete && homeBadge.naturalWidth) context.drawImage(homeBadge, boardX + 8, boardY + 6, 30, 30);
        context.fillStyle = matchHomeTeam.color || "#f4f0dc";
        context.font = "700 11px 'Cruyff Sans', Arial, sans-serif";
        context.textAlign = "left";
        context.textBaseline = "middle";
        context.fillText(matchHomeTeam.name, boardX + 44, boardY + 21, 132);
        context.fillStyle = "#fff";
        context.font = "900 22px 'Cruyff Sans', Arial, sans-serif";
        context.textAlign = "center";
        context.fillText(`${homeGoals}  —  ${awayGoals}`, boardX + boardWidth / 2, boardY + 22);
        context.fillStyle = competitionColors[selectedCompetition] || "#c4f277";
        context.font = "700 11px 'Cruyff Sans', Arial, sans-serif";
        context.textAlign = "right";
        context.fillText(matchCompetitionName, boardX + boardWidth - 45, boardY + 13, 135);
        context.fillStyle = matchAwayTeam.color || "#f4f0dc";
        context.font = "700 11px 'Cruyff Sans', Arial, sans-serif";
        context.fillText(matchAwayTeam.name, boardX + boardWidth - 45, boardY + 29, 135);
        const awayBadge = loadCanvasImage(matchAwayTeam.crest);
        if (awayBadge?.complete && awayBadge.naturalWidth) context.drawImage(awayBadge, boardX + boardWidth - 37, boardY + 6, 30, 30);
      }
      context.restore();
    }
  }

  function advanceStadiumBoards(delta) {
    boardElapsed += delta;
    if (boardElapsed < boardNextChange) return;
    boardElapsed = 0;
    boardNextChange = randomBetween(4, 13);
    const players = selectedPlayerImages();
    const roll = Math.random();
    if (players.length && roll < 0.14) {
      boardMode = "player";
      boardPlayerImage = players[Math.floor(Math.random() * players.length)];
      boardPlayerName = ({
        "1/1/mbappeloading.webp": "KYLIAN MBAPPÉ",
        "1/1/mbappefrloading.jpeg": "KYLIAN MBAPPÉ",
        "1/1/yamal26loading.jpg": "LAMINE YAMAL",
        "1/1/yamalloading.webp": "LAMINE YAMAL",
        "1/1/haalandloading.webp": "ERLING HAALAND",
        "1/1/declanriceloading.celeb": "DECLAN RICE",
        "1/1/marseilleloading.webp": "OLYMPIQUE DE MARSEILLE",
        "1/1/desireloading.webp": "DÉSIRÉ DOUE",
        "1/1/argloading.webp": "LIONEL MESSI",
      })[boardPlayerImage] || matchHomeTeam.name;
    } else if (roll < (players.length ? 0.68 : 0.72)) {
      boardMode = "advert";
      boardPlayerImage = null;
      boardAd = [
        "McDONALD'S · C'EST ÇA LE MATCH",
        "McDONALD'S · TASTY CROUSTY",
        "TASTY CROUSTY · LE CROUSTY DU MATCH",
        "TASTY CROUSTY · CROQUE LE BUT",
        "McDONALD'S · ON SE RETROUVE APRÈS LE MATCH",
        "TASTY CROUSTY · LA PAUSE DES CHAMPIONS",
        "ONZE · LE MATCH EST À VOUS",
        "FAIR-PLAY · JUSQU'AU BOUT",
      ][Math.floor(Math.random() * 8)];
    } else if (roll < 0.86) {
      boardMode = "logos";
      boardPlayerImage = null;
    } else {
      boardMode = "score";
      boardPlayerImage = null;
    }
  }

  function drawReferee() {
    const focus = ballOwner === "human" ? human.position : ballOwner === "rival" ? rival.position : ball.position;
    const { x, y } = refereePosition;
    context.save();
    context.globalAlpha = 0.58;
    context.fillStyle = "#111713";
    context.beginPath();
    context.ellipse(x, y + 3, 10, 14, 0, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#eee9d9";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x - 4, y - 9); context.lineTo(x - 2, y + 10);
    context.moveTo(x + 3, y - 9); context.lineTo(x + 4, y + 10);
    context.stroke();
    context.fillStyle = "#d2a27d";
    context.beginPath();
    context.arc(x, y - 16, 5, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#f5d547";
    context.fillRect(x + 7, y - 3, 3, 5);
    context.restore();
  }

  function updateReferee(delta) {
    const focus = ballOwner === "human" ? human.position : ballOwner === "rival" ? rival.position : ball.position;
    let offsetX = refereePosition.x - focus.x;
    let offsetY = refereePosition.y - focus.y;
    let distance = Math.hypot(offsetX, offsetY);
    if (distance < 1) {
      const speed = Math.hypot(ball.velocity.x, ball.velocity.y);
      offsetX = speed > 1 ? -ball.velocity.y / speed : 1;
      offsetY = speed > 1 ? ball.velocity.x / speed : 0;
      distance = 1;
    }
    const targetDistance = 88;
    let target = {
      x: Math.max(field.left + 28, Math.min(field.right - 28, focus.x + offsetX / distance * targetDistance)),
      y: Math.max(field.top + 28, Math.min(field.bottom - 28, focus.y + offsetY / distance * targetDistance)),
    };
    const players = trainingMode ? [human] : [human, rival];
    if (players.some((player) => Math.hypot(player.position.x - target.x, player.position.y - target.y) < 48)) {
      target = {
        x: Math.max(field.left + 28, Math.min(field.right - 28, focus.x - offsetX / distance * targetDistance)),
        y: Math.max(field.top + 28, Math.min(field.bottom - 28, focus.y - offsetY / distance * targetDistance)),
      };
    }
    const dx = target.x - refereePosition.x;
    const dy = target.y - refereePosition.y;
    const targetError = Math.hypot(dx, dy);
    const step = Math.min(targetError, 46 * delta);
    if (targetError > 0) {
      refereePosition.x += dx / targetError * step;
      refereePosition.y += dy / targetError * step;
    }
  }

  function drawSelectedBall(x, y, lift) {
    const style = ballStyles[selectedBallStyle] || ballStyles.classic;
    context.save();
    context.shadowColor = style.glow;
    context.shadowBlur = 8;
    context.shadowOffsetY = 3 + lift * 0.12;
    context.translate(x, y - lift);
    context.scale(1 + lift * 0.008, 1 + lift * 0.008);
    context.rotate(ball.angle);
    context.beginPath();
    context.arc(0, 0, 11, 0, Math.PI * 2);
    context.fillStyle = style.base;
    context.fill();
    context.save();
    context.beginPath();
    context.arc(0, 0, 10.5, 0, Math.PI * 2);
    context.clip();
    if (selectedBallStyle === "classic") {
      context.strokeStyle = style.panel;
      context.lineWidth = 1.5;
      context.beginPath();
      context.arc(0, 0, 4, 0, Math.PI * 2);
      context.moveTo(0, -10); context.lineTo(2, -5);
      context.moveTo(9, -3); context.lineTo(4, -1);
      context.moveTo(6, 8); context.lineTo(3, 4);
      context.moveTo(-6, 8); context.lineTo(-4, 3);
      context.moveTo(-9, -3); context.lineTo(-4, -1);
      context.stroke();
    } else {
      const paintPentagon = (centerX, centerY, radius, rotation, color) => {
        context.fillStyle = color;
        context.beginPath();
        for (let point = 0; point < 5; point += 1) {
          const angle = rotation + point * Math.PI * 2 / 5;
          const pointX = centerX + Math.cos(angle) * radius;
          const pointY = centerY + Math.sin(angle) * radius;
          if (point === 0) context.moveTo(pointX, pointY);
          else context.lineTo(pointX, pointY);
        }
        context.closePath();
        context.fill();
      };
      for (let panel = 0; panel < 5; panel += 1) {
        const angle = -Math.PI / 2 + panel * Math.PI * 2 / 5;
        paintPentagon(Math.cos(angle) * 6.4, Math.sin(angle) * 6.4, 2.8, angle, style.panel);
      }
      paintPentagon(0, 0, 3.4, -Math.PI / 2, style.accent);
    }
    context.restore();
    context.shadowColor = "transparent";
    context.strokeStyle = style.accent;
    context.lineWidth = 1.2;
    context.beginPath();
    context.arc(0, 0, 10.4, 0, Math.PI * 2);
    context.stroke();
    context.globalAlpha = 0.3;
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.ellipse(-4, -5, 2.1, 1, -0.5, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function draw() {
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.restore();
    context.save();
    if (screenShakeRemaining > 0) {
      const fade = screenShakeRemaining / screenShakeDuration;
      context.translate(
        Math.sin(crowdAnimationTime * 43) * screenShakeAmplitude * fade,
        Math.cos(crowdAnimationTime * 37) * screenShakeAmplitude * 0.62 * fade,
      );
    }
    const trainingCelebration = screen === "playing" && trainingMode && crowdPhase !== "match";
    if (["crowdCheer", "goal", "crowdReturn"].includes(screen) || trainingCelebration) {
      const scorer = celebrationSide === "home" ? human : rival;
      const returning = screen === "crowdReturn" || trainingCelebration && crowdPhase === "retreating";
      const progress = returning ? 1 - Math.min(1, crowdElapsed / 1.7) : Math.min(1, celebrationElapsed / 0.55);
      const easedProgress = progress * progress * (3 - 2 * progress);
      const zoom = 1 + easedProgress * 0.38;
      context.translate(worldWidth / 2, worldHeight / 2);
      context.scale(zoom, zoom);
      context.translate(-scorer.position.x, -scorer.position.y);
    }
    drawField();
    drawStadiumStands();
    drawWeather();
    drawCrowd();
    drawConfetti();
    drawStadiumBoards();
    drawBallTrail();
    drawImpactEffects();
    const home = kits[selectedKit] || kits.rivage;
    drawRunTrail(runTrailPoints, human, matchHomeTeam, home.color, home.rivalColor);
    if (!trainingMode) drawRunTrail(rivalRunTrailPoints, rival, matchAwayTeam, home.rivalColor, home.color);
    drawPlayer(human, matchHomeTeam.color || home.color, "10", 1, matchHomeTeam.accent || home.rivalColor, stamina);
    if (!trainingMode) drawPlayer(rival, matchAwayTeam.color || home.rivalColor, "9", -1, matchAwayTeam.accent || home.color, rivalStamina);
    drawStaminaBar(human, stamina, matchHomeTeam, "home");
    if (!trainingMode) drawStaminaBar(rival, rivalStamina, matchAwayTeam, "away");
    drawKickCharge();
    drawReferee();

    const { x, y } = ball.position;
    const floatProgress = floatEffect ? (elapsed - floatEffect.startedAt) / 0.55 : 1;
    if (floatEffect && floatProgress >= 1) floatEffect = null;
    const ballLift = floatEffect ? Math.sin(Math.max(0, floatProgress) * Math.PI) * (7 + floatEffect.strength * 18) : 0;
    context.save();
    context.globalAlpha = 0.4 - ballLift / 100;
    context.fillStyle = "#102319";
    context.beginPath();
    context.ellipse(x, y + 7, 10 + ballLift * 0.2, 4 + ballLift * 0.08, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();

    drawSelectedBall(x, y, ballLift);
    context.restore();
  }

  function startScreenShake(duration, amplitude) {
    if (duration > screenShakeRemaining) {
      screenShakeRemaining = duration;
      screenShakeDuration = duration;
    }
    screenShakeAmplitude = Math.max(screenShakeAmplitude, amplitude);
  }

  function resizeCanvas() {
    const bounds = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(bounds.width * pixelRatio);
    canvas.height = Math.round(bounds.height * pixelRatio);
    const scale = Math.min(canvas.width / worldWidth, canvas.height / worldHeight);
    const offsetX = (canvas.width - worldWidth * scale) / 2;
    const offsetY = (canvas.height - worldHeight * scale) / 2;
    context.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    draw();
  }

  function frame(timestamp) {
    const delta = Math.min(0.033, (timestamp - (lastFrame || timestamp)) / 1000);
    lastFrame = timestamp;
    screenShakeRemaining = Math.max(0, screenShakeRemaining - delta);
    if (screenShakeRemaining === 0) screenShakeAmplitude = 0;
    crowdAnimationTime += delta;
    weatherTime += delta;
    if (screen === "playing") updateShirtPullAttempt(delta);
    updateReferee(delta);
    advanceStadiumBoards(delta);
    if (!onlineMatch && ["crowdCheer", "goal", "crowdReturn"].includes(screen)) {
      physicsRemainder += delta;
      while (physicsRemainder >= 1 / 60 && ["crowdCheer", "goal", "crowdReturn"].includes(screen)) {
        Engine.update(engine, 1000 / 60);
        updateCelebrationMovement(1 / 60);
        physicsRemainder -= 1 / 60;
      }
    }
    if (screen === "playing" || screen === "menu") {
      const focusEase = Math.min(1, delta * 2.8);
      const focus = screen === "playing" && trainingMode && crowdPhase !== "match"
        ? (celebrationSide === "home" ? human.position : rival.position)
        : ball.position;
      crowdFocusX += (focus.x - crowdFocusX) * focusEase;
      crowdFocusY += (focus.y - crowdFocusY) * focusEase;
    }
    if (["brand", "menu", "config", "loading", "intro", "competitionReveal"].includes(screen)) {
      physicsRemainder += delta;
      while (physicsRemainder >= 1 / 60) {
        Engine.update(engine, 1000 / 60);
        updatePreviewMatch();
        physicsRemainder -= 1 / 60;
      }
    }
    if (screen === "brand") {
      eventRemaining = Math.max(0, eventRemaining - delta);
      if (eventRemaining === 0) setScreen("menu");
    } else if (screen === "loading") {
      eventRemaining = Math.max(0, eventRemaining - delta);
      loadingChangeRemaining -= delta;
      if (loadingChangeRemaining <= 0) updateLoadingImage();
      if (eventRemaining === 0) showMatchPresentation();
    } else if (screen === "foul") {
      eventRemaining = Math.max(0, eventRemaining - delta);
      ui.foulCountdown.textContent = String(Math.ceil(eventRemaining));
      if (eventRemaining === 0) setScreen("freekick");
    } else if (screen === "playing" || screen === "freekick") {
      if (!onlineMatch) {
        physicsRemainder += delta;
        while (physicsRemainder >= 1 / 60 && (screen === "playing" || screen === "freekick")) {
          Engine.update(engine, 1000 / 60);
          updatePlayers(1 / 60);
          physicsRemainder -= 1 / 60;
        }
      }
      if (screen === "freekick") {
        if (freeKickBallPlayed) {
          freeKickPending = false;
          foulOffenderSide = null;
          freeKickVictimSide = null;
          freeKickBallPlayed = false;
          freeKickOrigin = null;
          setScreen("playing");
        }
      } else if (screen === "playing") {
        if (!onlineMatch) elapsed += delta;
        if (trainingMode) advanceTrainingCrowdCelebration(delta);
        if (!trainingMode) {
          if (!onlineMatch) remaining = Math.max(0, remaining - delta);
          if (!onlineMatch) {
            const coolingIndex = elapsed >= matchLength * 0.75 ? 2 : elapsed >= matchLength * 0.25 ? 1 : 0;
            if (coolingBreakEnabled && coolingIndex > 0 && !coolingBreaks.has(coolingIndex)) {
              coolingBreaks.add(coolingIndex);
              beginCoolingBreak();
            } else if (halftimeEnabled && half === 1 && elapsed >= matchLength / 2) {
              halftimeExtraRemaining = Math.max(0, halftimeExtraRemaining - delta);
              if (halftimeExtraRemaining === 0) beginHalftime();
            }
          }
          if (timestamp - lastHudUpdate > 120) {
            ui.clock.textContent = formatClock(remaining);
            lastHudUpdate = timestamp;
          }
          if ((!halftimeEnabled || half === 2) && remaining <= 0 && !onlineMatch) {
            if (finalTimeBonusRemaining === null) finalTimeBonusRemaining = homeGoals === awayGoals ? 30 : randomBetween(1, 2);
            else finalTimeBonusRemaining = Math.max(0, finalTimeBonusRemaining - delta);
            ui.clock.textContent = "00:00";
            if (finalTimeBonusRemaining === 0) showMatchResult();
          }
        }
        updateMatchCountdown();
      } else {
        physicsRemainder = 0;
      }
    } else if (screen === "halftime") {
      updateHalftimeSequence(delta);
    } else if (screen === "crowdCheer") {
      crowdElapsed += delta;
      celebrationElapsed += delta;
      if (crowdElapsed >= 2.2) {
        crowdPhase = "onPitch";
        eventRemaining = 3;
        setScreen("goal");
      }
    } else if (screen === "goal") {
      celebrationElapsed += delta;
      eventRemaining = Math.max(0, eventRemaining - delta);
      ui.goalCountdown.innerHTML = `REPRISE DU MATCH DANS <strong>${Math.ceil(eventRemaining)}</strong>s`;
      if (eventRemaining === 0) {
        crowdPhase = "retreating";
        crowdElapsed = 0;
        setScreen("crowdReturn");
      }
    } else if (screen === "crowdReturn") {
      crowdElapsed += delta;
      celebrationElapsed += delta;
      if (crowdElapsed >= 1.7) {
        crowdPhase = "match";
        goalBallLocked = false;
        for (const fan of crowd) {
          delete fan.targetX;
          delete fan.targetY;
        }
        if (!trainingMode && !onlineMatch && (homeGoals >= 4 || awayGoals >= 4)) showMatchResult();
        else startRestartCountdown();
      }
    } else if (screen === "cooling") {
      eventRemaining = Math.max(0, eventRemaining - delta);
      ui.coolingCountdown.innerHTML = `<strong>${Math.ceil(eventRemaining)}</strong>s`;
      if (eventRemaining === 0) setScreen("playing");
    } else if (screen === "intro") {
      introElapsed += delta;
      eventRemaining = Math.max(0, eventRemaining - delta);
      if (introElapsed >= 1) ui.skipIntro.hidden = false;
      if (eventRemaining === 0) finishTeamIntro();
    } else if (screen === "competitionReveal") {
      eventRemaining = Math.max(0, eventRemaining - delta);
      if (eventRemaining === 0) startKickoffCountdown();
    } else if (screen === "kickoffCountdown") {
      eventRemaining = Math.max(0, eventRemaining - delta);
      const countdown = Math.max(1, Math.ceil(eventRemaining));
      ui.kickoffCountdown.textContent = String(countdown);
      ui.status.textContent = `COUP D’ENVOI DANS ${countdown}`;
      if (eventRemaining === 0) setScreen("playing");
    }
    if (screen === "playing" || screen === "freekick") {
      feintCooldownRemaining = Math.max(0, feintCooldownRemaining - delta);
      player2FeintCooldownRemaining = Math.max(0, player2FeintCooldownRemaining - delta);
    }
    const showPlayer2Feint = localDuelMode && player2FeintCooldownRemaining > feintCooldownRemaining;
    ui.feintCooldown.hidden = !((feintCooldownRemaining > 0 || showPlayer2Feint) && (screen === "playing" || screen === "freekick"));
    if (!ui.feintCooldown.hidden) {
      ui.feintCooldown.querySelector("span").textContent = showPlayer2Feint ? "FEINTE J2" : "FEINTE";
      ui.feintCooldownValue.textContent = String(Math.ceil(showPlayer2Feint ? player2FeintCooldownRemaining : feintCooldownRemaining));
    }
    if (onlineMatch && timestamp - lastNetworkInputAt >= 50) {
      lastNetworkInputAt = timestamp;
      window.onlinePlay?.sendInput(readOnlineInput());
    }
    updateRunTrail();
    draw();
    requestAnimationFrame(frame);
  }

  document.querySelectorAll("[data-kit]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedKit = button.dataset.kit;
      document.querySelectorAll("[data-kit]").forEach((choice) => {
        const selected = choice === button;
        choice.classList.toggle("is-selected", selected);
        choice.setAttribute("aria-pressed", String(selected));
      });
      updateMatchup();
    });
  });

  document.querySelectorAll("[data-difficulty]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedBotLevel = button.dataset.difficulty;
      document.querySelectorAll("[data-difficulty]").forEach((choice) => {
        const selected = choice === button;
        choice.classList.toggle("is-selected", selected);
        choice.setAttribute("aria-pressed", String(selected));
      });
    });
  });

  document.querySelectorAll("[data-duration]").forEach((button) => {
    button.addEventListener("click", () => {
      matchLength = Number(button.dataset.duration);
      document.querySelectorAll("[data-duration]").forEach((choice) => {
        const selected = choice === button;
        choice.classList.toggle("is-selected", selected);
        choice.setAttribute("aria-pressed", String(selected));
      });
      ui.clock.textContent = formatClock(matchLength);
    });
  });

  document.querySelectorAll("[data-weather]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedWeather = button.dataset.weather;
      document.querySelectorAll("[data-weather]").forEach((choice) => {
        const selected = choice === button;
        choice.classList.toggle("is-selected", selected);
        choice.setAttribute("aria-pressed", String(selected));
      });
    });
  });

  document.querySelectorAll("[data-game-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      trainingMode = button.dataset.gameMode === "training";
      localDuelMode = button.dataset.gameMode === "duel";
      document.querySelectorAll("[data-game-mode]").forEach((choice) => {
        const selected = choice === button;
        choice.classList.toggle("is-selected", selected);
        choice.setAttribute("aria-pressed", String(selected));
      });
    });
  });

  document.querySelector("#home-club").addEventListener("change", () => {
    syncClubChoice("home");
    updateMatchup("home");
    showTeamBackdrop(document.querySelector("#home-club").value);
  });
  document.querySelector("#away-club").addEventListener("change", () => {
    syncClubChoice("away");
    updateMatchup("away");
    showTeamBackdrop(document.querySelector("#away-club").value);
  });
  document.querySelectorAll("[data-club-cycle]").forEach((button) => {
    button.addEventListener("click", () => {
      const select = document.querySelector(`#${button.dataset.clubCycle}-club`);
      const direction = Number(button.dataset.direction);
      select.selectedIndex = (select.selectedIndex + direction + select.options.length) % select.options.length;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
  });
  document.querySelectorAll("[data-menu-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const showControls = button.dataset.menuTab === "controls";
      const showOnline = button.dataset.menuTab === "online";
      document.querySelectorAll("[data-menu-tab]").forEach((tab) => {
        const selected = tab === button;
        tab.classList.toggle("is-selected", selected);
        tab.setAttribute("aria-pressed", String(selected));
      });
      document.querySelector("#menu-match-panel").hidden = showControls || showOnline;
      document.querySelector("#menu-controls-panel").hidden = !showControls;
      document.querySelector("#menu-online-panel").hidden = !showOnline;
      document.querySelector("#menu-tab-label").textContent = showOnline ? "EN LIGNE" : showControls ? "TOUCHES" : "MATCH";
    });
  });
  document.querySelectorAll("[data-bind-action]").forEach((button) => {
    button.addEventListener("click", () => {
      bindingAction = button.dataset.bindAction;
      bindingPlayer = Number(button.dataset.bindPlayer || 1);
      document.querySelector("#binding-hint").textContent = "Appuyez sur la nouvelle touche…";
      renderKeyBindings();
    });
  });
  document.querySelector("#configure-button").addEventListener("click", () => {
    updateMatchup();
    showTeamBackdrop(document.querySelector("#home-club").value);
    showConfigStep(0);
    setScreen("config");
  });
  document.querySelector("#config-next").addEventListener("click", startConfiguredMatch);
  document.querySelector("#config-back").addEventListener("click", () => {
    if (configStep === 0) setScreen("menu");
    else showConfigStep(configStep - 1);
  });
  ui.skipIntro.addEventListener("click", finishTeamIntro);
  document.querySelectorAll("[data-skip-goal]").forEach((button) => button.addEventListener("click", skipGoalCelebration));
  document.querySelector("#resume-button").addEventListener("click", beginSecondHalf);
  document.querySelector("#pause-button").addEventListener("click", () => {
    if (onlineMatch) return;
    if (screen === "playing") setScreen("pause");
    else if (screen === "pause") setScreen("playing");
  });
  document.querySelector("#rematch-button").addEventListener("click", () => {
    if (onlineMatch) {
      onlineMatch = null;
      onlineSide = null;
      ui.onlineResultDelta.hidden = true;
      setScreen("menu");
      document.querySelector('[data-menu-tab="online"]').click();
    } else startKickoffCountdown();
  });
  document.querySelector("#restart-button").addEventListener("click", startKickoffCountdown);
  document.querySelector("#home-button").addEventListener("click", () => setScreen("menu"));
  document.querySelector("#result-home-button").addEventListener("click", () => {
    if (onlineMatch) {
      onlineMatch = null;
      onlineSide = null;
      ui.onlineResultDelta.hidden = true;
    }
    ui.forfeitButton.hidden = true;
    ui.afkWarning.hidden = true;
    setScreen("menu");
  });
  ui.forfeitButton.addEventListener("click", () => {
    if (!onlineMatch || !window.confirm("Déclarer forfait ? L’adversaire recevra la victoire et l’ELO.")) return;
    ui.forfeitButton.disabled = true;
    window.onlinePlay?.forfeit();
  });

  document.addEventListener("online:matchFound", ({ detail }) => {
    onlineMatch = detail;
    onlineSide = detail.side;
    trainingMode = false;
    localDuelMode = false;
    matchLength = 90;
    coolingBreakEnabled = false;
    document.querySelector("#home-club").value = detail.teams.home.teamId;
    document.querySelector("#away-club").value = detail.teams.away.teamId;
    updateMatchup();
    document.querySelector("#pause-button").disabled = true;
    ui.onlineResultDelta.hidden = true;
    ui.forfeitButton.hidden = false;
    ui.forfeitButton.disabled = false;
    ui.afkWarning.hidden = true;
    document.querySelector("#rematch-button span").textContent = "NOUVEAU MATCH";
    window.onlinePlay?.ready();
  });
  document.addEventListener("online:matchStart", ({ detail }) => {
    if (!onlineMatch) return;
    beginMatch();
  });
  document.addEventListener("online:state", ({ detail }) => {
    if (onlineMatch) applyOnlineState(detail);
  });
  document.addEventListener("online:matchResult", ({ detail }) => {
    document.querySelector("#pause-button").disabled = false;
    ui.forfeitButton.hidden = true;
    ui.afkWarning.hidden = true;
    homeGoals = detail.homeGoals;
    awayGoals = detail.awayGoals;
    showMatchResult();
    const won = detail.winnerSide === onlineSide;
    const resultTitles = {
      "four-goals": won ? "Victoire · premier à 4 buts" : "Défaite · l’adversaire a atteint 4 buts",
      forfeit: won ? "Victoire par forfait" : "Défaite par forfait",
      disconnect: won ? "Victoire · adversaire parti" : "Défaite · déconnexion",
      afk: won ? "Victoire · adversaire inactif" : "Défaite · inactivité",
      "double-afk": "Match nul · deux joueurs inactifs",
    };
    if (detail.reason in resultTitles) document.querySelector("#result-title").textContent = resultTitles[detail.reason];
    ui.onlineResultDelta.textContent = `ELO ${detail.ratingChange >= 0 ? "+" : ""}${detail.ratingChange} · NOUVEAU TOTAL ${detail.profile.rating}`;
    ui.onlineResultDelta.hidden = false;
  });
  document.addEventListener("online:afkWarning", ({ detail }) => {
    ui.afkWarning.textContent = `INACTIVITÉ DÉTECTÉE · REPRENDS LE JEU DANS ${detail.seconds} s`;
    ui.afkWarning.hidden = false;
  });
  document.addEventListener("online:afkClear", () => {
    ui.afkWarning.hidden = true;
  });
  document.addEventListener("online:opponentDisconnected", () => {
    onlineMatch = null;
    onlineSide = null;
    document.querySelector("#pause-button").disabled = false;
    ui.forfeitButton.hidden = true;
    ui.afkWarning.hidden = true;
    setScreen("menu");
  });

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (bindingAction) {
      event.preventDefault();
      const bindings = bindingPlayer === 2 ? secondKeyBindings : keyBindings;
      bindings[bindingAction] = key;
      bindingAction = null;
      try {
        localStorage.setItem("onze-key-bindings", JSON.stringify({ ...keyBindings, player2: secondKeyBindings }));
      } catch {}
      document.querySelector("#binding-hint").textContent = "Raccourcis enregistrés.";
      renderKeyBindings();
      return;
    }
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "enter"].includes(key)) event.preventDefault();
    keys.add(key);
    if (onlineMatch) return;
    if (!onlineMatch && key === secondKeyBindings.shoot && !event.repeat) startSecondPlayerKick();
    if (localDuelMode && screen === "playing" && !event.repeat) {
      if (key === secondKeyBindings.feint) performSecondPlayerFeint();
      if (key === secondKeyBindings.slow) {
        player2ShirtPullFlashUntil = elapsed + 0.8;
        callShirtPullFoul("away");
      }
    }
    if (key === keyBindings.slow && !event.repeat) {
      shirtPullFlashUntil = elapsed + 0.8;
      callShirtPullFoul();
    }
    if (key === keyBindings.feint && !event.repeat) performFeint();
    if (key === keyBindings.shoot && !event.repeat) startKick();
    if (!onlineMatch && key === "escape" && (screen === "playing" || screen === "pause")) {
      if (screen === "playing") setScreen("pause");
      else if (screen === "pause") setScreen("playing");
    }
  });
  window.addEventListener("keyup", (event) => {
    const key = event.key.toLowerCase();
    keys.delete(key);
    if (onlineMatch) return;
    if (!onlineMatch && key === secondKeyBindings.shoot) releaseSecondPlayerKick();
    if (key === keyBindings.shoot) releaseKick();
  });
  window.addEventListener("blur", () => {
    keys.clear();
    mobileKeys.clear();
    kickStarted = null;
    ui.kickCharge.hidden = true;
  });

  document.querySelectorAll("[data-key]").forEach((button) => {
    const key = button.dataset.key;
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      mobileKeys.add(key);
      button.classList.add("is-held");
      if (key === keyBindings.slow) callShirtPullFoul("home");
      if (localDuelMode && key === secondKeyBindings.slow) callShirtPullFoul("away");
    });
    const release = () => { mobileKeys.delete(key); button.classList.remove("is-held"); };
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
  });

  const shootButton = document.querySelector("#mobile-shoot");
  shootButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    shootButton.setPointerCapture(event.pointerId);
    touchShoot = true;
    shootButton.classList.add("is-held");
    startKick();
  });
  const releaseShoot = () => {
    if (!touchShoot) return;
    touchShoot = false;
    shootButton.classList.remove("is-held");
    releaseKick();
  };
  shootButton.addEventListener("pointerup", releaseShoot);
  shootButton.addEventListener("pointercancel", releaseShoot);
  shootButton.addEventListener("lostpointercapture", releaseShoot);

  ui.clock.textContent = formatClock(matchLength);
  syncClubChoice("home");
  syncClubChoice("away");
  syncCompetitionChoice();
  updateMatchup();
  showConfigStep(0);
  const speedInput = document.querySelector("#player-speed");
  speedInput.addEventListener("input", () => {
    playerSpeed = Number(speedInput.value) / 100;
    document.querySelector("#speed-value").textContent = `x${playerSpeed.toFixed(1)}`;
  });
  document.querySelector("#cooling-break-toggle").addEventListener("change", (event) => {
    coolingBreakEnabled = event.target.checked;
  });
  document.querySelector("#training-goal-reset-toggle").addEventListener("change", (event) => {
    trainingGoalResetEnabled = event.target.checked;
  });
  window.setInterval(() => {
    if (screen !== "menu") return;
    menuPhraseIndex = (menuPhraseIndex + 1) % menuPhrases.length;
    const phrase = document.querySelector("#menu-phrase");
    phrase.classList.remove("is-changing");
    phrase.textContent = menuPhrases[menuPhraseIndex];
    requestAnimationFrame(() => phrase.classList.add("is-changing"));
  }, 7000);
  let homeScoreFocus = false;
  window.setInterval(() => {
    homeScoreFocus = !homeScoreFocus;
    const scoreboard = document.querySelector(".match-score");
    scoreboard.classList.toggle("is-home-turn", homeScoreFocus);
    scoreboard.classList.toggle("is-away-turn", !homeScoreFocus);
  }, 1000);
  updateTeamColors();
  eventRemaining = 2.4;
  setScreen("brand");
  new ResizeObserver(resizeCanvas).observe(canvas);
  resizeCanvas();
  requestAnimationFrame(frame);
})();