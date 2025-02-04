"use strict";
const GetCurrentPartyCode = async (userID) => {
    const partyCode = await FirebaseRead(`userData/${userID}/currentPartyCode`);
    if (partyCode != null) {
        //check if party actually exists;
        const partyExists = await FirebaseRead(`parties/${partyCode}`);
        if (partyExists == null) {
            //reset user's party
            await FirebaseWrite(`userData/${userID}/currentPartyCode`, null);
            return null;
        }
        //check if user is actually in party
        const userInParty = await FirebaseRead(`parties/${partyCode}/${userID}`);
        if (userInParty == null) {
            //add user to party
            await FirebaseWrite(`parties/${partyCode}/playerList/${userID}`, true);
        }
    }
    return partyCode;
};
const CreateParty = async (userID) => {
    const partyID = GenerateRandomString(6).toLowerCase(); //change all letters to lowercase
    //change users party code, and create entry under parties/...
    await FirebaseWrite(`userData/${userID}/currentPartyCode`, partyID);
    await FirebaseWrite(`parties/${partyID}`, null);
    await FirebaseWrite(`parties/${partyID}/joinable`, true);
    await FirebaseWrite(`parties/${partyID}/playerList/${userID}`, true);
};
const JoinParty = async (userID, partyID) => {
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
    await FirebaseWrite(`parties/playerList/${partyID}/${userID}`, true);
    return true;
};
const LeaveParty = async (userID, partyID) => {
    await FirebaseWrite(`userData/${userID}/currentPartyCode`, null);
    await FirebaseWrite(`parties/${partyID}/playerList/${userID}`, null);
    //check if there are any players left; if not, then delete party
    const playersLeft = await FirebaseRead(`parties/${partyID}/playersList`);
    if (playersLeft == null) {
        await FirebaseWrite(`parties/${partyID}`, null);
    }
};
const RetrievePlayerNames = async (playerIDList) => {
    const playerNameList = {};
    for (const uuid in playerIDList) {
        const displayName = await GetDisplayName(uuid);
        playerNameList[uuid] = displayName;
    }
    return playerNameList;
};
const CheckPartyJoinable = async (partyID) => {
    const joinable = await FirebaseRead(`parties/${partyID}/joinable`);
    if (joinable == true) {
        return true;
    }
    else {
        return false;
    }
};
//HTML functions
const noParty = document.getElementById("noParty");
const inParty = document.getElementById("inParty");
const ShowNoParty = () => {
    noParty.style.display = "";
    inParty.style.display = "none";
};
const ShowInParty = () => {
    noParty.style.display = "none";
    inParty.style.display = "";
};
const partyIDElement = document.getElementById("partyID");
const UpdatePartyID = (partyID) => {
    partyIDElement.innerText = `Party ID: ${partyID}`;
};
const joinableElement = document.getElementById("joinable");
const UpdateJoinable = (joinable) => {
    joinableElement.innerText = `Joinable: ${joinable}`;
};
const InitialisePartyListeners = (userID, partyID) => {
    const createPartyButton = document.getElementById("createParty");
    createPartyButton.onclick = async () => {
        await CreateParty(userID);
        location.reload();
    };
    const joinPartyButton = document.getElementById("joinParty");
    joinPartyButton.onclick = async () => {
        const partyID = prompt("Party ID");
        if (partyID == undefined || partyID.replaceAll(" ", "") == "") {
            return;
        }
        const success = await JoinParty(userID, partyID);
        if (success == false) {
            alert("Invalid Party ID or party is currently in game");
        }
        else {
            location.reload();
        }
    };
    const leavePartyButton = document.getElementById("leaveParty");
    leavePartyButton.onclick = async () => {
        await LeaveParty(userID, partyID); //can assume partyID is not null if user can click on leave party button
        location.reload();
    };
};
const playerListElement = document.getElementById("playerList");
const UpdatePlayerNames = (playerList) => {
    playerListElement.innerHTML = "";
    for (const uuid in playerList) {
        const listElement = document.createElement("li");
        const name = playerList[uuid];
        listElement.innerText = name;
        playerListElement.append(listElement);
    }
};
const PartyMain = async () => {
    UUID = await GetUniqueIdentifier(false);
    await CheckForUpdate();
    //Check whether user has opened from Snapchat, and if so, tell them to open in a browser
    function OpenedFromSnapchat() {
        return /Snapchat/i.test(navigator.userAgent);
    }
    if (OpenedFromSnapchat()) {
        //prevent user from using app within snapchat's embedded webview
        //display a full screen message
        const embeddedWarning = document.getElementById("embeddedWarning");
        embeddedWarning.style.display = "";
        return;
    }
    //Check whether user is currently in a party
    const partyCode = await GetCurrentPartyCode(UUID);
    InitialisePartyListeners(UUID, partyCode);
    if (partyCode == null) {
        ShowNoParty();
    }
    else {
        ShowInParty();
        UpdatePartyID(partyCode);
        const joinable = await CheckPartyJoinable(partyCode);
        UpdateJoinable(joinable);
        //constantly update whenever a new user joins
        FirebaseListen(`parties/${partyCode}/playerList`, async (playerIDList) => {
            const playerNames = await RetrievePlayerNames(playerIDList);
            UpdatePlayerNames(playerNames);
        });
    }
};
PartyMain();
