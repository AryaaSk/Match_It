"use strict";
const DAY = Math.floor(Date.now() / (1000 * 86400));
const GetDisplayName = async (userID) => {
    const displayName = await FirebaseRead(`displayNames/${userID}/displayName`);
    if (displayName == null) {
        const randomName = GenerateRandomName(); //if we can't find name, generate random name
        await SetDisplayName(userID, randomName);
        return randomName;
    }
    else {
        return displayName;
    }
};
const SetDisplayName = async (userID, name) => {
    await FirebaseWrite(`displayNames/${userID}`, { displayName: name });
};
const GenerateRandomName = () => {
    const randomNumber = String(Math.floor(Math.random() * 1000));
    return `MatchIt${randomNumber}`;
};
const GetUserScore = async (userID) => {
    //retrieve user's score
    const userEntry = await FirebaseRead(`leaderboards/${DAY}/${userID}`);
    if (userEntry == null) {
        return null;
    }
    else {
        //@ts-expect-error
        return userEntry.score;
    }
};
const UpdateUserScore = (username, score) => {
    const userScoreElement = document.getElementById("userScore");
    const userScore = score == null ? '-' : String(score);
    userScoreElement.innerText = `${username}; Score: ${userScore}`;
};
const GetLeaderboard = async () => {
    //retrieve all records of current leaderboard
    const leaderboard = await FirebaseRead(`leaderboards/${DAY}`);
    if (leaderboard == null) {
        return {};
    }
    else {
        return leaderboard;
    }
};
const DisplayLeaderboard = async (leaderboard) => {
    //we need to order leaderboard by score
    const leaderboardArray = Object.entries(leaderboard);
    leaderboardArray.sort((a, b) => b[1].score - a[1].score); //descending order
    //retrieve displayname uuid mapping
    const displayNameMapping = await FirebaseRead(`displayNames`);
    const leaderboardList = document.getElementById("leaderboard");
    leaderboardList.innerHTML = "";
    for (const pair of leaderboardArray) {
        const listElement = document.createElement("li");
        //try to retrieve name
        const userID = pair[0];
        const name = displayNameMapping[userID] == undefined ? userID : displayNameMapping[userID].displayName;
        const score = Math.round(pair[1].score * 10) / 10; //1 dp
        listElement.innerText = `${name}: ${score}`;
        leaderboardList.append(listElement);
    }
};
const InitDailyChallengeListeners = () => {
    const changeDisplayNameButton = document.getElementById("changeName");
    changeDisplayNameButton.onclick = async () => {
        const name = prompt("New display name");
        if (name == undefined || name.replaceAll(" ", "") == "") {
            return;
        }
        await SetDisplayName(UUID, name);
        location.reload(); //reload page to refresh changes
    };
    const playChallengeButton = document.getElementById("playChallenge");
    playChallengeButton.onclick = () => {
        location.href = "/Src/Play/play.html?dailyChallenge=true";
    };
};
const InitTimeLeft = () => {
    //determine number of milliseconds till next day
    const nextDay = DAY + 1;
    const nextDayMS = nextDay * 86400 * 1000;
    const timeLeftElement = document.getElementById("timeLeft");
    setInterval(() => {
        const timeLeftMS = nextDayMS - Date.now();
        //convert to seconds, minutes and hours
        const timeLeftSeconds = Math.floor((timeLeftMS / 1000) % 60);
        const timeLeftMinutes = Math.floor((timeLeftMS / (1000 * 60)) % 60);
        const timeLeftHours = Math.floor((timeLeftMS / (1000 * 60 * 60)));
        timeLeftElement.innerText = `Time left: ${timeLeftHours}h ${timeLeftMinutes}m ${timeLeftSeconds}s`;
    }, 1000);
};
const MainDailyChallenge = async () => {
    //display user's position
    const displayName = await GetDisplayName(UUID);
    const userScore = await GetUserScore(UUID);
    UpdateUserScore(displayName, userScore);
    //display leaderboard
    const leaderboard = await GetLeaderboard();
    await DisplayLeaderboard(leaderboard);
    InitDailyChallengeListeners();
    InitTimeLeft();
};
MainDailyChallenge();
