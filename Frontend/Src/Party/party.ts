//HTML functions
const noParty = document.getElementById("noParty")!;
const inParty = document.getElementById("inParty")!;
const ShowNoParty = () => {
    noParty.style.display = "";
    inParty.style.display = "none";
}
const ShowInParty = () => {
    noParty.style.display = "none";
    inParty.style.display = "";
}

const changeNameButton = document.getElementById("changeName")!;
const UpdateNameButton = (name: string) => {
    changeNameButton.innerText = `${name} [CHANGE NAME]`;
}

const partyIDElement = document.getElementById("partyID")!;
const UpdatePartyID = (partyID: string) => {
    partyIDElement.innerText = `Party ID: ${partyID}`;
}

const joinableElement = document.getElementById("joinable")!;
const UpdateJoinable = (joinable: boolean) => {
    joinableElement.innerText = `Joinable: ${joinable}`;
}

const InitialisePartyListeners = (userID: string, partyID: string | null) => {
    const createPartyButton = document.getElementById("createParty")!;
    createPartyButton.onclick = async () => {
        await CreateParty(userID);
        location.reload()
    }

    const joinPartyButton = document.getElementById("joinParty")!;
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
    }

    const leavePartyButton = document.getElementById("leaveParty")!;
    leavePartyButton.onclick = async () => {
        await LeaveParty(userID, partyID!); //can assume partyID is not null if user can click on leave party button
        location.href = "/Src/Party/party.html";
    }

    const inviteOthersButton = document.getElementById("inviteOthers")!;
    inviteOthersButton.onclick = () => {
        if (navigator.share) {
            navigator.share({
                url: location.href
            })
            .then(() => console.log("Shared successfully"))
            .catch((error) => console.error("Error sharing:", error));
        } else {
            alert("Web Share API not supported on this browser.");
        }
    }

    playButton.onclick = async () => {
        await PutAllPlayersInGame(partyID!, LEVELS);
    }

    changeNameButton.onclick = async () => {
        const name = prompt("New display name");
        if (name == undefined || name.replaceAll(" ", "") == "") {
            return;
        }
        await SetDisplayName(userID, name);
        location.reload(); //reload page to refresh changes
    }
}

const playButton = document.getElementById("playGame")!;
const ShowPlayButton = () => {
    playButton.style.display = ""
}
const HidePlayButton = () => {
    playButton.style.display = "none";
}




const playerListElement = document.getElementById("playerList")!;
const UpdatePlayers = (playerScores: { uuid: string, name: string, score: number | null }[]) => {
    playerListElement.innerHTML = "";

    for (const player of playerScores) {
        const listElement = document.createElement("li");
        listElement.innerText = `${player.name}: ${player.score == null ? '-' : Math.round(player.score * 10) / 10}`;
        playerListElement.append(listElement);
    }
}




const GoToGame = () => {
    location.href = "/Src/Play/play.html?partyMode=true";
}



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
        const embeddedWarning = document.getElementById("embeddedWarning")!;
        embeddedWarning.style.display = "";
        return;
    }

    //Check whether user is currently in a party
    let partyCode = await GetCurrentPartyCode(UUID);

    //check if user opened link to party
    const params = new URLSearchParams(new URL(location.href).search);
    const partyID = params.get("partyID");
    if (partyID != null) {
        //if current party is not the same as partyID, leave it
        if (partyCode != null && partyCode != partyID) {
            await LeaveParty(UUID, partyCode);
        }

        //join new party
        const success = await JoinParty(UUID, partyID);
        if (success) {
            partyCode = partyID;
        }
    }

    InitialisePartyListeners(UUID, partyCode);

    //change party code in URL
    let newParams = new URLSearchParams(window.location.search);
    if (partyCode == null) {
        newParams.delete("partyID");
    }
    else {
        newParams.set('partyID', partyCode);
    }
    history.replaceState(null, '', '?' + newParams.toString());

    const displayName = await GetDisplayName(UUID);
    UpdateNameButton(displayName);

    if (partyCode == null) {
        ShowNoParty();
    }
    else {
        ShowInParty();
        UpdatePartyID(partyCode);
        const joinable = await CheckPartyJoinable(partyCode);
        UpdateJoinable(joinable);

        //constantly update whenever a new user joins or player is put into a game
        FirebaseListen(`parties/${partyCode}/playersInGame`, async (playerIDList: { [uuid: string] : boolean }) => {
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
            const playerScores = await RetrievePlayerScores(playerNames, partyCode!); //retrieve scores for players
            UpdatePlayers(playerScores);

            //check if all players are in lobby, and if we, we can display start game button
            const allPlayersInLobby = await CheckAllPlayersinLobby(partyCode!);
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
}
PartyMain();