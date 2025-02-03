"use strict";
//file storing all levels
const LEVEL_PROGRESS_SAVE_KEY = "levelProgress";
const CURRENT_SELECTED_LEVEL_SAVE_KEY = "currentlySelectedLevel";
//Persistance
const GenerateFreshLevelProgress = (levels) => {
    const levelProgress = {};
    for (const levelID in levels) {
        levelProgress[levelID] = { unlocked: false, highestSimilarity: 0 }; //-infinity
    }
    //unlock first level
    const firstLevelID = Object.keys(levelProgress)[0];
    levelProgress[firstLevelID].unlocked = true;
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
                levelProgress[levelID] = { unlocked: false, highestSimilarity: 0 };
            }
        }
        return levelProgress;
    }
};
const GetCurrentlySelectedLevel = () => {
    const levelID = localStorage.getItem(CURRENT_SELECTED_LEVEL_SAVE_KEY);
    const firstLevelID = Object.keys(LEVELS)[0];
    if (levelID == undefined) {
        return firstLevelID;
    }
    else {
        //check whether level is actually unlocked (validation)
        if (LEVEL_PROGRESS[levelID].unlocked == false) {
            return firstLevelID;
        }
        else {
            return levelID;
        }
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
        referenceImagePath: "/Assets/References/Circle.png"
    },
    "2": {
        referenceImagePath: "/Assets/References/Square.png"
    },
    "3": {
        referenceImagePath: "/Assets/References/Cloud.png"
    },
    "4": {
        referenceImagePath: "/Assets/References/Oval.png"
    },
    "5": {
        referenceImagePath: "/Assets/References/Cuboid.png"
    },
    "6": {
        referenceImagePath: "/Assets/References/Triangle.png"
    },
    "7": {
        referenceImagePath: "/Assets/References/Superman.png"
    },
    "8": {
        referenceImagePath: "/Assets/References/Umbrella.png"
    },
    "9": {
        referenceImagePath: "/Assets/References/Star.png"
    },
};
//retrieve level progress from local storage, and hold in global variable
let LEVEL_PROGRESS = RetrieveLevelProgress();
let CURRENTLY_SELECTED_LEVEL_ID = GetCurrentlySelectedLevel();
const PASS_THRESHOLD = 50;
//Diamond storage
const DIAMOND_STORAGE_KEY = "diamonds";
const DIAMONDS_EARNED_PER_PASS = 1;
const DIAMOND_LEVEL_COST = 2;
const GetDiamonds = () => {
    const diamondsString = localStorage.getItem(DIAMOND_STORAGE_KEY);
    if (diamondsString == undefined) {
        //use has never saved diamond store before
        localStorage.setItem(DIAMOND_STORAGE_KEY, "0");
        return 0;
    }
    else {
        const diamonds = Number(diamondsString);
        return diamonds;
    }
};
const SaveDiamonds = (diamonds) => {
    localStorage.setItem(DIAMOND_STORAGE_KEY, String(diamonds));
};
let DIAMONDS = GetDiamonds();
