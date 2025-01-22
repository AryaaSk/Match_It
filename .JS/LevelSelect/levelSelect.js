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
ResizeGrid(5);
