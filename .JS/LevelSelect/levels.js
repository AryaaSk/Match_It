"use strict";
//file storing all levels
const LEVEL_PROGRESS_SAVE_KEY = "levelProgress";
const CURRENT_SELECTED_LEVEL_SAVE_KEY = "currentlySelectedLevel";
//Persistance
const GenerateFreshLevelProgress = (levels) => {
    const levelProgress = {};
    for (const levelID in levels) {
        levelProgress[levelID] = { unlocked: false, highestSimilarity: -10000 }; //-infinity
    }
    return levelProgress;
};
const RetrieveLevelProgress = () => {
    const json = localStorage.getItem(LEVEL_PROGRESS_SAVE_KEY);
    if (json == undefined) { //generate fresh level progress
        const freshProgress = GenerateFreshLevelProgress(LEVELS);
        SaveLevelProgress(freshProgress);
        return GenerateFreshLevelProgress(LEVELS);
    }
    else {
        //check if there is progress for all levels
        const levelProgress = JSON.parse(json);
        for (const levelID in LEVELS) {
            if (levelProgress[levelID] == undefined) {
                //generate fresh progress for this level
                levelProgress[levelID] = { unlocked: false, highestSimilarity: -10000 };
            }
        }
        return levelProgress;
    }
};
const GetCurrentlySelectedLevel = () => {
    const levelID = localStorage.getItem(CURRENT_SELECTED_LEVEL_SAVE_KEY);
    if (levelID == undefined) {
        const firstLevelID = Object.keys(LEVELS)[0];
        return firstLevelID;
    }
    else {
        return levelID;
    }
};
const SaveLevelProgress = (levelProgress) => {
    const json = JSON.stringify(levelProgress);
    localStorage.setItem(LEVEL_PROGRESS_SAVE_KEY, json);
};
const SelectLevel = (levelID) => {
    CURRENTLY_SELECTED_LEVEL_ID = levelID;
    localStorage.setItem(CURRENT_SELECTED_LEVEL_SAVE_KEY, CURRENTLY_SELECTED_LEVEL_ID);
};
//Hardcoding levels into game
const LEVELS = {
    "1": {
        referenceImagePath: "/Src/References/Circle.png"
    },
    "2": {
        referenceImagePath: "/Src/References/Corner.png"
    }
};
//retrieve level progress from local storage, and hold in global variable
let LEVEL_PROGRESS = RetrieveLevelProgress();
let CURRENTLY_SELECTED_LEVEL_ID = GetCurrentlySelectedLevel();
