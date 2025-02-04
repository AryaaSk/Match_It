interface LeaderboardEntry {
    score: number;
}




const UpdateUserScore = (username: string, rank: null | number, score: null | number) => {
    const userScoreElement = document.getElementById("playerScore")!;
    const userRank = rank == null ? '-' : "#" + String(rank);
    const userScore = score == null ? '-' : String(Math.round(score * 10) / 10);

    userScoreElement.innerHTML = `<div></div>
                <div>${userRank}</div>
                <div>${username}</div>
                <div>${userScore}</div>
                <div></div>`;
}



const GetLeaderboard = async () => {
    //retrieve all records of current leaderboard
    const leaderboard = await FirebaseRead(`leaderboards/${DAY}`) as { [ userID: string ] : LeaderboardEntry };
    if (leaderboard == null) {
        return {};
    }
    else {
        return leaderboard;
    }
}

const SortLeaderboard = (leaderboard: { [ userID: string ] : LeaderboardEntry }): [string, LeaderboardEntry][] => {
    //we need to order leaderboard by score
    const leaderboardArray = Object.entries(leaderboard);
    leaderboardArray.sort((a, b) => b[1].score - a[1].score); //descending order
    return leaderboardArray;
}

const DisplayLeaderboard = async (leaderboardArray: [string, LeaderboardEntry][]) => {
    //retrieve displayname uuid mapping
    const displayNameMapping = await FirebaseRead(`displayNames`) as { [uuid: string]: string };

    const leaderboardList = document.getElementById("leaderboard")!;
    leaderboardList.innerHTML = "";
    
    for (const [i, pair] of leaderboardArray.entries()) {
        const listElement = document.createElement("li");
        listElement.className = "leaderboardRow";

        //try to retrieve name
        const userID = pair[0];
        const name = displayNameMapping[userID] == undefined ? userID : displayNameMapping[userID]; 
        const score = Math.round(pair[1].score * 10) / 10; //1 dp
        const rank = i + 1; //1-indexed

        listElement.innerHTML = `<div></div>
                <div>#${rank}</div>
                <div>${name}</div>
                <div>${score}</div>
                <div></div>`;
        leaderboardList.append(listElement);
    }

    //if there have been no players yet
    if (leaderboardArray.length == 0) {
        const emptyElement = document.createElement("div");
        emptyElement.className = "leaderboardRow emptyRow";
        emptyElement.innerHTML = "Nobody has played yet... You will become #1!";
        leaderboardList.append(emptyElement);
    }
}


const InitDailyChallengeListeners = (attemptsRemaining: number, userID: string) => {
    const changeDisplayNameButton = document.getElementById("changeName")!;
    changeDisplayNameButton.onclick = async () => {
        const name = prompt("New display name");
        if (name == undefined || name.replaceAll(" ", "") == "") {
            return;
        }
        await SetDisplayName(userID, name);
        location.reload(); //reload page to refresh changes
    }

    const playChallengeButton = document.getElementById("playChallenge")!;
    if (attemptsRemaining > 0) {
        playChallengeButton.innerHTML = `<span style="font-size: x-large;">Play</span> <br> <h4>${attemptsRemaining} attempt${attemptsRemaining == 1 ? '' : 's'} left</h4>`
    }
    else {
        playChallengeButton.innerHTML = `<span style="font-size: x-large;">Click for more attempts...</span>`
    }
    playChallengeButton.onclick = () => {
        if (attemptsRemaining <= 0) { //give player option to get more attempts by recruiting new players
            alert("Tap 'share link' at the bottom.\n\nYou will recieve 1 attempt for each player who clicks your link.");
            return;
        }
        location.href = "/Src/Play/play.html?dailyChallenge=true";
    }

    const shareLinkButton = document.getElementById("shareLink")!;
    shareLinkButton.onclick = () => {
        //generate link and send to shareboard
        const shareLink = BASE_URL + `/Src/DailyChallenge/dailyChallenge.html?UUID=${userID}`;
        //could also just use location.href
        if (navigator.share) {
            navigator.share({
                url: shareLink
            })
            .then(() => console.log("Shared successfully"))
            .catch((error) => console.error("Error sharing:", error));
        } else {
            alert("Web Share API not supported on this browser.");
        }
    }
}

const InitTimeLeft = () => {
    //determine number of milliseconds till next day
    const nextDay = DAY + 1;
    const nextDayMS = nextDay * 86400 * 1000;
    const timeLeftElement = document.getElementById("timeLeft")!;

    setInterval(() => {
        const timeLeftMS = nextDayMS - Date.now();
        //convert to seconds, minutes and hours
        const timeLeftSeconds = Math.floor((timeLeftMS / 1000) % 60);
        const timeLeftMinutes = Math.floor((timeLeftMS / (1000 * 60)) % 60);
        const timeLeftHours = Math.floor((timeLeftMS / (1000 * 60 * 60)));
        
        timeLeftElement.innerText = `${timeLeftHours}h ${timeLeftMinutes}m ${timeLeftSeconds}s until payout`;
    }, 1000);
}



const MainDailyChallenge = async () => {
    UUID = await GetUniqueIdentifier(false);
    await CheckForUpdate();

    //Check whether user has opened from Snapchat, and if so, tell them to open in a browser
    function OpenedFromSnapchat() {
        return /Snapchat/i.test(navigator.userAgent);
    }
    if (OpenedFromSnapchat()) {
        //prevent user from using app within snapchat's embedded webview
        //display a full screen message
        const embeddedWarning = document.getElementById("embeddedWarning")!;
        embeddedWarning.style.display = "";
        return;
    }

    //Initialise game
    //display leaderboard
    const leaderboard = await GetLeaderboard();
    const sortedLeaderboard = SortLeaderboard(leaderboard);
    await DisplayLeaderboard(sortedLeaderboard);

    console.log(sortedLeaderboard)

    //display user's position
    const displayName = await GetDisplayName(UUID);
    const rank = GetUserRank(UUID, sortedLeaderboard);
    const userScore = await GetUserScore(UUID);
    UpdateUserScore(displayName, rank, userScore);

    //check whether user has opened another user's link
    const params = new URLSearchParams(new URL(location.href).search);
    const fromUUID = params.get("UUID");
    if (fromUUID != null) {
        await HandleUserLink(fromUUID);
    }

    //reset URL UUID back to current user's
    let newParams = new URLSearchParams(window.location.search);
    newParams.set('UUID', UUID);
    history.replaceState(null, '', '?' + newParams.toString());

    //retrieve current user's attempts
    const attempts = await GetUserAttempts(UUID);

    let firstListen = true;
    FirebaseListen(`userData/${UUID}/attemptGrants/${DAY}`, () => {
        if (firstListen == true) {
            firstListen = false;
            return;
        }
        location.reload(); //reload page whenever user gets a new attempt from somebody else
    });

    setTimeout(async () => {
        //Check whether user is ranked #1, and check for communication handle
        if (rank == 1) {
            const handle = await GetUserCommunicationHandle(UUID);
            if (handle == null) { //need to get handle
                const AskForHandle = (): string => {
                    const handle = prompt("You have ranked #1. Please provide a communication method (e.g. email, phone number, instagram, etc...) so that you can be contacted if you win the prize.");
                    if (handle == undefined || handle.replaceAll(" ", "") == "") {
                        return AskForHandle();
                    }
                    return handle;
                }

                const newHandle = AskForHandle();
                await SetHandle(UUID, newHandle);
            }
        }

        //check whether user has 2 or fewer attempts, and if their name still starts with 'matchit...';
        if (attempts <= (DEFAULT_ATTEMPTS - 3) && displayName.startsWith("MatchIt")) {
            const AskForName = (): string => {
                const name = prompt("Enter your display name!");
                if (name == undefined || name.replaceAll(" ", "") == "") {
                    return AskForName();
                }
                return name;
            }

            const name = AskForName();
            await SetDisplayName(UUID, name);
            location.reload();
        }
    }, 100);

    InitDailyChallengeListeners(attempts, UUID);
    InitTimeLeft();
}
MainDailyChallenge();1