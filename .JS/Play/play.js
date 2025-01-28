"use strict";
const TIMER_DURATION = 5;
const referenceCanvas = new Canvas();
referenceCanvas.linkCanvas("referenceCanvas");
const LoadReferenceImage = (path) => {
    console.log(path);
    const img = new Image();
    img.src = path;
    img.onload = () => {
        referenceCanvas.c.drawImage(img, 0, 0, referenceCanvas.canvasWidth, referenceCanvas.canvasHeight);
    };
    /*
    sample user image (level 1)
    const dataURL = localStorage.getItem("canvasData");
    const img2 = new Image();
    img2.src = dataURL!;
    img2.onload = () => {
        userCanvas.c.clearRect(0, 0, userCanvas.canvasWidth, userCanvas.canvasHeight);
        userCanvas.c.drawImage(img2, 0, 0, 300*dpi, 300*dpi);
    }
    */
};
//user canvas controls
const userCanvas = new Canvas();
userCanvas.linkCanvas("userCanvas");
const canvasElement = userCanvas.canvas;
const InitUserCanvas = () => {
    return new Promise((resolve) => {
        let mouseDown = false;
        let firstInteractionFlag = false;
        canvasElement.onpointerdown = () => {
            if (firstInteractionFlag == false) {
                firstInteractionFlag = true;
                resolve(undefined);
            }
            mouseDown = true;
        };
        canvasElement.onpointerup = () => {
            mouseDown = false;
        };
        canvasElement.onpointermove = ($e) => {
            if (mouseDown == false) {
                return;
            }
            const [offsetX, offsetY] = [$e.offsetX, $e.offsetY];
            const [x, y] = [userCanvas.GridX(offsetX), userCanvas.GridY(offsetY)];
            userCanvas.plotPoint([x, y], "black");
        };
    });
};
const InitClearButton = () => {
    const clearButton = document.getElementById("clear");
    clearButton.onclick = () => {
        userCanvas.clearCanvas();
    };
};
//duration in seconds
const InitTimer = (duration) => {
    const timer = document.getElementById("timer");
    timer.innerText = String(duration);
};
const StartTimer = (duration) => {
    return new Promise((resolve) => {
        const timer = document.getElementById("timer");
        let timeLeft = duration;
        const interval = setInterval(() => {
            timeLeft -= 1;
            timer.innerText = String(timeLeft);
            if (timeLeft == 0) {
                clearInterval(interval);
                setTimeout(() => {
                    resolve(undefined);
                }, 300);
            }
        }, 1000);
    });
};
//popup management
const background = document.getElementById("resultsPopupBackground");
const popup = document.getElementById("resultsPopup");
const feedbackCanvas = new Canvas();
feedbackCanvas.linkCanvas("feedbackCanvas");
const ShowPopup = () => {
    background.style.display = "";
    popup.style.display = "";
};
const HidePopup = () => {
    background.style.display = "none";
    popup.style.display = "none";
};
const InitPopupListeners = () => {
    const playAgainButton = document.getElementById("playAgain");
    playAgainButton.onclick = () => {
        location.reload();
    };
    const backToHomeButton = document.getElementById("backToHome");
    backToHomeButton.onclick = () => {
        location.href = "/Src/Home/home.html";
    };
};
const loaderWrapper = document.getElementById("loaderWrapper");
const results = document.getElementById("results");
const loaderProgress = document.getElementById("loaderProgress");
const ShowLoader = () => {
    loaderWrapper.style.display = "";
    results.style.display = "none";
    feedbackCanvas.canvas.style.display = "none";
    //TODO: find asynchronous work around for loader progress
    loaderProgress.innerText = "";
};
const HideLoader = () => {
    loaderWrapper.style.display = "none";
    results.style.display = "";
    feedbackCanvas.canvas.style.display = "";
};
const feedbackElement = document.getElementById("feedback");
const GenerateFeedback = async (referenceCanvas, userCanvas, progressCallback) => {
    const referenceCanvasRaw = SimplifyRawImage(Array.from(referenceCanvas.c.getImageData(0, 0, referenceCanvas.canvasWidth, referenceCanvas.canvasHeight).data), CANVAS_SIZE * dpi);
    const userCanvasRaw = SimplifyRawImage(Array.from(userCanvas.c.getImageData(0, 0, userCanvas.canvasWidth, userCanvas.canvasHeight).data), CANVAS_SIZE * dpi);
    const [maxDx, maxDy, maxSimilarity] = await FindMaximiumSimilarity(referenceCanvasRaw, userCanvasRaw, CANVAS_SIZE, CANVAS_SIZE, progressCallback);
    const similarityLabel = document.getElementById("similarityLabel");
    similarityLabel.innerText = `Similarity: ${Math.round(maxSimilarity)}`;
    DISPLAY_OVERLAY(maxDx, maxDy, referenceCanvas, userCanvas, feedbackCanvas);
    console.log(`Maximum similarity: ${maxSimilarity} at dx = ${maxDx} dy = ${maxDy}`);
    //curate feedback
    let feedback = "";
    //save this to LevelData
    const currentHighestSimilarty = LEVEL_PROGRESS[CURRENTLY_SELECTED_LEVEL_ID].highestSimilarity;
    if (maxSimilarity > currentHighestSimilarty) {
        LEVEL_PROGRESS[CURRENTLY_SELECTED_LEVEL_ID].highestSimilarity = maxSimilarity;
        feedback += "NEW HIGH SCORE!\n\n";
    }
    if (maxSimilarity > PASS_THRESHOLD) {
        //unlock next level
        const levelIDs = Object.keys(LEVEL_PROGRESS);
        const currentLevelIDIndex = levelIDs.indexOf(CURRENTLY_SELECTED_LEVEL_ID);
        if (currentLevelIDIndex < (levelIDs.length - 1)) {
            const nextLevelID = levelIDs[currentLevelIDIndex + 1];
            LEVEL_PROGRESS[nextLevelID].unlocked = true;
            feedback += `You passed and unlocked level ${nextLevelID}\n\n`;
        }
        else {
            feedback += `You've completed all the levels\n\n`;
        }
    }
    if (currentHighestSimilarty < PASS_THRESHOLD && maxSimilarity < PASS_THRESHOLD) { //new pass
        feedback += `You need ${PASS_THRESHOLD - Math.round(maxSimilarity)} more similarity to pass!\n\n`;
    }
    else if (currentHighestSimilarty > PASS_THRESHOLD) {
        feedback += `Try again to improve your high score, currently at ${Math.round(currentHighestSimilarty)}\n\n`;
    }
    SaveLevelProgress(LEVEL_PROGRESS);
    feedbackElement.innerText = feedback;
};
const MainPlay = async () => {
    const currentLevel = LEVELS[CURRENTLY_SELECTED_LEVEL_ID];
    LoadReferenceImage(currentLevel.referenceImagePath);
    InitTimer(TIMER_DURATION);
    InitClearButton();
    HidePopup();
    HideLoader();
    InitPopupListeners();
    await InitUserCanvas(); //waits for first click
    await StartTimer(TIMER_DURATION);
    //once timer is done, we need to evaluate similarity
    //we will display feedback in a popup screen
    ShowPopup();
    ShowLoader();
    //need to treat progress updates separately from similarity algorithm, as otherwise JS will wait for entire algorithm to finish before updating progress
    setTimeout(async () => {
        await GenerateFeedback(referenceCanvas, userCanvas, (progress) => {
            return new Promise((resolve) => {
                console.log(Math.round(progress * 100));
                //does not work, as DOM updates are queued until all currently executing processes are completed
                //loaderProgress.innerText = `${Math.round(progress*100)}%`;
                resolve(undefined);
            });
        });
        HideLoader();
    }, 100);
};
MainPlay();
