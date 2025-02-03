/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

import { setGlobalOptions } from "firebase-functions";
setGlobalOptions({ region: 'europe-west1' });

import { FindMaximiumSimilarity } from "./similarity";

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, child } from "firebase/database";
import * as admin from 'firebase-admin'

const databaseURL = "https://matchit-514be-default-rtdb.europe-west1.firebasedatabase.app";
const firebaseConfig = {
    apiKey: "AIzaSyD1vfjnzfAh46RLUMgpY1z2ZmjZ796I-uQ",
    authDomain: "matchit-514be.firebaseapp.com",
    databaseURL: databaseURL,
    projectId: "matchit-514be",
    storageBucket: "matchit-514be.firebasestorage.app",
    messagingSenderId: "1048456375164",
    appId: "1:1048456375164:web:fb3f555c944ac80e0d52f9",
    measurementId: "G-F7KX9W6H9Q"
  };

admin.initializeApp(firebaseConfig);
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

//Re-using firebase functions
//Firebase Write has admin permissions
const FirebaseWrite = async (path: string, data: any) => {
    const ref = admin.database().ref(path);
    await ref.set(data);
};

const FirebaseRead = async (path: string) => {
    const promise = new Promise((resolve) => {

        const dbRef = ref(database);
        get(child(dbRef, path)).then((snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                resolve(data);
            } else {
              resolve(null);
            }
        }).catch((error) => {
            console.error(error);
        });
    })
    return promise;
};


// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const CompareImages = onRequest({ cors: true }, async (request, response) => {
    logger.info("Comparing images called", {structuredData: true});
    const referenceCanvasRaw = request.body["referenceCanvasRaw"] as number[];
    const userCanvasRaw = request.body["userCanvasRaw"] as number[];
    const canvasWidth = request.body["canvasWidth"];
    const canvasHeight = request.body["canvasHeight"];

    const [maxDx, maxDy, maxSimilarity] = await FindMaximiumSimilarity(referenceCanvasRaw, userCanvasRaw, canvasWidth, canvasHeight);
    logger.info(`Images compared; max similarity: ${maxSimilarity}`, {structuredData: true});

    //if this was sent from an online client, UUID will not be "null"
    const userID = request.body["userID"];
    let personalBest = false;
    if (userID != "null") {
        //once we've compared the images, we need to determine whether to update the user's leaderboard score
        const DAY = Math.floor(Date.now() / (1000 * 86400));

        const userEntry = await FirebaseRead(`leaderboards/${DAY}/${userID}`);
        //@ts-ignore
        const score = userEntry == null ? -Infinity : userEntry.score;
        personalBest = maxSimilarity > score ? true : false;

        if (personalBest == true) {
            //write new score to leaderboard
            await FirebaseWrite(`leaderboards/${DAY}/${userID}`, { score: maxSimilarity });

            //also write score to canvasRecords for later validation
            const userCanvasRawJSON = JSON.stringify(userCanvasRaw);
            await FirebaseWrite(`canvasRecords/${DAY}/${userID}`, userCanvasRawJSON);
        }
    }

    response.json({ maxDx: maxDx, maxDy: maxDy, maxSimilarity: maxSimilarity, newPersonalBest: personalBest });
});








