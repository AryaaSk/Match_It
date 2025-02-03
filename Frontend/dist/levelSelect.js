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
            //check if level is unlocked or not
            if (LEVEL_PROGRESS[levelID].unlocked == false) {
                //give user the option to purchase level for 2 diamonds
                if (DIAMONDS < DIAMOND_LEVEL_COST) {
                    alert(`You currently only have ${DIAMONDS} diamond${DIAMONDS == 1 ? '' : 's'} available, but need at least ${DIAMOND_LEVEL_COST} diamonds to purchase this level.`);
                    return; //do not allow user to buy level if they have insufficient diamonds
                }
                const confirm = window.confirm(`Are you sure you want to buy this level for ${DIAMOND_LEVEL_COST} diamonds.\n\nYou currently have ${DIAMONDS} diamond${DIAMONDS == 1 ? '' : 's'} available.`);
                if (confirm == true) {
                    DIAMONDS -= DIAMOND_LEVEL_COST;
                    SaveDiamonds(DIAMONDS);
                    LEVEL_PROGRESS[levelID].unlocked = true;
                    SaveLevelProgress(LEVEL_PROGRESS);
                    InitLevels(LEVELS); //reset page
                }
            }
            else {
                //select level, and navigate back to home
                SelectLevel(levelID);
                location.href = "home.html";
            }
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
