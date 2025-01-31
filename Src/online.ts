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