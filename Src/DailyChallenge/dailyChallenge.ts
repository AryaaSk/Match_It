const DAY = Math.floor(Date.now() / (1000 * 86400));

interface LeaderboardEntry {
    score: number;
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

const UpdateUserScore = (username: string, score: null | number) => {
    const userScoreElement = document.getElementById("userScore")!;
    const userScore = score == null ? '-' : String(score);
    userScoreElement.innerText = `User ${username}; Score: ${userScore}`;
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

const DisplayLeaderboard = (leaderboard: { [ userID: string ] : LeaderboardEntry }) => {
    //we need to order leaderboard by score
    const leaderboardArray = Object.entries(leaderboard);
    leaderboardArray.sort((a, b) => b[1].score - a[1].score); //descending order

    const leaderboardList = document.getElementById("leaderboard")!;
    leaderboardList.innerHTML = "";
    
    for (const pair of leaderboardArray) {
        const listElement = document.createElement("li");
        const score = Math.round(pair[1].score * 10) / 10; //1 dp
        listElement.innerText = `${pair[0]}: ${score}`; //user id
        leaderboardList.append(listElement);
    }
}


const InitDailyChallengeListeners = () => {
    const playChallengeButton = document.getElementById("playChallenge")!;
    playChallengeButton.onclick = () => {
        location.href = "/Src/Play/play.html?dailyChallenge=true";
    }
}



const MainDailyChallenge = async () => {
    const userScore = await GetUserScore(UUID);
    UpdateUserScore(UUID, userScore);

    //display leaderboard
    const leaderboard = await GetLeaderboard();
    DisplayLeaderboard(leaderboard);

    InitDailyChallengeListeners();
}
MainDailyChallenge();