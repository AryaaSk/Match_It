"use strict";
//to center collection view
const ResizeGrid = (numCells) => {
    //Add grid columns to the Activity Grid
    let levelWidth = Number(getComputedStyle(document.body).getPropertyValue('--activityWidth').slice(0, -2));
    if (levelWidth == 0 || levelWidth == undefined) {
        levelWidth = 100; //safe guard
    }
    let gridColumns = Math.floor((window.innerWidth - 50) / levelWidth);
    if (gridColumns > numCells) {
        gridColumns = numCells;
    }
    let repeatProperty = `repeat(${gridColumns}, ${levelWidth}px)`;
    document.getElementById("main").style.gridTemplateColumns = repeatProperty;
};
const InitLevels = (levels) => {
    const main = document.getElementById("main");
    main.innerHTML = "";
    for (const levelID in levels) {
        const levelElement = document.createElement("div");
        const unlocked = LEVEL_PROGRESS[levelID].unlocked;
        const similarity = LEVEL_PROGRESS[levelID].highestSimilarity;
        levelElement.innerHTML = `${levelID}<br><h6>${unlocked == true ? `${Math.round(similarity)}%` : ''}</h6>`;
        //set colour based on level status
        if (unlocked == false) {
            levelElement.className = "locked";
        }
        else if (similarity >= PASS_THRESHOLD) {
            levelElement.className = "passed";
        }
        levelElement.onclick = () => {
            //ensure level is unlocked
            if (LEVEL_PROGRESS[levelID].unlocked == false) {
                return;
            }
            //select level, and navigate back to home
            SelectLevel(levelID);
            location.href = "/Src/Home/home.html";
        };
        main.append(levelElement);
    }
};
const MainLevels = () => {
    //levels are initialised in level.ts
    ResizeGrid(Object.keys(LEVELS).length);
    InitLevels(LEVELS);
    console.log(LEVEL_PROGRESS);
};
MainLevels();
