"use strict";
const DAY = Math.floor(Date.now() / (1000 * 86400));
const BASE_URL = "https://matchit-514be.web.app/";
//const BASE_URL = "http://127.0.0.1:8080"; //localhost
const DEFAULT_ATTEMPTS = 5;
let UUID = "null"; //initialise in main
const GetUniqueIdentifier = (useCache) => {
    return new Promise((resolve) => {
        //check local storage for unique identifier;
        const uniqueIdentifier = localStorage.getItem("matchItPlayerID");
        if (uniqueIdentifier == undefined || uniqueIdentifier.length != 10) { //need to get rid of the Fingerprint-generated ids
            //user has not entered main page yet, so redirect back
            //location.href = "dailyChallenge.html";
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
                location.href = "dailyChallenge.html";
            }
            else {
                resolve(uniqueIdentifier);
            }
        }
    })
    */
};
const GenerateRandomString = (length) => {
    const characters = "0abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789";
    let randomString = "";
    for (let _ = 0; _ != length; _ += 1) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomString += characters[randomIndex];
    }
    return randomString;
};
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
const FirebaseWrite = (path, data) => {
    const promise = new Promise((resolve) => {
        const ref = firebase.database().ref(path);
        ref.set(data).then(() => { resolve("Added data"); });
    });
    return promise;
};
const FirebasePush = (path, data) => {
    const promise = new Promise((resolve) => {
        const ref = firebase.database().ref(path);
        ref.push(data).then(() => { resolve("Appened data"); });
    });
    return promise;
};
const FirebaseRemove = (path) => {
    const promise = new Promise((resolve) => {
        const ref = firebase.database().ref(path);
        ref.remove().then(() => { resolve("Removed data"); });
    });
    return promise;
};
const FirebaseRead = async (path) => {
    const promise = new Promise((resolve) => {
        const ref = firebase.database().ref(path);
        ref.once('value').then((snapshot) => {
            const data = snapshot.val();
            resolve(data);
        });
    });
    return promise;
};
const FirebaseListen = (path, callback) => {
    const ref = firebase.database().ref(path);
    ref.on('value', (snapshot) => {
        const data = snapshot.val();
        callback(data);
    });
};
//Functions
const GetDisplayName = async (userID) => {
    const displayName = await FirebaseRead(`displayNames/${userID}`);
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
    await FirebaseWrite(`displayNames/${userID}`, name);
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
const GetUserRank = (userID, sortedLeaderboard) => {
    //find index of user in sorted leaderboard (return null if not found)
    //implement using linear search
    for (let i = 0; i != sortedLeaderboard.length; i += 1) {
        if (sortedLeaderboard[i][0] == userID) {
            return (i + 1); //1-indexed
        }
    }
    return null;
};
const GetUserAttempts = async (userID) => {
    const attempts = await FirebaseRead(`userData/${userID}/attempts/${DAY}`);
    if (attempts == null) { //attempts has not been initialised for current day
        await SetAttempts(userID, DEFAULT_ATTEMPTS);
        return DEFAULT_ATTEMPTS;
    }
    else {
        return attempts;
    }
};
const SetAttempts = async (userID, attempts) => {
    await FirebaseWrite(`userData/${userID}/attempts/${DAY}`, attempts);
};
const HandleUserLink = async (fromUUID) => {
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
};
const GetUserCommunicationHandle = async (userID) => {
    const handle = await FirebaseRead(`userData/${userID}/communicationHandle`);
    return handle;
};
const SetHandle = async (userID, handle) => {
    await FirebaseWrite(`userData/${userID}/communicationHandle`, handle);
};
//Check for update = true, and if so, use location.reload(true)
const CheckForUpdate = async () => {
    const update = await FirebaseRead(`userData/${UUID}/update`);
    if (update == true) {
        //set update to false and reload
        await FirebaseWrite(`userData/${UUID}/update`, false);
        //@ts-ignore
        location.reload(true);
    }
};
const UpdateAllUsers = async () => {
    const userData = await FirebaseRead(`userData`);
    for (const userID in userData) {
        await FirebaseWrite(`userData/${userID}/update`, true);
    }
};
