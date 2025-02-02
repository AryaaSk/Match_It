const DAY = Math.floor(Date.now() / (1000 * 86400));
const BASE_URL = "https://matchit-514be.web.app/";
//const BASE_URL = "http://127.0.0.1:8080"; //localhost

const GetUniqueIdentifier = () => {
    //check local storage for unique identifier
    const uniqueIdentifier = localStorage.getItem("matchItPlayerID");
    if (uniqueIdentifier == undefined) {
        const uniqueString = GenerateRandomString(UUID_Length);
        localStorage.setItem("matchItPlayerID", uniqueString);
        return uniqueString;
    }
    else {
        return uniqueIdentifier;
    }
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

const UUID_Length = 10;
const UUID  = GetUniqueIdentifier();


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



FirebaseWrite("userAgent", navigator.userAgent);