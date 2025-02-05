const DAY = Math.floor(Date.now() / (1000 * 86400));
const BASE_URL = "https://matchit-514be.web.app/";
//const BASE_URL = "http://127.0.0.1:8080"; //localhost
const DEFAULT_ATTEMPTS = 5;
let UUID: string = "null"; //initialise in main

const GetUniqueIdentifier = (useCache: boolean): Promise<string> => {
    return new Promise((resolve) => {
        //check local storage for unique identifier;
        const uniqueIdentifier = localStorage.getItem("matchItPlayerID");
        if (uniqueIdentifier == undefined || uniqueIdentifier.length != 10) { //need to get rid of the Fingerprint-generated ids
            //user has not entered main page yet, so redirect back
            //location.href = "/Src/DailyChallenge/dailyChallenge.html";
            const userID = GenerateRandomString(10);
            localStorage.setItem("matchItPlayerID", userID); //update local storage
            resolve(userID);
        }
        else {
            resolve(uniqueIdentifier);
        }
    });

    /*
    return new Promise((resolve) => {
        if (useCache == false) {
            // Import FingerprintJS using dynamic import
            //@ts-ignore
            const fpPromise = import('https://openfpcdn.io/fingerprintjs/v4')
            .then((FingerprintJS: any) => FingerprintJS.load());

            // Usage of the visitor identifier
            fpPromise
            .then((fp: any) => fp.get())
            .then((result: any) => {
                const visitorId: string = result.visitorId;
                localStorage.setItem("matchItPlayerID", visitorId); //update local storage
                resolve(visitorId);
            })
            .catch((error: any) => {
            console.error('Failed to get visitor identifier:', error);
        });
        }
        else {
            //check local storage for unique identifier;
            const uniqueIdentifier = localStorage.getItem("matchItPlayerID");
            if (uniqueIdentifier == undefined) {
                //user has not entered main page yet, so redirect back
                location.href = "/Src/DailyChallenge/dailyChallenge.html";
            }
            else {
                resolve(uniqueIdentifier);
            }
        }
    })
    */
}

const GenerateRandomString = (length: number) => {
    const characters = "0abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789";
    let randomString = "";
    for (let _ = 0; _ != length; _ += 1) {
        const randomIndex = Math.floor(Math.random()*characters.length);
        randomString += characters[randomIndex];
    }
    return randomString;
}


//firebase functions
declare const firebase: any;

//Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD1vfjnzfAh46RLUMgpY1z2ZmjZ796I-uQ",
    authDomain: "matchit-514be.firebaseapp.com",
    databaseURL: "https://matchit-514be-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "matchit-514be",
    storageBucket: "matchit-514be.firebasestorage.app",
    messagingSenderId: "1048456375164",
    appId: "1:1048456375164:web:fb3f555c944ac80e0d52f9",
    measurementId: "G-F7KX9W6H9Q"
};
firebase.initializeApp(firebaseConfig);
const DATABASE = firebase.database();


const FirebaseWrite = (path: string, data: any) => {
    const promise = new Promise((resolve) => {
        const ref = firebase.database().ref(path);
        ref.set(data).then(() => { resolve("Added data"); });
    })
    return promise;
};

const FirebasePush = (path: string, data: any) => { //DOESN'T WORK PROPERLY, IT KEEPS ADDING SOME RANDOM CHARACTERS
    const promise = new Promise((resolve) => {
        const ref = firebase.database().ref(path);
        ref.push(data).then(() => { resolve("Appened data"); });
    })
    return promise;
};

const FirebaseRemove = (path: string) => {
    const promise = new Promise((resolve) => {
        const ref = firebase.database().ref(path);
        ref.remove().then(() => { resolve("Removed data"); })
    })
    return promise;
};

const FirebaseRead = async (path: string) => {
    const promise = new Promise((resolve) => {
        const ref = firebase.database().ref(path);
        ref.once('value').then((snapshot: any) => {
            const data = snapshot.val();
            resolve(data);
        });
    })
    return promise;
};

const FirebaseListen = (path: string, callback: (data: any) => void) => {
    const ref = firebase.database().ref(path);
    ref.on('value', (snapshot: any) => {
        const data = snapshot.val();
        callback(data);
    });
};














//Functions
const GetDisplayName = async (userID: string) => {
    const displayName = await FirebaseRead(`displayNames/${userID}`)! as string;
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
    await FirebaseWrite(`displayNames/${userID}`, name);
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

const GetUserAttempts = async (userID: string) => {
    const attempts = await FirebaseRead(`userData/${userID}/attempts/${DAY}`)! as number;
    if (attempts == null) { //attempts has not been initialised for current day
        await SetAttempts(userID, DEFAULT_ATTEMPTS);
        return DEFAULT_ATTEMPTS;
    }
    else {
        return attempts;
    }
}
const SetAttempts = async (userID: string, attempts: number) => {
    await FirebaseWrite(`userData/${userID}/attempts/${DAY}`, attempts);
}


const HandleUserLink = async (fromUUID: string) => {
    if (fromUUID == UUID) {
        return; //link is only valid on day it was provided
    }

    //ensure current user has not already granted fromUser an attempt on today's day
    const alreadyGranted = await FirebaseRead(`userData/${fromUUID}/attemptGrants/${DAY}/${UUID}`);
    if (alreadyGranted == true) { //i.e. something exists at this address, so do nothing
        return;
    }

    //otherwise, we add an attempt to the fromUUID
    const currentAttempts = await GetUserAttempts(fromUUID);
    const newAttempts = currentAttempts + 1;
    await SetAttempts(fromUUID, newAttempts);

    //add a flag in attempt grants for current DAY
    await FirebaseWrite(`userData/${fromUUID}/attemptGrants/${DAY}/${UUID}`, true);
}

const GetUserCommunicationHandle = async (userID: string): Promise<string | null> => {
    const handle = await FirebaseRead(`userData/${userID}/communicationHandle`) as string | null;
    return handle;
}

const SetHandle = async (userID: string, handle: string) => {
    await FirebaseWrite(`userData/${userID}/communicationHandle`, handle);
}



//Check for update = true, and if so, use location.reload(true)
const CheckForUpdate = async () => {
    const update = await FirebaseRead(`userData/${UUID}/update`);
    if (update == true) {
        //set update to false and reload
        await FirebaseWrite(`userData/${UUID}/update`, false);
        //@ts-ignore
        location.reload(true)
    }
}

const UpdateAllUsers = async () => {
    const userData = await FirebaseRead(`userData`) as { [uuid: string] : any };
    for (const userID in userData) {
        await FirebaseWrite(`userData/${userID}/update`, true);
    }
}




//Party Mode
const GetCurrentPartyCode = async (userID: string): Promise<string | null> => {
    const partyCode = await FirebaseRead(`userData/${userID}/currentPartyCode`) as string | null;

    if (partyCode != null) {
        //check if party actually exists;
        const partyExists = await FirebaseRead(`parties/${partyCode}`);
        if (partyExists == null) {
            //reset user's party
            await FirebaseWrite(`userData/${userID}/currentPartyCode`, null);
            return null;
        }

        //check if user is actually in party
        const userInParty = await FirebaseRead(`parties/${partyCode!}/playersInGame/${userID}`);
        if (userInParty == null) {
            //add user to party
            await FirebaseWrite(`parties/${partyCode!}/playersInGame/${userID}`, false);
        }
    }

    return partyCode
}

const CreateParty = async (userID: string) => {
    const partyID = GenerateRandomString(6).toLowerCase(); //change all letters to lowercase

    //change users party code, and create entry under parties/...
    await FirebaseWrite(`userData/${userID}/currentPartyCode`, partyID);
    await FirebaseWrite(`parties/${partyID}`, null);
    await FirebaseWrite(`parties/${partyID}/joinable`, true);
    await FirebaseWrite(`parties/${partyID}/playersInGame/${userID}`, false);
}
const JoinParty = async (userID: string, partyID: string) => {
    //check if party exists
    const partyExists = await FirebaseRead(`parties/${partyID}`);
    if (partyExists == null) {
        return false;
    }

    //check if party is joinable
    const joinable = await CheckPartyJoinable(partyID);
    if (joinable == false) {
        return false;
    }

    //change user's party code and add user as an entry under parties/...
    await FirebaseWrite(`userData/${userID}/currentPartyCode`, partyID);
    await FirebaseWrite(`parties/${partyID}/playersInGame/${userID}`, false);
    return true;
}
const LeaveParty = async (userID: string, partyID: string) => {
    await FirebaseWrite(`userData/${userID}/currentPartyCode`, null);
    await FirebaseWrite(`parties/${partyID}/playersInGame/${userID}`, null);

    //check if there are any players left; if not, then delete party
    const playersLeft = await FirebaseRead(`parties/${partyID}/playersInGame`);
    console.log(playersLeft);
    if (playersLeft == null) {
        await FirebaseWrite(`parties/${partyID}`, null);
    }
}

const CheckAllPlayersinLobby = async (partyID: string) => {
    const playersInGame = await FirebaseRead(`parties/${partyID}/playersInGame`) as { [uuid: string] : boolean };
    //if all players are not in game, then we return true; otherwise return false
    for (const uuid in playersInGame) {
        const inGame = playersInGame[uuid];
        if (inGame == true) {
            return false;
        }
    }

    return true;
}
const PutAllPlayersInGame = async (partyID: string) => {
    //update all player's in game status to true
    const playersInGame = await FirebaseRead(`parties/${partyID}/playersInGame`) as { [uuid: string] : boolean };
    for (const uuid in playersInGame) {
        playersInGame[uuid] = true;
    }
    
    //reset scores
    await FirebaseWrite(`parties/${partyID}/playersScores`, null);

    await FirebaseWrite(`parties/${partyID}/playersInGame`, playersInGame);
}



const RetrievePlayerNames = async (playerIDList: { [uuid: string] : boolean }) => {
    const playerNameList: { [uuid: string] : string } = {};
    for (const uuid in playerIDList) {
        const displayName = await GetDisplayName(uuid);
        playerNameList[uuid] = displayName;
    }

    return playerNameList;
}
const RetrievePlayerScores = async (playerIDNames: { [uuid: string] : string }, partyID: string) => {
    //for each uuid, try to get the score
    const playerScores: { uuid: string, name: string, score: number | null }[] = [];
    for (const userID in playerIDNames) {
        const score = await FirebaseRead(`parties/${partyID}/playersScores/${userID}`) as number | null;
        playerScores.push({ uuid: userID, name: playerIDNames[userID], score: score });
    }

    return playerScores;
}

const CheckPartyJoinable = async (partyID: string) => {
    const joinable = await FirebaseRead(`parties/${partyID}/joinable`)!;
    if (joinable == true) {
        return true;
    }
    else {
        return false;
    }
}


const SavePartyScore = async (userID: string, partyID: string, score: number) => {
    await FirebaseWrite(`parties/${partyID}/playersScores/${userID}`, score);
}
const ResetUserInGame = async (userID: string, partyID: string) => {
    await FirebaseWrite(`parties/${partyID}/playersInGame/${userID}`, false);
}