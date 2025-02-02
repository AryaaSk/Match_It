"use strict";
const UpdateDiamonds = (diamonds) => {
    const diamondStoreElement = document.getElementById("diamondStore");
    diamondStoreElement.innerText = String(diamonds);
};
const UpdateLevel = (levelID) => {
    const currentLevelElement = document.getElementById("currentLevel");
    const currentHighestSimilarty = Math.round(LEVEL_PROGRESS[levelID].highestSimilarity);
    currentLevelElement.innerHTML = `<h1>${levelID}</h1><h6>(${currentHighestSimilarty}%)</h6><br>`;
};
const InitListeners = () => {
    const levelSelectButton = document.getElementById("selectLevel");
    levelSelectButton.onclick = () => {
        location.href = "/Src/LevelSelect/levelSelect.html";
    };
    const playButton = document.getElementById("play");
    playButton.onclick = () => {
        location.href = "/Src/Play/play.html";
    };
    const dailyChallenge = document.getElementById("dailyChallenge");
    dailyChallenge.onclick = () => {
        location.href = `/Src/DailyChallenge/dailyChallenge.html?UUID=${UUID}`;
    };
};
const MainHome = () => {
    UpdateDiamonds(DIAMONDS);
    UpdateLevel(CURRENTLY_SELECTED_LEVEL_ID);
    InitListeners();
};
MainHome();
