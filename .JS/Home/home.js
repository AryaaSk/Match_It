"use strict";
const UpdateLevel = (levelID) => {
    const currentLevelElement = document.getElementById("currentLevel");
    currentLevelElement.innerText = levelID;
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
};
const MainHome = () => {
    UpdateLevel(CURRENTLY_SELECTED_LEVEL_ID);
    InitListeners();
};
MainHome();
