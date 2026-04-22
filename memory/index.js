// Hafıza Oyunu - 1 veya 2 Kişilik (Hamle sayısı 2 kişilikte kaldırıldı)
let gameMode = "single";
let cardCount = 24;
let cards = [];
let flippedCards = [];
let lockBoard = false;
let moves = 0;
let timer = 0;
let sScore = 0; 
let timerInterval = null;
let gameStarted = false;
let matchedCount = 0;
let totalPairs = 0;
// 2 kişilik değişkenler
let currentPlayer = 1;
let playerScores = { 1: 0, 2: 0 };

// DOM elementleri
const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");
const gameBoard = document.getElementById("gameBoard");
const moveCountSpan = document.getElementById("moveCount");        // single için
const timerSpan = document.getElementById("timer");                // single için
const singleScoreSpan = document.getElementById("singleScore");    // tek kişilik puan
const doubleTimerSpan = document.getElementById("doubleTimer");
const resetGameBtn = document.getElementById("resetGameBtn");
const backToMenuBtn = document.getElementById("backToMenuBtn");
const winMessageDiv = document.getElementById("winMessage");
const playerInfo = document.getElementById("playerInfo");
const player1Info = document.getElementById("player1Info");
const player2Info = document.getElementById("player2Info");
const player1ScoreSpan = document.getElementById("player1Score");
const player2ScoreSpan = document.getElementById("player2Score");
const singleStats = document.getElementById("singleStats");
const doubleStats = document.getElementById("doubleStats");

// Emoji havuzu
const emojis = [
    "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
    "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐴", "🐺",
    "🐝", "🐛", "🦋", "🐌", "🐞", "🐜", "🦟", "🦗", "🕷️", "🦂",
    "🐢", "🐍", "🦎", "🐙", "🦑", "🦐", "🦀", "🐡", "🐠", "🐟",
    "🐬", "🐳", "🐋", "🦈", "🦭", "🐊", "🐅", "🐆", "🦓", "🦍",
    "👷‍♀️","🦕","🌯","🍸","🍻"
];

// Grid yapılandırması
function getGridConfig(cardCount) {
    if (cardCount === 24) {
        return { rows: 4, cols: 6, cardSize: 90, gap: 8, fontSize: "2rem" };
    } else if (cardCount === 50) {
        return { rows: 5, cols: 10, cardSize: 70, gap: 6, fontSize: "1.6rem" };
    } else { // 98 kart
        return { rows: 7, cols: 14, cardSize: 55, gap: 5, fontSize: "1.2rem" };
    }
}

// Kartları oluştur ve karıştır
function generateCards(count) {
    const pairs = Math.floor(count / 2);
    let values = [];
    for (let i = 0; i < pairs; i++) {
        const emoji = emojis[i % emojis.length];
        values.push(emoji, emoji);
    }
    for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [values[i], values[j]] = [values[j], values[i]];
    }
    return values.map((value, index) => ({
        id: index,
        value: value,
        flipped: false,
        matched: false
    }));
}

// Oyun tahtasını render et
function renderBoard() {
    const config = getGridConfig(cardCount);
    gameBoard.style.display = "grid";
    gameBoard.style.gridTemplateColumns = `repeat(${config.cols}, ${config.cardSize}px)`;
    gameBoard.style.gap = `${config.gap}px`;
    gameBoard.style.justifyContent = "center";
    gameBoard.innerHTML = "";
    
    cards.forEach((card, index) => {
        const cardDiv = document.createElement("div");
        cardDiv.classList.add("card");
        cardDiv.style.width = `${config.cardSize}px`;
        cardDiv.style.height = `${config.cardSize}px`;
        cardDiv.style.fontSize = config.fontSize;
        
        if (card.flipped || card.matched) {
            cardDiv.classList.add("flipped");
            cardDiv.textContent = card.value;
        } else {
            cardDiv.textContent = "?";
        }
        if (card.matched) {
            cardDiv.classList.add("matched");
        }
        cardDiv.addEventListener("click", () => onCardClick(index));
        gameBoard.appendChild(cardDiv);
    });
}

// Tüm istatistikleri güncelle
function updateStatsUI() {
    if (gameMode === "single") {
        moveCountSpan.innerText = moves;
        timerSpan.innerText = timer;
        singleScoreSpan.innerText = sScore;
    } else {
        // İki kişilikte sadece süre güncellenir
        doubleTimerSpan.innerText = timer;
    }
}

// Kart tıklama mantığı
function onCardClick(index) {
    if (lockBoard) return;
    if (!gameStarted) {
        startTimer();
        gameStarted = true;
    }
    
    const card = cards[index];
    if (card.flipped || card.matched) return;
    if (flippedCards.length === 2) return;
    
    card.flipped = true;
    flippedCards.push(index);
    renderBoard();
    
    if (flippedCards.length === 2) {
        lockBoard = true;
        moves++;
        updateStatsUI();
        
        const card1 = cards[flippedCards[0]];
        const card2 = cards[flippedCards[1]];
        
        if (card1.value === card2.value) {
            // Eşleşme başarılı
            card1.matched = true;
            card2.matched = true;
            matchedCount++;
            
            if (gameMode === "single") {
                sScore++;
                updateStatsUI();
            } else {
                if (currentPlayer === 1) {
                    playerScores[1]++;
                } else {
                    playerScores[2]++;
                }
                updateTwoPlayerUI();
            }
            
            flippedCards = [];
            lockBoard = false;
            renderBoard();
            
            if (matchedCount === totalPairs) {
                endGame();
            }
        } else {
            // Eşleşme başarısız
            setTimeout(() => {
                cards[flippedCards[0]].flipped = false;
                cards[flippedCards[1]].flipped = false;
                flippedCards = [];
                lockBoard = false;
                renderBoard();
                
                if (gameMode === "twoPlayer") {
                    currentPlayer = currentPlayer === 1 ? 2 : 1;
                    updateTwoPlayerUI();
                }
            }, 700);
        }
    }
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timer++;
        updateStatsUI();
    }, 1000);
}

function updateTwoPlayerUI() {
    player1ScoreSpan.innerText = playerScores[1];
    player2ScoreSpan.innerText = playerScores[2];
    
    if (currentPlayer === 1) {
        player1Info.classList.add("active-player");
        player2Info.classList.remove("active-player");
    } else {
        player1Info.classList.remove("active-player");
        player2Info.classList.add("active-player");
    }
}

// Konfeti efekti
function fireConfetti() {
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
    });
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6, x: 0.2 }
    });
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6, x: 0.8 }
    });
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.4 }
    });
    
    // Ekstra konfeti yağmuru
    setTimeout(() => {
        confetti({
            particleCount: 100,
            spread: 100,
            origin: { y: 0.5 }
        });
    }, 200);
    setTimeout(() => {
        confetti({
            particleCount: 100,
            spread: 100,
            origin: { y: 0.5, x: 0.3 }
        });
    }, 400);
    setTimeout(() => {
        confetti({
            particleCount: 100,
            spread: 100,
            origin: { y: 0.5, x: 0.7 }
        });
    }, 600);
}

function endGame() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    let message = "";
    if (gameMode === "single") {
        message = `🎉 Tebrikler! ${moves} hamlede ve ${timer} saniyede bitirdin! 🎉`;
    } else {
        if (playerScores[1] > playerScores[2]) {
            message = `🏆 OYUNU KAZANAN: OYUNCU 1! (${playerScores[1]} - ${playerScores[2]}) 🏆`;
        } else if (playerScores[2] > playerScores[1]) {
            message = `🏆 OYUNU KAZANAN: OYUNCU 2! (${playerScores[2]} - ${playerScores[1]}) 🏆`;
        } else {
            message = `🤝 BERABERE! (${playerScores[1]} - ${playerScores[2]}) 🤝`;
        }
    }
    
    // Konfeti patlat
    fireConfetti();
    
    winMessageDiv.innerText = message;
    winMessageDiv.classList.remove("hidden");
}

function resetGame() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    totalPairs = cardCount / 2;
    cards = generateCards(cardCount);
    flippedCards = [];
    lockBoard = false;
    gameStarted = false;
    matchedCount = 0;
    moves = 0;
    timer = 0;
    sScore = 0;
    winMessageDiv.classList.add("hidden");
    
    if (gameMode === "single") {
        updateStatsUI();
    } else {
        currentPlayer = 1;
        playerScores = { 1: 0, 2: 0 };
        updateStatsUI();
        updateTwoPlayerUI();
    }
    
    renderBoard();
}

function startGame() {
    totalPairs = cardCount / 2;
    cards = generateCards(cardCount);
    flippedCards = [];
    lockBoard = false;
    gameStarted = false;
    matchedCount = 0;
    moves = 0;
    timer = 0;
    sScore = 0;
    winMessageDiv.classList.add("hidden");
    
    if (gameMode === "single") {
        singleStats.classList.remove("hidden");
        doubleStats.classList.add("hidden");
        playerInfo.classList.add("hidden");
        updateStatsUI();
    } else {
        singleStats.classList.add("hidden");
        doubleStats.classList.remove("hidden");
        playerInfo.classList.remove("hidden");
        currentPlayer = 1;
        playerScores = { 1: 0, 2: 0 };
        updateStatsUI();
        updateTwoPlayerUI();
    }
    
    renderBoard();
    startScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
}

function backToMenu() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    startScreen.classList.remove("hidden");
    gameScreen.classList.add("hidden");
}

// EVENT LISTENER'lar
document.getElementById("singlePlayerBtn").addEventListener("click", () => {
    document.getElementById("singlePlayerBtn").classList.add("active");
    document.getElementById("twoPlayerBtn").classList.remove("active");
    gameMode = "single";
});

document.getElementById("twoPlayerBtn").addEventListener("click", () => {
    document.getElementById("singlePlayerBtn").classList.remove("active");
    document.getElementById("twoPlayerBtn").classList.add("active");
    gameMode = "twoPlayer";
});

document.querySelectorAll("[data-cards]").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll("[data-cards]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        cardCount = parseInt(btn.getAttribute("data-cards"));
    });
});

document.getElementById("startGameBtn").addEventListener("click", startGame);
resetGameBtn.addEventListener("click", resetGame);
backToMenuBtn.addEventListener("click", backToMenu);