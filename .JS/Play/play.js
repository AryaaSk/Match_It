"use strict";
const LoadReferenceImage = (path) => {
    const referenceCanvas = new Canvas();
    referenceCanvas.linkCanvas("referenceCanvas");
    const img = new Image();
    img.src = path;
    img.onload = () => {
        referenceCanvas.c.drawImage(img, 0, 0, referenceCanvas.canvasWidth, referenceCanvas.canvasHeight);
    };
};
//user canvas controls
let mousedown = false;
const MainPlay = () => {
    const currentLevel = LEVELS[CURRENTLY_SELECTED_LEVEL_ID];
    LoadReferenceImage(currentLevel.referenceImagePath);
};
MainPlay();
