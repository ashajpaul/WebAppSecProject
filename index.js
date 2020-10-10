//Also don't forget to include firebase-auth sdk
// Initialize Firebase
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
let gameDB = firebase.database().ref(); //root holds all the game lobbies

let minPlayers = 4;
const roles = ["Mafia", "Town", "Doctor", "Detective"];
const players = [];

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

class LobbyGame{

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

  udpateJSON(gameJSON){
    this.gameID = gameJSON.gameID || Math.floor(Math.random()*1000000000); 
    this.status = gameJSON.status || `Waiting for ${Object.keys(this.players).length}/${this.maxplayers}`; 
    this.players = gameJSON.players || {}; 
    this.render();
  }

  toJSON(){
    let gameObj = {}; 
    gameObj.gameID = this.gameID;
    gameObj.status = this.status; 
    gameObj.players = this.players;
    return gameObj; 
  }

  render(){ //Finish this!

    this.$html.html(`
<div class="lobbygame ${this.creator == userid ? "yours" : ""}">
    `)

    this.$html = 
    $(`
    <div class="lobbygame">
    <h3 class = "status"></h3>
    <h3 class = "players"></h3>
    <button class = "leaveLobby">Leave a lobby</button>
    </div>
    `);
    //Add render updates here for HTML
  }
}

let renderLobby = function(){
  $("body").html(`<button id="newgame">Click To Make Game</button>`);
  gameDB.on("child_added", (aGameSnap)=>{
    let gameJSON = aGameSnap.val();
    let newGameInstance = new LobbyGame(gameJSON, gameDB.child(aGameSnap.key));
    $("body").append(newGameInstance.$html);
  });

  let makeGame = function(gameJSON){
    let res = {};
    res.gameID = gameJSON.gameID || Math.floor(Math.random()*1000000000); 
    res.status = gameJSON.status || `Starting Up!`; 
    res.players = gameJSON.players || {}; 
    return res;
  }

  $("#newgame").click(()=>{
    let newGameref = gameDB.push();
    let gameObj = makeGame({});
    gameObj.gameid = newGameref.key;
    gameObj.players = {};
    gameObj.players[userid] = userobj;
    newGameref.set(gameObj);
  });
};

//addPlayer();
  //append player name to players array, make players = getPlayers(?) from firebase
//joinGame(); 

//startGame();
  //randomly select roles
//updateGame(); 

//createGame(); 

//renderGame(); 
