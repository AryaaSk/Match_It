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
        const userInParty = await FirebaseRead(`parties/${partyCode}/playersInGame/${userID}`);
        if (userInParty == null) {
            //add user to party
            await FirebaseWrite(`parties/${partyCode}/playersInGame/${userID}`, false);
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
    await FirebaseWrite(`parties/${partyID}/playersInGame/${userID}`, false);
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
    await FirebaseWrite(`parties/${partyID}/playersInGame/${userID}`, false);
    return true;
};
const LeaveParty = async (userID, partyID) => {
    await FirebaseWrite(`userData/${userID}/currentPartyCode`, null);
    await FirebaseWrite(`parties/${partyID}/playersInGame/${userID}`, null);
    //check if there are any players left; if not, then delete party
    const playersLeft = await FirebaseRead(`parties/${partyID}/playersInGame`);
    console.log(playersLeft);
    if (playersLeft == null) {
        await FirebaseWrite(`parties/${partyID}`, null);
    }
};
const CheckAllPlayersinLobby = async (partyID) => {
    const playersInGame = await FirebaseRead(`parties/${partyID}/playersInGame`);
    //if all players are not in game, then we return true; otherwise return false
    for (const uuid in playersInGame) {
        const inGame = playersInGame[uuid];
        if (inGame == true) {
            return false;
        }
    }
    return true;
};
const PutAllPlayersInGame = async (partyID) => {
    //update all player's in game status to true
    const playersInGame = await FirebaseRead(`parties/${partyID}/playersInGame`);
    for (const uuid in playersInGame) {
        playersInGame[uuid] = true;
    }
    await FirebaseWrite(`parties/${partyID}/playersInGame`, playersInGame);
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
    playButton.onclick = async () => {
        await PutAllPlayersInGame(partyID);
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
const playButton = document.getElementById("playGame");
const ShowPlayButton = () => {
    playButton.style.display = "";
};
const HidePlayButton = () => {
    playButton.style.display = "none";
};
const GoToGame = () => {
    location.href = "play.html?partyMode=true";
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
        //constantly update whenever a new user joins or player is put into a game
        FirebaseListen(`parties/${partyCode}/playersInGame`, async (playerIDList) => {
            //first check if player is even still in party; if not, it is likely they were removed
            if (playerIDList == undefined || playerIDList[UUID] == undefined) {
                return;
            }
            //check if player is put into game
            if (playerIDList[UUID] == true) {
                GoToGame();
            }
            //otherwise, we just update the names
            const playerNames = await RetrievePlayerNames(playerIDList);
            UpdatePlayerNames(playerNames);
            //check if all players are in lobby, and if we, we can display start game button
            const allPlayersInLobby = await CheckAllPlayersinLobby(partyCode);
            if (allPlayersInLobby) {
                ShowPlayButton();
            }
            else {
                HidePlayButton();
            }
        });
        //game flow
        //when a player clicks 'start game', all players are transported to the game (listening to 'parties/${partyID}/ingame')        
    }
};
PartyMain();
