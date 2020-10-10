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

var google_provider = new firebase.auth.GoogleAuthProvider();

firebase.auth().onAuthStateChanged(user => {
  if (!!user){
    alert(`${user.displayName || user.email}`);
  }
  else{
    alert("Not signed in...");
  }
});

document.getElementById("login").addEventListener("click", function(){
  firebase.auth().signInWithRedirect(google_provider);
});

class LobbyGame{

  constructor(gameJSON){
    this.updateJSON(gameJSON);
  }

  udpateJSON(gameJSON){
    this.gameID = gameJSON.gameID || Math.floor(Math.random()*1000000000); 
    this.status = gameJSON.status || `Waiting for ${Object.keys(this.players).length}/${this.maxplayers}`; 
    this.players = gameJSON.players || {}; 
  }

  toJSON(){
    let gameObj = {}; 
    gameObj.gameID = this.gameID;
    gameObj.status = this.status; 
    gameObj.players = this.players;
    return gameObj; 
  }

  render(){
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

let newGame = {
  "gameID" : "", //UTC Time in seconds? 
  "minPlayers" : 4,
  "maxPlayer" : 16, 
  "status" : "Waiting 1/4",
  "players" : {
    "playerId" : {
      "name" : user.getName(), // Add this in
      "ready" : false
    }
  }
};

//addPlayer();

//joinGame(); 

//startGame();

//updateGame(); 

//createGame(); 

//renderGame(); 
