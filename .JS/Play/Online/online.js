"use strict";
const UUID_Length = 10;
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
//firebase functions
