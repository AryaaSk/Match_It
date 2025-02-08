"use strict";
const TIMER_DURATION = 5;
let MODE = "singleplayer";
let PARTY_ID = "";
//3 canvas setup
const userCanvas = new Canvas();
const referenceCanvas = new Canvas();
const feedbackCanvas = new Canvas();
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
const InitUserCanvas = () => {
    const canvasElement = userCanvas.canvas;
    return new Promise((resolve) => {
        let mouseDown = false;
        let [prevX, prevY] = [0, 0];
        let firstInteractionFlag = false;
        canvasElement.onpointerdown = ($e) => {
            if (firstInteractionFlag == false) {
                firstInteractionFlag = true;
                resolve(undefined);
            }
            const [offsetX, offsetY] = [$e.offsetX, $e.offsetY];
            const [x, y] = [userCanvas.GridX(offsetX), userCanvas.GridY(offsetY)];
            mouseDown = true;
            [prevX, prevY] = [x, y];
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
            userCanvas.drawLine([prevX, prevY], [x, y], "black", 10);
            [prevX, prevY] = [x, y];
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
    playAgainButton.onpointerdown = () => {
        location.reload();
    };
    const backToHomeButton = document.getElementById("backToHome");
    backToHomeButton.onpointerdown = () => {
        location.href = "home.html";
    };
    const backToLeaderboardButton = document.getElementById("backToLeaderboard");
    backToLeaderboardButton.onpointerdown = () => {
        location.href = `dailyChallenge.html`;
    };
    const backToPartyButton = document.getElementById("backToLobby");
    backToPartyButton.onpointerdown = () => {
        ResetUserInGame(UUID, PARTY_ID);
        location.href = `party.html`;
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
const singleplayerControls = document.getElementById("singlePlayerControls");
const dailyChallengeControls = document.getElementById("dailyChallengeControls");
const partyControls = document.getElementById("partyControls");
const ShowSingleplayerControls = () => {
    singleplayerControls.style.display = "";
    dailyChallengeControls.style.display = "none";
    partyControls.style.display = "none";
};
const ShowDailyChallengeControls = (attemptsRemaining) => {
    singleplayerControls.style.display = "none";
    dailyChallengeControls.style.display = "";
    partyControls.style.display = "none";
    //show play again button if attemptsRemaining > 0
    const playAgainButton = document.getElementById("playAgainLeaderboard");
    if (attemptsRemaining <= 0) {
        playAgainButton.style.display = "none";
    }
    playAgainButton.innerHTML = `<span style="font-size: x-large;">Play Again</span> <br> <h4>${attemptsRemaining} attempt${attemptsRemaining == 1 ? '' : 's'} left</h4>`;
    playAgainButton.onpointerdown = () => {
        location.reload();
    };
};
const ShowPartyControls = () => {
    singleplayerControls.style.display = "none";
    dailyChallengeControls.style.display = "none";
    partyControls.style.display = "";
};
const feedbackElement = document.getElementById("feedback");
const GenerateFeedback = async (referenceCanvas, userCanvas, progressCallback) => {
    //instead of trying to downscale canvas images manually, we can just let the Canvas API do the work and render both canvases to 250x250 hidden canvases
    const scaledReferenceCanvasData = Array.from(GetRescaledCanvasData(referenceCanvas, 1 / dpi));
    const scaledUserCanvasData = Array.from(GetRescaledCanvasData(userCanvas, 1 / dpi));
    const referenceCanvasRaw = ExtractAlphaValues(scaledReferenceCanvasData);
    const userCanvasRaw = ExtractAlphaValues(scaledUserCanvasData);
    //const [maxDx, maxDy, maxSimilarity] = await FindMaximiumSimilarity(referenceCanvasRaw, userCanvasRaw, CANVAS_SIZE, CANVAS_SIZE, progressCallback);
    //utilise cloud function
    //http://127.0.0.1:5001/matchit-514be/europe-west1/CompareImages
    //https://europe-west1-matchit-514be.cloudfunctions.net/CompareImages
    const userID = MODE == "daily challenge" ? UUID : ""; //don't want to update leaderboard if we are in party mode
    const response = await fetch("https://europe-west1-matchit-514be.cloudfunctions.net/CompareImages", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "referenceCanvasRaw": referenceCanvasRaw,
            "userCanvasRaw": userCanvasRaw,
            "canvasWidth": CANVAS_SIZE,
            "canvasHeight": CANVAS_SIZE,
            "userID": userID
        })
    });
    const responseJSON = await response.json();
    const maxDx = responseJSON["maxDx"];
    const maxDy = responseJSON["maxDy"];
    const maxSimilarity = responseJSON["maxSimilarity"];
    const newPersonalBest = responseJSON["newPersonalBest"];
    const similarityLabel = document.getElementById("similarityLabel");
    similarityLabel.innerText = `Similarity: ${Math.round(maxSimilarity)}`;
    DISPLAY_OVERLAY(maxDx, maxDy, referenceCanvas, userCanvas, feedbackCanvas);
    console.log(`Maximum similarity: ${maxSimilarity} at dx = ${maxDx} dy = ${maxDy}`);
    //curate feedback
    let feedback = "";
    if (MODE == "singleplayer") {
        //save this to LevelData
        const currentHighestSimilarty = LEVEL_PROGRESS[CURRENTLY_SELECTED_LEVEL_ID].highestSimilarity;
        if (maxSimilarity > currentHighestSimilarty) {
            LEVEL_PROGRESS[CURRENTLY_SELECTED_LEVEL_ID].highestSimilarity = maxSimilarity;
            SaveLevelProgress(LEVEL_PROGRESS);
            feedback += "NEW HIGH SCORE!\n\n";
        }
        //new pass
        if (maxSimilarity > PASS_THRESHOLD && currentHighestSimilarty < PASS_THRESHOLD) {
            //unlock next level
            const levelIDs = Object.keys(LEVEL_PROGRESS);
            const currentLevelIDIndex = levelIDs.indexOf(CURRENTLY_SELECTED_LEVEL_ID);
            if (currentLevelIDIndex < (levelIDs.length - 1)) {
                const nextLevelID = levelIDs[currentLevelIDIndex + 1];
                if (LEVEL_PROGRESS[nextLevelID].unlocked == true) { //use already purchased next level
                    feedback += `You passed, and have already unlocked level ${nextLevelID}\n\n`;
                }
                else {
                    LEVEL_PROGRESS[nextLevelID].unlocked = true;
                    feedback += `You passed and unlocked level ${nextLevelID}\n\n`;
                }
            }
            else {
                feedback += `You've completed all the levels\n\n`;
            }
            SaveLevelProgress(LEVEL_PROGRESS);
            //provide 1 diamond
            feedback += "You earned 1 diamond\n\n";
            DIAMONDS += DIAMONDS_EARNED_PER_PASS;
            SaveDiamonds(DIAMONDS);
        }
        //detect if user hasn't passed yet
        else if (maxSimilarity < PASS_THRESHOLD && currentHighestSimilarty < PASS_THRESHOLD) {
            feedback += `You need ${PASS_THRESHOLD - Math.round(maxSimilarity)} more similarity to pass!\n\n`;
        }
        else if (currentHighestSimilarty > PASS_THRESHOLD) {
            //have already handled if maxSimilarity > currentHighestSimilarity (high score)
            if (maxSimilarity < currentHighestSimilarty) {
                feedback += `Try again to improve your high score, currently at ${Math.round(currentHighestSimilarty)}\n\n`;
            }
        }
    }
    else if (MODE == "daily challenge") {
        //reduce number of attempts by one
        const numberOfAttempts = await GetUserAttempts(UUID);
        if (numberOfAttempts <= 0) {
            feedback += "Round doesn't count as you don't have any attempts remaining.\n\n";
        }
        else {
            const newNumberOfAttempts = numberOfAttempts - 1;
            await SetAttempts(UUID, newNumberOfAttempts);
            //encoding canvas data
            //const userCanvasRawCanvasDataJSON = JSON.stringify(userCanvasRawCanvasData);
            //const width = CANVAS_SIZE * dpi;
            if (newPersonalBest) { //update database
                //await FirebaseWrite(`leaderboards/${day}/${UUID}`, { score: maxSimilarity, canvasData: { userCanvasRaw: userCanvasRawCanvasDataJSON, width: width } });
                //await FirebaseWrite(`leaderboards/${DAY}/${UUID}`, { score: maxSimilarity }); //canvasdata seems too long for firebase to support
                feedback += "NEW PERSONAL BEST!\n\n";
                feedback += "Go back to the leaderboard to find out where you placed.\n\n";
            }
            else {
                feedback += "You didn't beat your high score this time, keep trying!\n\n";
            }
        }
    }
    else if (MODE == "party") {
        //retrieve party information and save score to party
        await SavePartyScore(UUID, PARTY_ID, maxSimilarity);
    }
    feedbackElement.innerText = feedback;
};
const Display1XCanvasRecord = async (day, userID) => {
    const canvasRecordJSON = await FirebaseRead(`canvasRecords/${day}/${userID}`);
    const canvasRecord = JSON.parse(canvasRecordJSON);
    console.log(userCanvas.canvasWidth);
    userCanvas.clearCanvas();
    for (let i = 0; i < canvasRecord.length; i += 1) {
        const x = i % CANVAS_SIZE; //don't have to worry about DPI (function designed for 1x)
        const y = Math.floor(i / CANVAS_SIZE);
        if (canvasRecord[i] == 1) {
            userCanvas.c.fillRect(x, y, 1, 1);
            //userCanvas.plotPoint([x, y], "black", undefined, false, 1);
        }
    }
};
const MainPlay = async () => {
    //detect whether this is in single player mode or daily challenge
    const params = new URLSearchParams(new URL(location.href).search);
    const dailyChallenge = params.get("dailyChallenge");
    const partyMode = params.get("partyMode");
    if (dailyChallenge == "true") {
        //load daily challenge; otherwise load regular level (stored under CURRENTLY_SELECTED_LEVEL)  
        MODE = "daily challenge";
        UUID = await GetUniqueIdentifier(true); //load unique identifier
        await CheckForUpdate();
    }
    if (partyMode == "true") {
        MODE = "party";
        UUID = await GetUniqueIdentifier(true); //load unique identifier
        await CheckForUpdate();
        const partyID = await GetCurrentPartyCode(UUID);
        if (partyID == null) { //user was actually not in a party?
            location.href = "party.html"; //send back to party screen
        }
        PARTY_ID = partyID;
    }
    if (MODE == "singleplayer") {
        const currentLevel = LEVELS[CURRENTLY_SELECTED_LEVEL_ID];
        LoadReferenceImage(currentLevel.referenceImagePath);
    }
    else if (MODE == "daily challenge") {
        //load image stored under Assets//DailyChallenge/${DAY}.png
        const day = Math.floor(Date.now() / (1000 * 86400));
        const dailyChallengeImagePath = `Assets//DailyChallenge/${day}.png`;
        LoadReferenceImage(dailyChallengeImagePath);
    }
    else if (MODE == "party") {
        //find level id from parties/{partyID}/levelID
        const levelID = await FirebaseRead(`parties/${PARTY_ID}/levelID`);
        const level = LEVELS[levelID];
        LoadReferenceImage(level.referenceImagePath);
    }
    InitTimer(TIMER_DURATION);
    InitClearButton();
    HidePopup();
    HideLoader();
    InitPopupListeners();
    if (MODE == "singleplayer") {
        ShowSingleplayerControls();
    }
    else if (MODE == "daily challenge") {
        //user will only see this button once the round ends, at which point the number of attempts would've decreased by 1
        //however we initialise the play again button at the start of the round, hence why we subtract 1
        const attemptsLeft = await GetUserAttempts(UUID) - 1;
        ShowDailyChallengeControls(attemptsLeft);
    }
    else if (MODE == "party") {
        ShowPartyControls();
    }
    //await Display1XCanvasRecord(20125, "");
    //console.log(await GetUserCommunicationHandle(""));
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
//Wait till CSS styles (i.e. dimensions) are fully applied before initialising canvases
window.addEventListener("DOMContentLoaded", () => {
    requestAnimationFrame(() => {
        referenceCanvas.linkCanvas("referenceCanvas");
        userCanvas.linkCanvas("userCanvas");
        feedbackCanvas.linkCanvas("feedbackCanvas");
        MainPlay();
    });
});
