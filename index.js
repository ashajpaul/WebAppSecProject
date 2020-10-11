let userid = localStorage.getItem("userid");
if (!userid){
  uuid = `userid-${Math.floor(1000000000*Math.random())}`;
  localStorage.setItem("userid", uuid);
}
let userobj = {"username":"Anonymous","ready":false};

//Game Logic
let minPlayers = 4;
const roles = ["Mafia", "Town", "Doctor", "Detective"];
const players = [];

//Player class
class Player {
  constructor(name, role, isAlive) {
    this.name = name;
    this.role = role;
    this.isAlive = isAlive;
  }

  get role() {
    return this.role;
  }
}

// Your web app's Firebase configuration
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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
let mygamesDB = firebase.database().ref("games");

class LobbyGame {
  constructor(gameJSON, ref){
    this.database = ref;
    this.$html = $(`<div></div`);
    this.database.on("value", ss=>{
      if (!ss.val()){
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
    //this.maxplayers = gameJSON.maxplayers || 2;
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
    //gameObj.maxplayers = this.maxplayers;
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
      } else {
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
        gotoScreen(gameParams);
      });
    } else {
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

//Renders the ingame after lobby is joined 
//Game logic for mafia

let renderActiveGame = function(gameDB, $body){
  $body.html(`
<h1>Battling!</h1>
<h2 class="messages"></h2>
<div class="theirs">
  theirMon
</div>
<div class="active">
  yourMon
</div>
<div class="choices">
  buttons here...
</div>
<div class="bench">
  bench here...
</div>
<h2 class="log">
</h2>
`);
  gameDB.child("results").on("value", ss=>{
    let data = ss.val();
    if (!data){
      return;
    }
    $body.find(".log").html(`<div>${data[0]}</div>`);
    $body.find(".log").append(`<div>${data[1]}</div>`);
  });
  gameDB.child("choices").on("value", ss=>{
    let state = ss.val();
    if (!state){
      $body.find(".messages").html("");
      return;
    }
    if (Object.keys(state).length > 0){
      if (Object.keys(state).indexOf(userid) > -1){
        $body.find(".messages").html("Waiting...");        
      } else {
        $body.find(".messages").html("Your opponent is waiting on you...");
      }
    }
  });
  gameDB.child("users").on("value", ss=>{
    let gameState = ss.val();
    let users = Object.keys(gameState);
    let otherUser = users.filter(el=>el!=userid)[0];
    let activeID = gameState[otherUser].active;
    let theirMon = gameState[otherUser].team[activeID];
    $body.find(".theirs").html(renderMonster(theirMon, "Active Enemy Monster"));
    let yourID = gameState[userid].active;
    let yourMon = gameState[userid].team[yourID];
    $body.find(".active").html(renderMonster(yourMon, "Your Active Monster"));
    let benchIds = Object.keys(gameState[userid].team).filter(el=>el!=yourID);
    $body.find(".bench").html("");
    benchIds.map(bid=>{
      $body.find(".bench").append(renderMonster(gameState[userid].team[bid], "Bench Monster"));
    });
    $body.find(".choices").html(`
<button class="fastchoice">Fast Move (Costs: 0)</button>
<button class="charge1choice">Charge Move 1 (Costs: ${yourMon.charge1.energy})</button>
<button class="charge2choice">Charge Move 2 (Costs: ${yourMon.charge2.energy})</button>
<button class="switch switch1" data-bid="${benchIds[0]}" disabled=true>Switch to bench1 ${gameState[userid].team[benchIds[0]].types.join(" ")}</button>
<button class="switch switch2" data-bid="${benchIds[1]}" disabled=true>Switch to bench2 ${gameState[userid].team[benchIds[1]].types.join(" ")}</button>
                                `);
    if (gameState[userid].switchCount <= 0){
      if (gameState[userid].team[benchIds[0]].health > 0){
          $body.find(".switch1").attr("disabled", false);
      }
      if (gameState[userid].team[benchIds[1]].health > 0){
          $body.find(".switch2").attr("disabled", false);
      }    
    } else {
      if (yourMon.health <= 0){
        $body.find(".switch").attr("disabled", false);
      } else {
        $body.find(".switch").append(` <span> ${gameState[userid].switchCount} turns till switch</span>`);
      }
    }
    
    if (yourMon.energy < yourMon.charge1.energy){
      $body.find(".charge1choice").attr("disabled",true);
    }
    if (yourMon.energy < yourMon.charge2.energy){
      $body.find(".charge2choice").attr("disabled",true);
    }
    
    if (yourMon.health <= 0){
      $body.find(".charge1choice").attr("disabled",true);
      $body.find(".charge2choice").attr("disabled",true);
      $body.find(".fastchoice").attr("disabled",true);
    }
    
    $body.find(".fastchoice").click(()=>{
      gameDB.child("choices").child(userid).set({action:"fast"});
    });
    $body.find(".charge1choice").click(()=>{
      gameDB.child("choices").child(userid).set({action:"charge1"});
    });
    $body.find(".charge2choice").click(()=>{
      gameDB.child("choices").child(userid).set({action:"charge2"});
    });
    $body.find(".switch").click((evt)=>{
      let bid = $(evt.currentTarget).attr("data-bid");
      if (yourMon.health <= 0){
        gameDB.child("choices").child(userid).set({action:"replace", new: bid});  
      } else {
        gameDB.child("choices").child(userid).set({action:"switch", new: bid});        
      }
    });
  });
};

let renderWaitingScreen = function(gameDB, $body, status, lobbyDB){
  $body.html(`<h1>Game Status: ${status}</h1>
  <h2 class="yourteam">Your team is ...</h2>
  <button class="editagain">Click to change team</button>`);
  gameDB.child("users").child(userid).child("team").once("value", ss=>{
    let team = ss.val();
    console.log(team);
    $body.find(".yourteam").html('');
    Object.keys(team).map((mid,i)=>{
      console.log(mid, team[mid]);
      $body.find(".yourteam").append(renderMonster(team[mid], `Monster ${i+1}`));
    });
  });
  lobbyDB.child("status").on("value", ss=>{
    $body.find("h1").html(`Game Status: ${ss.val()}`);
  });
  $body.find(".editagain").click(()=>{
    lobbyDB.child("players").child(userid).child("ready").set(false);
  });
};

let gotoScreen = function(params){ //Renders the go to game button in the lobby
  mygamesDB.off();
  let lobbyDB = params.lobbyDB;
  let gameid = params.gameid;
  $("body").html(`
<button id="backtolobby">Back to Lobby</button>
<div id="gamescreen">
</div>
  `);
  $("#backtolobby").click(renderLobby);
  let gameDB = firebase.database().ref("activegames").child(gameid);
  lobbyDB.child('players').child(userid).child('ready').on('value', (ss)=>{
    let readyState = ss.val();
    console.log(readyState);
    if (!readyState){
      lobbyDB.child('status').off();
      renderTeamChooser(lobbyDB, gameDB, $("#gamescreen"));
    } else {
      lobbyDB.child('status').on('value', ss=>{
        let status = ss.val();
        if (status.substring(0,5) == "Ready"){
          renderActiveGame(gameDB, $("#gamescreen"));
        } else {
          renderWaitingScreen(gameDB, $("#gamescreen"), status, lobbyDB);
        }
      });
    }
  });
};

let renderLobby = function(){
  $("body").html(`<input id = "name" type="text" placeholder= "Input your name"></input>
                  <button id="newgame">Click To Make Game</button>`);
  
  mygamesDB.on("child_added", (aGameSnap)=>{
    let gameJSON = aGameSnap.val();
    let newGameInstance = new LobbyGame(gameJSON, mygamesDB.child(aGameSnap.key));
    $("body").append(newGameInstance.$html);
  });

  let makeGame = function(gameJSON){
    let res = {};
    res.created = gameJSON.created || new Date().toLocaleString();
    res.title = gameJSON.title || `New Game ${res.created}`;
    res.gameid = gameJSON.gameid || `Game-${Math.floor(Math.random()*1000000000)}`;
    //res.maxplayers = gameJSON.maxplayers || 2;
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
      let newGameref = mygamesDB.push();
      let gameObj = makeGame({});
      gameObj.creator = userid;
      gameObj.title = `${name}-lobby`;
      gameObj.gameid = newGameref.key;
      gameObj.players = {};
      gameObj.players[userid] = userobj;
      newGameref.set(gameObj);
    }
  });
};

renderLobby();