const DAY = Math.floor(Date.now() / (1000 * 86400));

interface LeaderboardEntry {
    score: number;
    canvasData: {
        userCanvasRaw: string;
        width: number;
    }
}


const GetDisplayName = async (userID: string) => {
    const displayName = await FirebaseRead(`displayNames/${userID}/displayName`)! as string;
    if (displayName == null) {
        const randomName = GenerateRandomName(); //if we can't find name, generate random name
        await SetDisplayName(userID, randomName);
        return randomName;
    }
    else {
        return displayName;
    }
}

const SetDisplayName = async (userID: string, name: string) => {
    await FirebaseWrite(`displayNames/${userID}`, { displayName: name });
}

const GenerateRandomName = () => {
    const randomNumber = String(Math.floor(Math.random() * 1000));
    return `MatchIt${randomNumber}`;
}



const GetUserScore = async (userID: string): Promise<null | number> => {
    //retrieve user's score
    const userEntry = await FirebaseRead(`leaderboards/${DAY}/${userID}`);
    if (userEntry == null) {
        return null;
    }
    else {
        //@ts-expect-error
        return userEntry.score;
    }
}
const GetUserRank  = (userID: string, sortedLeaderboard: [string, LeaderboardEntry][]): null | number => {
    //find index of user in sorted leaderboard (return null if not found)
    //implement using linear search
    for (let i = 0; i != sortedLeaderboard.length; i += 1) {
        if (sortedLeaderboard[i][0] == userID) {
            return (i + 1); //1-indexed
        }
    }

    return null;
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
    const displayNameMapping = await FirebaseRead(`displayNames`) as { [uuid: string]: { displayName: string } };

    const leaderboardList = document.getElementById("leaderboard")!;
    leaderboardList.innerHTML = "";
    
    for (const [i, pair] of leaderboardArray.entries()) {
        const listElement = document.createElement("li");
        listElement.className = "leaderboardRow";

        //try to retrieve name
        const userID = pair[0];
        const name = displayNameMapping[userID] == undefined ? userID :displayNameMapping[userID].displayName; 
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


const InitDailyChallengeListeners = () => {
    const changeDisplayNameButton = document.getElementById("changeName")!;
    changeDisplayNameButton.onclick = async () => {
        const name = prompt("New display name");
        if (name == undefined || name.replaceAll(" ", "") == "") {
            return;
        }

        await SetDisplayName(UUID, name);
        location.reload(); //reload page to refresh changes
    }

    const playChallengeButton = document.getElementById("playChallenge")!;
    playChallengeButton.onclick = () => {
        location.href = "/Src/Play/play.html?dailyChallenge=true";
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
        
        timeLeftElement.innerText = `${timeLeftHours}h ${timeLeftMinutes}m ${timeLeftSeconds}s`;
    }, 1000);
}



const MainDailyChallenge = async () => {
    //display leaderboard
    const leaderboard = await GetLeaderboard();
    const sortedLeaderboard = SortLeaderboard(leaderboard);
    await DisplayLeaderboard(sortedLeaderboard);

    //display user's position
    const displayName = await GetDisplayName(UUID);
    const rank = GetUserRank(UUID, sortedLeaderboard);
    const userScore = await GetUserScore(UUID);
    UpdateUserScore(displayName, rank, userScore);

    InitDailyChallengeListeners();
    InitTimeLeft();
}
MainDailyChallenge();