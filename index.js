let userid = localStorage.getItem("userid");
if (!userid){
  uuid = `userid-${Math.floor(1000000000*Math.random())}`;
  localStorage.setItem("userid", uuid);
}

var firebaseConfig = {
  apiKey: "AIzaSyB5YRHdEwTnf4GqWRvfID2gk-zD0aiK-Yw",
  authDomain: "classnoteswebsec9-21-2020.firebaseapp.com",
  databaseURL: "https://classnoteswebsec9-21-2020.firebaseio.com",
  projectId: "classnoteswebsec9-21-2020",
  storageBucket: "classnoteswebsec9-21-2020.appspot.com",
  messagingSenderId: "459619744560",
  appId: "1:459619744560:web:19864d79308a9fbcbb66f5",
  measurementId: "G-1RN7PWP62J"
};
firebase.initializeApp(firebaseConfig);
let mygamesDB = firebase.database().ref("games");

let userobj = {"username":"Anonymous","role":"townsperson","isAlive":true,"target":""};

//Helper functions for the game functions to work
let assignRoles = function(playerList, playerRef){
  let randomRoles = [];
  let mafiaCount = Math.floor(playerList.length / 4);
  let roleCount = mafiaCount + 2;
  for(i = 0; i < playerList.length - 1; i++){
    let randomNum = Math.floor(Math.random() * (playerList.length));
    if(randomRoles.includes(randomNum)){
      i--;
    }
    else{
      randomRoles.push(randomNum);
    }
  }
  playerRef.once("value", function(ss){
    let snapshot = ss.val();
    let i = 0;
    let mafiaCounter = 0;
    let isDoc = false; 
    let isDec = false;
    for(var userid in snapshot){
      if(randomRoles.includes(i)){
        if(mafiaCounter < mafiaCount){
          if(mafiaCounter == 0){
            snapshot[userid].role = "godfather";
          }
          else{
            snapshot[userid].role = "mafia";
          }
          mafiaCounter++;
        }
        else if(!isDoc){
          snapshot[userid].role = "doctor";
          isDoc = true;
        }
        else if(!isDec){
          snapshot[userid].role = "detective";
          isDec = true;
        }
      }
      i++;
    }
    playerRef.set(snapshot);
  });
}

let getPlayersJSON = function(playerRef){
  let players;
  playerRef.once("value", function(ss){
    let snapshot = ss.val();
    players = snapshot;
  });
  return players;
}

let targetUpdate = function(playerJSON, playerRef){
  playerRef.child(userid).update({target : playerJSON[userid].target});
}

let statusUpdate = function(playerRef){
  let players = getPlayersJSON(playerRef); 
  let mafiaDetection = `They are not part of the mafia!`
  for(var useridKey in players){
    if(players[useridKey].role == "godfather"){
      let target = players[useridKey].target;
      for(var useridKey1 in players){
        if(players[useridKey1].username == target){
          players[useridKey1].isAlive = false;
          players[useridKey1].target = "";
        }
      }
    }
    else if(players[useridKey].role == "doctor"){
      let target = players[useridKey].target;
      for(var useridKey1 in players){
        if(players[useridKey1].username == target){
          players[useridKey1].isAlive = true;
          players[useridKey1].target = "";
        }
      } 
    }
    else if(players[useridKey].role == "detective"){
      let target = players[useridKey].target;
      for(var useridKey1 in players){
        if(players[useridKey1].username == target && (players[useridKey1].role == "mafia" || players[useridKey1].role == "godfather")){
          mafiaDetection = `${players[useridKey].username} is part of the mafia!`;
        }
      }
    }
  }
  console.log(players);
  if(players[userid].role == "detective"){
      alert(mafiaDetection);
    }
  //console.log(players);
  playerRef.set(players);
}

let mafiaWinChecker = function(playerRef){ //Finish this!
  let isWon = false;
  playerRef.once("value", function(ss){
    let players = ss.val();
    let playersAlive = [];
    let mafiaList = [];
    //See if everyone is dead besides godfather and mafia
    for(var useridKey in players){
      if(players[useridKey].isAlive){
        playersAlive.push(players[useridKey]);
      }
      if(players[useridKey].isAlive && (players[useridKey].role == "mafia" || players[useridKey].role == "mafia")){
        mafiaList.push(players[useridKey]);
      }
    }
    if(playersAlive.length == mafiaList.length){
      isWon = true;
    }
    else{
      isWon = false;
    }
  });
  return isWon;
}

let townWinChecker = function(playerRef){
  let isWon = false;
  playerRef.once("value", function(ss){
    let players = ss.val();
    let mafiaCounter = 0;
    for(var useridKey in players){
      if(players[useridKey].role == "mafia" || players[useridKey].role == "godfather"){
        mafiaCounter++;
      }
    }
    if(mafiaCounter == 0){
      isWon = true;
    }
    else{
      isWon = false;
    }
  });
  return isWon;
}

let switchToDay = function(params){
  let gameid = params.gameid;
  let playerRef = firebase.database().ref(`games/${gameid}/players`);
  playerRef.off(); //Turns off call back from voting system
  statusUpdate(playerRef);
  let players = getPlayersJSON(playerRef);
  $("body").empty(); //Clears screen
  if(townWinChecker(playerRef)){
    $("body").html(`<h1>Town Wins!</h1>`);
  }
  else if(mafiaWinChecker(playerRef)){
    $("body").html(`<h1>Mafia Wins!</h1>`);
  }
  else{
    $("body").html(`<h1>The game continues...</h1>`);
    //Show who's dead and show who's alive
    let deadList = []
    for(var useridKey in players){
      if(!players[useridKey].isAlive){
        deadList.push(players[useridKey].username);
      }
    }
    $("body").append(`<p>The players who are dead: ${deadList}</p>`);
    //console.log("render day now?");
    renderDay(params);
  }
}

let switchToNight = function(params){
  let gameid = params.gameid;
  let playerRef = firebase.database().ref(`games/${gameid}/players`);
  playerRef.off(); //Turns off call back from voting system
  statusUpdate(playerRef); //Change this for the daytime version 
  let players = getPlayersJSON(playerRef);
  $("body").empty(); //Clears screen
  if(townWinChecker(playerRef)){
    $("body").html(`<h1>Town Wins!</h1>`);
  }
  else if(mafiaWinChecker(playerRef)){
    $("body").html(`<h1>Mafia Wins!</h1>`);
  }
  else{
    $("body").html(`<h1>The game continues...</h1>`);
    //Show who's dead and show who's alive
    let deadList = []
    for(var useridKey in players){
      if(!players[useridKey].isAlive){
        deadList.push(players[useridKey].username);
      }
    }
    $("body").append(`<p>The players who are dead: ${deadList}</p>`);
    renderNight(params);
	}
}

let voteTally = function(playerJSON){
  let alivePlayers = {};
  for(var useridKey2 in playerJSON){
    if(playerJSON[useridKey2].isAlive){
      alivePlayers[playerJSON[useridKey2].username] = 0; //Fills in dictionary with usernames with a tally of 0
    }
  }
  for(var useridKey1 in playerJSON){
    //if in dictionary, add +1 to value of username
  }
}

let votingSystem = function(playerJSON, isNight, playerRef, params){
  let htmlBuilder = `<select id="playerNames">\n`;
  let playerList = [];
  let aliveList = [];
  for(var useridKey in playerJSON){
    playerList.push(playerJSON[useridKey].username);
    if(playerJSON[useridKey].isAlive){
      aliveList.push(playerJSON[useridKey].username);
    }
  }
  if(isNight){
    if(playerJSON[userid].role != 'townsperson' && playerJSON[userid].isAlive){
      for(var person1 of aliveList){
        htmlBuilder = htmlBuilder + `<option value=${person1}>${person1}</option>\n`;
      }
      htmlBuilder = htmlBuilder + `</select>`;
      $("body").append(htmlBuilder);
      $("body").append(`<input id="vote" type="submit" value="Submit">`);
      $("#vote").click(function(){
        let selected = $("#playerNames").val();
        $("#vote").prop('disabled', true);
        playerJSON[userid].target = selected;
        targetUpdate(playerJSON, playerRef);
      });
    }
    else{
      playerJSON[userid].target = "dummyCase!";
      targetUpdate(playerJSON, playerRef);
    }
    playerRef.on("value", function(ss){
      let allPlayers = ss.val();
      let isWaiting = true;
      let activePlayers = [];
      let readyPlayers = 0;
      for(var useridKey in allPlayers){
        if((allPlayers[useridKey].role == 'godfather' || allPlayers[useridKey].role == 'detective' || allPlayers[useridKey].role == 'doctor') && allPlayers[useridKey].isAlive){
          activePlayers.push(allPlayers[useridKey]);
          if(allPlayers[useridKey].target != "dummyCase!" && (allPlayers[useridKey].role == 'mafia' || allPlayers[useridKey].role == 'townsperson') && allPlayers[useridKey].isAlive){
            readyPlayers++;
          }
          else if(allPlayers[useridKey].target != ""){
            readyPlayers++;
          }
        }
      }
      if(readyPlayers == activePlayers.length){
        isWaiting = false;
      }
      else{
        isWaiting = true;
      }
      if(!isWaiting){
        //console.log(allPlayers);
        switchToDay(params);
      }
      else{
        $("body").append(`<p>Waiting for everyone to cast their votes...</p>`);
      }
    });
  }
  else{
    htmlBuilder = `<h1>The town must vote for an execution...</h1>\n<select id="playerNames">\n`;
    for(var person2 of aliveList){
        htmlBuilder = htmlBuilder + `<option value=${person2}>${person2}</option>\n`;
      }
      htmlBuilder = htmlBuilder + `</select>`;
      $("body").append(htmlBuilder);
      $("body").append(`<input id="vote" type="submit" value="Submit">`);
      $("#vote").click(function(){
        let selected = $("#playerNames").val();
        $("#vote").prop('disabled', true);
        playerJSON[userid].target = selected;
        targetUpdate(playerJSON, playerRef);
      });
    playerRef.on("value", function(ss){ //Finish waiting for everyone to vote
      let allPlayers = ss.val();
      let isWaiting = true;
      let activePlayers = [];
      let readyPlayers = 0;
      for(var useridKey1 in allPlayers){
        if(allPlayers[useridKey1].isAlive){
          activePlayers.push(allPlayers[useridKey1]);
        }
        if(allPlayers[useridKey1].target != "" && allPlayers[useridKey1].target != "dummyCase!"){
          readyPlayers++;
        }
      }
      if(readyPlayers == activePlayers.length){
        //Need to talley votes and then execute the person
        voteTalley(allPlayers);
        isWaiting = false;
      }
      else{
        isWaiting = true;
      }
      if(!isWaiting){
        switchToNight(params);
      }
      else{
        $("body").append(`<p>Waiting for everyone to cast their votes...</p>`);
      }
    });
  }
}

//Specifc Game Parts are here
let displayRoles = function(params){
  let gameid = params.gameid;
  let playerRef = firebase.database().ref(`games/${gameid}/players`);
  let playerJSON = getPlayersJSON(playerRef);
  let playerRole = playerJSON[userid].role;
  let mafiaList = [];
  $("body").html(`<h1> You are a ${playerRole}</h1>`);
  if(playerRole == 'mafia' || playerRole == 'godfather'){
    for(var useridKey in playerJSON){
      if(playerJSON[useridKey].role == 'mafia' || playerJSON[useridKey].role == 'godfather'){
        mafiaList.push(playerJSON[useridKey].username);
      }
    }
    $("body").append(`<p>Your fellow mafia members are: ${mafiaList}`);
  }
}

let renderDay = function(params){
  //Voting for someone to kill
  let gameid = params.gameid;
  let playerRef = firebase.database().ref(`games/${gameid}/players`);
  let playerJSON = getPlayersJSON(playerRef); 
  let playerRole = playerJSON[userid].role;
  let playerAlive = playerJSON[userid].isAlive;
  if(playerAlive){
    $("body").append(`<p><b>Action: </b>Pick a person who you think is the mafia, and they shall be executed:</p>`);
    votingSystem(playerJSON, false, playerRef, params);
  }
  else{
    $("body").append(`<p><b>You're dead! </b>:(</p>`);
  }
}

let renderNight = function(params){
  let gameid = params.gameid;
  let playerRef = firebase.database().ref(`games/${gameid}/players`);
  let playerJSON = getPlayersJSON(playerRef);
  let playerRole = playerJSON[userid].role;
  let playerAlive = playerJSON[userid].isAlive;
  if(playerRole == "townsperson" && playerAlive){
    $("body").append(`<p><b>Action: </b>You can't do anything... You're sleeping through the night with no worries in the world!</p>`);
    votingSystem(playerJSON, true, playerRef, params);
  }
  else if(playerRole == "doctor" && playerAlive){
    $("body").append(`<p><b>Action: </b>Pick a person to save from the dropdown below: </p>`);
    votingSystem(playerJSON, true, playerRef, params);
  }
  else if(playerRole == "detective" && playerAlive){
    $("body").append(`<p><b>Action: </b>Pick a person to study from the dropdown below: </p>`);
    votingSystem(playerJSON, true, playerRef, params);
  }
  else if(playerRole == "godfather" && playerAlive){
    $("body").append(`<p><b>Action: </b>Pick a person to kill from the dropdown below: </p>`);
    votingSystem(playerJSON, true, playerRef, params);
  }
  else if(playerRole == "mafia" && playerAlive){
    $("body").append(`<p><b>Action: </b>Talk to your fellow mafia members on who to kill. Only the godfather can select who's killed.</p>`);
    votingSystem(playerJSON, true, playerRef, params);
  }
  else{
    $("body").append(`<p><b>You're dead! </b>:(</p>`);
  }
}

//Main Game logic here
let createGame = function(params){
  $("body").empty(); //Clears the screen completely
  displayRoles(params);
  renderNight(params); //Voting system loops back into daytime
}

//Firebase + Lobby Functionalities
class LobbyGame{
  constructor(gameJSON, ref){
    this.database = ref;
    this.$html = $(`<div></div`);
    this.database.on("value", ss=>{
      if(!ss.val()){
        this.$html.html('');
        this.database.off("value");
      }
      this.updateFromJSON(ss.val());
    });
  }
  
  updateFromJSON(gameJSON){
    this.created = gameJSON.created || new Date().toLocaleString();
    this.title = gameJSON.title || `New Game ${this.created}`;
    this.gameid = gameJSON.gameid || `Game-${Math.floor(Math.random()*1000000000)}`;
    this.players = gameJSON.players || {};
    this.creator = gameJSON.creator || "anon";
    this.status = `Currently ${Object.keys(this.players).length} players in lobby (minimum needed is 4)` || gameJSON.status;
    this.render();
  }
  
  toJSON(){
    let gameObj = {};
    gameObj.created = this.created;
    gameObj.gameid = this.gameid;
    gameObj.title = this.title;
    gameObj.players = this.players;
    gameObj.status = this.status;
    return gameObj;
  }
  
  render(){
    this.$html.html(`
      <div class="lobbygame ${this.creator == userid ? "yours" : ""}">
      <h3 class="title">${this.title}</h3>
      <h4 class="status">${this.status}</h4>
      <div class="buttons"></div>
      </div>
      `);
    if (Object.keys(this.players).indexOf(userid) > -1){
      if (userid == this.creator){
        this.$html.find(".buttons").html(`
        <button class="edit">Edit</button>
        <button class="delete">Delete</button>
        <button class="goto">Go To Game</button>
        `);
        this.$html.find(".delete").on("click", ()=>{
          this.database.remove();
        });
        this.$html.find(".edit").on("click", ()=>{
          let newtitle = prompt("Enter a new lobby title:");
          this.database.child("title").set(newtitle || this.title);
        });
      }
      else{
        this.$html.find(".buttons").html(`
        <button class="leave">Leave</button>
        <button class="goto">Go To Game</button>
              `);
        this.$html.find(".leave").on("click", ()=>{
          this.database.child("players").child(userid).remove();
        }); 
      }
      this.$html.find(".goto").on("click", ()=>{
        let gameParams = {
          lobbyDB: this.database,
          gameid: this.gameid
        };
        goToScreen(gameParams);
      });
    }
    else{
      this.$html.find(".buttons").html(`
      <input class = "name" type="text" placeholder= "Input your name"></input>
      <button class="join">Join</button>
        `);
      this.$html.find(".join").on("click", ()=>{
        let name = this.$html.find(".name").val();
        if(name == ""){
          alert("Please enter a name to join a lobby!"); 
        }
        else{
          userobj.username = name; 
          this.database.child("players").child(userid).set(userobj);
        }
      });
    }
  }
}

let goToScreen = function(params){
  mygamesDB.off();
  let lobbyDB = params.lobbyDB; 
  let gameid = params.gameid;
  //reference to firebaes with an event with adding a child of player
  let playerRef = firebase.database().ref(`games/${gameid}/players`);
  let updatePlayerList = [];
  $("body").html(`
  <h1>Welcome to Mafia</h1>
  <p id="gameRules"><\p>
  <p id="info"><\p>
  <p id="playerList"><\p>
  <button id="initialize">Assign Roles</button>
  <button id="joinGame">Join Game</button>
  `);
  $("#gameRules").html(`Game Rules <a href="https://www.kqed.org/pop/10178/how-to-play-mafia-an-in-depth-guide-to-the-perfect-holiday-game" target="_blank">here</a>`); //Change this link to relevant rules...
  $("#info").html(`For the host, Please press the 'Assign Roles' after everyone has joined. Everyone else has to press 'Join Game' after the host presses 'Assign Roles'.`);
  playerRef.on("value", function(ss){
    //Put html coding in the callback in order to update each time a new player is added
    let snapshot = ss.val();
    let playerList = [];
    for(var userid in snapshot){
      playerList.push(snapshot[userid].username);
    }
    $("#playerList").text(`Player List: ${playerList.toString()}`);
    updatePlayerList = playerList;
  });
  $(document).ready(function(){
    $("#initialize").click(function(){
      assignRoles(updatePlayerList, playerRef);
      $("#initialize").prop('disabled', true);
    });
    $("#joinGame").click(function(){
      createGame(params);
    });
  });
}

let renderLobby = function(){
  $("body").html(`<h1>Virtual Mafia</h1>
  <p>Please make sure everyone joins the game before starting the game<\p>
  <input id = "name" type="text" placeholder= "Input your name"></input>
  <button id="newgame">Click To Make Game</button>`);
  
  mygamesDB.on("child_added", (ss)=>{
    let gameJSON = ss.val();
    let newGameInstance = new LobbyGame(gameJSON, mygamesDB.child(ss.key));
    $("body").append(newGameInstance.$html);
  });
  
  let makeGame = function(gameJSON){
    let res = {};
    res.created = gameJSON.created || new Date().toLocaleString();
    res.title = gameJSON.title || `New Game ${res.created}`;
    res.gameid = gameJSON.gameid || `Game-${Math.floor(Math.random()*1000000000)}`;
    res.players = gameJSON.players || false;
    res.status = gameJSON.status || `Starting Up`;
    return res;
  }
  
  $("#newgame").click(()=>{
    let name = $("#name").val();
    if(name == ""){
      alert("Please enter a name to create a lobby!");
    }
    else{
      userobj.username = name;
      let newGameRef = mygamesDB.push();
      let gameObj = makeGame({});
      gameObj.creator = userid;
      gameObj.title = `${name}-lobby`;
      gameObj.gameid = newGameRef.key;
      gameObj.players = {};
      gameObj.players[userid] = userobj;
      newGameRef.set(gameObj);
    }
  });
};

renderLobby();