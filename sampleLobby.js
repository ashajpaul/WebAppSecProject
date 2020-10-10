class LobbyGame {
  constructor(gameJSON, ref) {
    this.database = ref;
    this.$html = $(`<div></div`);
    this.database.on("value", ss => {
      if (!ss.val()) {
        this.$html.html('');
        this.database.off("value");
      }
      this.updateFromJSON(ss.val());
    });
  }

  updateFromJSON(gameJSON) {
    this.created = gameJSON.created || new Date().toLocaleString();
    this.title = gameJSON.title || `New Game ${this.created}`;
    this.gameid = gameJSON.gameid || `Game-${Math.floor(Math.random() * 1000000000)}`;
    this.maxplayers = gameJSON.maxplayers || 2;
    this.players = gameJSON.players || {};
    this.creator = gameJSON.creator || "anon";
    this.status = gameJSON.status || `Waiting ${Object.keys(this.players).length}/${this.maxplayers}`;
    this.render();
  }

  toJSON() {
    let gameObj = {};
    gameObj.created = this.created;
    gameObj.gameid = this.gameid;
    gameObj.title = this.title;
    gameObj.maxplayers = this.maxplayers;
    gameObj.players = this.players;
    gameObj.status = this.status;
    return gameObj;
  }

  render() {

    this.$html.html(`
<div class="lobbygame ${this.creator == userid ? "yours" : ""}">
  <h3 class="title">${this.title}</h3>
  <h4 class="status">${this.status}</h4>
  <div class="buttons"></div>
</div>
      `);
    if (Object.keys(this.players).indexOf(userid) > -1) {
      if (userid == this.creator) {
        this.$html.find(".buttons").html(`
<button class="edit">Edit</button>
<button class="delete">Delete</button>
<button class="goto">Go To Game</button>
`);
        this.$html.find(".delete").on("click", () => {
          this.database.remove();
        });
        this.$html.find(".edit").on("click", () => {
          let newtitle = prompt("What's the new title, yo?");
          this.database.child("title").set(newtitle || this.title);
        });
      } else {
        this.$html.find(".buttons").html(`
  <button class="leave">Leave</button>
  <button class="goto">Go To Game</button>
        `);
        this.$html.find(".leave").on("click", () => {
          this.database.child("players").child(userid).remove();
        });
      }
      this.$html.find(".goto").on("click", () => {
        let gameParams = {
          lobbyDB: this.database,
          gameid: this.gameid };

        gotoScreen(gameParams);
      });
    } else {
      this.$html.find(".buttons").html(`
    <button class="join">Join</button>
      `);
      this.$html.find(".join").on("click", () => {
        this.database.child("players").child(userid).set(userobj);
      });
    }
  }}


let renderTeamChooser = function (lobbyDB, gameDB, $body) {
  //Show and allow Selecting "saved teams"
  //Allow editing your team's name
  //Allow Creating a Team one monster at a time
  let availableTeams = {};
  let editGuid = null;
  let commitTeam = function (yourTeam) {
    gameDB.child("users").child(userid).set(
    { team: yourTeam, active: "mon1", switchCount: 0 }).
    then(() => {
      lobbyDB.child("players").child(userid).child("ready").set(true);
    });
  };

  $body.html(`
<div id="monstermaker"></div>
<button id="makenew">Make a New Team</button>
<input id="newname" placeholder="New Team Name"/>
<div id="teamselect"></div>
`);

  let editTeam = function (teamguid) {
    let teamObj = availableTeams[teamguid];
    $("#monstermaker").html(`
<h1>EDITING TEAM: <span class="editteamname"></span></h1>
<div class="editmondisplay">
</div>
<div class="admin">
  <button class="changename">Change Team Name</button>
  <button class="alldone">All Done Editing TEAM</button>
</div>
<div class="monbutt">
  <button class="editmon" data-guid="mon1">Edit Lead (1)</button>
  <button class="editmon" data-guid="mon2">Edit Swap (2)</button>
  <button class="editmon" data-guid="mon3">Edit Closer (3)</button>
</div>
<div id="editmons">
</div>
<hr>
<hr>
`);
