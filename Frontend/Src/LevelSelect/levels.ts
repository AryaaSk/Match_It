//file storing all levels
const LEVEL_PROGRESS_SAVE_KEY = "levelProgress";
const CURRENT_SELECTED_LEVEL_SAVE_KEY = "currentlySelectedLevel";

interface Level { //don't need to store level ID within level object itself
    referenceImagePath: string;   
}

interface LevelProgress {
    unlocked: boolean;
    highestSimilarity: number; //maximum is 1
}



//Persistance
const GenerateFreshLevelProgress = (levels: { [levelID: string]: Level }) => {
    const levelProgress: { [levelID: string]: LevelProgress } = {};
    for (const levelID in levels) {
        levelProgress[levelID] = { unlocked: false, highestSimilarity: 0 }; //-infinity
    }

    //unlock first level
    const firstLevelID = Object.keys(levelProgress)[0];
    levelProgress[firstLevelID].unlocked = true;

    return levelProgress
}

const RetrieveLevelProgress = () => {
    const json = localStorage.getItem(LEVEL_PROGRESS_SAVE_KEY);
    
    if (json == undefined) { //generate fresh level progress
        const freshProgress = GenerateFreshLevelProgress(LEVELS);
        SaveLevelProgress(freshProgress);
        return GenerateFreshLevelProgress(LEVELS)
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
}

const GetCurrentlySelectedLevel = () => {
    const levelID = localStorage.getItem(CURRENT_SELECTED_LEVEL_SAVE_KEY);
    const firstLevelID = Object.keys(LEVELS)[0];
    if (levelID == undefined) {
        return firstLevelID;
    }
    else {
        //check whether level is actually unlocked (validation)
        if (LEVEL_PROGRESS[levelID].unlocked == false) {
            return firstLevelID
        }
        else {
            return levelID;
        }
    }
}

const SaveLevelProgress = (levelProgress: { [levelID: string]: LevelProgress }) => {
    const json = JSON.stringify(levelProgress);
    localStorage.setItem(LEVEL_PROGRESS_SAVE_KEY, json);
}

const SelectLevel = (levelID: string) => {
    CURRENTLY_SELECTED_LEVEL_ID = levelID;
    localStorage.setItem(CURRENT_SELECTED_LEVEL_SAVE_KEY, CURRENTLY_SELECTED_LEVEL_ID);
}




//Hardcoding levels into game
const LEVELS: { [ levelID: string ]: Level } = {
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
    "10": {
        referenceImagePath: "/Assets/References/Cresent.png"
    },
    "11": {
        referenceImagePath: "/Assets/References/Lightning.png"
    },
    "12": {
        referenceImagePath: "/Assets/References/PointyStar.png"
    },
    "13": {
        referenceImagePath: "/Assets/References/Mug.png"
    },
    "14": {
        referenceImagePath: "/Assets/References/Corner.png"
    }
}


//retrieve level progress from local storage, and hold in global variable
let LEVEL_PROGRESS: { [levelID: string]: LevelProgress } = RetrieveLevelProgress();
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
}

const SaveDiamonds = (diamonds: number) => {
    localStorage.setItem(DIAMOND_STORAGE_KEY, String(diamonds));
}

let DIAMONDS = GetDiamonds();

