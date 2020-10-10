let userid = localStorage.getItem("userid");
if (!userid){
  uuid = `userid-${Math.floor(1000000000*Math.random())}`;
  localStorage.setItem("userid", uuid);
}
let userobj = {"username":"Anonymous","ready":false};

let types = ["bug","dark","dragon","electric","fairy","fighting","fire","flying","ghost","grass","ground","ice","normal","poison","psychic","rock","steel","water"];
let makeMonster = function(types, fastChoices, chargeChoices, statsChoices){
  let mon = {};
  mon.types = types.filter(el=>el!="none");

  mon.fast = {type: fastChoices.type, energy: 0};
  switch (fastChoices.charge){
    case "fast":
      mon.fast.power = 2;
      mon.fast.energyGain = 10;
      mon.fast.style = "Quick Charge";
      break;
    case "med":
      mon.fast.power = 6;
      mon.fast.energyGain = 6;
      mon.fast.style = "Standard";      
      break;
    case "slow":
      mon.fast.power = 10;
      mon.fast.energyGain = 2;
      mon.fast.style = "Chunky";
      break;      
  };

  mon.charge1 = {type: chargeChoices[0].type, energyGain: 0};
  switch (chargeChoices[0].power){
    case "high":
      mon.charge1.power = 120;
      mon.charge1.energy = 65;
      mon.charge1.style = "Power";
      break;
    case "med":
      mon.charge1.power = 90;
      mon.charge1.energy = 50;
      mon.charge1.style = "Standard";
      break;
    case "low":
      mon.charge1.power = 60;
      mon.charge1.energy = 35;
      mon.charge1.style = "Spammy";    
      break;      
  };

  mon.charge2 = {type: chargeChoices[1].type, energyGain: 0};
  switch (chargeChoices[1].power){
    case "high":
      mon.charge2.power = 120;
      mon.charge2.energy = 65;
      mon.charge2.style = "Power";
      break;
    case "med":
      mon.charge2.power = 90;
      mon.charge2.energy = 50;
      mon.charge2.style = "Standard";    
      break;
    case "low":
      mon.charge2.power = 60;
      mon.charge2.energy = 35;
      mon.charge2.style = "Spammy";
      break;      
  };
  
  mon.hp=100 + statsChoices.hp*25;
  mon.health = mon.hp;
  mon.def=100 + statsChoices.def*25;
  mon.att=100 + statsChoices.att*25;
  mon.energy = 0;
  return mon;
}

let renderMonster = function(monster, title){
  if (Object.keys(monster).length == 0){
    return $(`<div class="mons><h1>No Monster</h1></div>`);
  }
  let $el = $(`
  <div class="mons">
    <div class="types">
      <span class="title">${title}</span> - <span>Types: </span>
    </div>
    <div class="stats">
      <div class="healthbar-wrapper">
        <progress class="healthbar" value=${monster.health} max=${monster.hp}>${monster.health}</progress>
      </div>
      <div class="battlestats">
        <span>energy: ${monster.energy}</span> <span>att: ${monster.att}</span> <span>def: ${monster.def}</span> <span>stam: ${monster.hp}</span>
      </div>
    </div>
    <div class="moveset">
        <div class="move fastmove">
            <div class="poketype ${monster.fast.type}"></div>
            <div class="movesub"><span class="faststyle">${monster.fast.style}</span>
        Fast</div>
        </div>
        <div class="move chargemove">
            <div class="poketype ${monster.charge1.type}"></div>
            <div class="movesub"><span class="cstyle">${monster.charge1.style}</span> Charge1</div>
            <progress value="${monster.energy}" max="${monster.charge1.energy}" />
        </div>
        <div class="move chargemove">
            <div class="poketype ${monster.charge2.type}"></div>
            <div class="movesub"><span class="cstyle">${monster.charge2.style}</span> Charge2</div>
            <progress value="${monster.energy}" max="${monster.charge2.energy}"/>
        </div>
    </div>
  </div>`);
  monster.types.map(atype=>{
    $el.find(".types").append(`
        <span class="poketype ${atype}">
      </span>
`)
  })

  return $el;
};

let exampleTeam = {team: {
    mon1: makeMonster(
      ["water","ground"],
      {type:"ground",charge:"fast"},
      [{type:"ground",power:"high"},{type:"water",power:"low"}],
      {hp:2,att:1,def:3}),
    mon2:  makeMonster(
      ["fairy","none"],
      {type:"fairy",charge:"slow"},
      [{type:"rock",power:"low"},{type:"fire",power:"med"}],
      {hp:3,att:2,def:1}),
    mon3: makeMonster(
      ["fighting","dark"],
      {type:"dark",charge:"fast"},
      [{type:"dark",power:"low"},{type:"fighting",power:"high"}],
      {hp:2,att:2,def:2})
  }, teamname: "Example Team"};

// Your web app's Firebase configuration
var firebaseConfig = {
  apiKey: "AIzaSyAiKUWgsVNvnCfJqkf0-8ktCgcixCaBIQk",
  authDomain: "supernumbergame.firebaseapp.com",
  databaseURL: "https://supernumbergame.firebaseio.com",
  projectId: "supernumbergame",
  storageBucket: "supernumbergame.appspot.com",
  messagingSenderId: "838996034900",
  appId: "1:838996034900:web:8952b76f2e0293747034c1"
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
    this.maxplayers = gameJSON.maxplayers || 2;
    this.players = gameJSON.players || {};
    this.creator = gameJSON.creator || "anon";
    this.status = gameJSON.status || `Waiting ${Object.keys(this.players).length}/${this.maxplayers}`;
    this.render();
  }
  
  toJSON(){
    let gameObj = {};
    gameObj.created = this.created;
    gameObj.gameid = this.gameid;
    gameObj.title = this.title;
    gameObj.maxplayers = this.maxplayers;
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
          let newtitle = prompt("What's the new title, yo?");
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
    <button class="join">Join</button>
      `);
      this.$html.find(".join").on("click", ()=>{
        this.database.child("players").child(userid).set(userobj);
      });
    }
  }
}

let renderTeamChooser = function(lobbyDB, gameDB, $body){
//Show and allow Selecting "saved teams"
//Allow editing your team's name
//Allow Creating a Team one monster at a time
  let availableTeams = {};
  let editGuid = null;
  let commitTeam = function(yourTeam){
    gameDB.child("users").child(userid).set(
      {team:yourTeam,active:"mon1",switchCount:0}
    ).then(()=>{
      lobbyDB.child("players").child(userid).child("ready").set(true);      
    });
  };

  $body.html(`
<div id="monstermaker"></div>
<button id="makenew">Make a New Team</button>
<input id="newname" placeholder="New Team Name"/>
<div id="teamselect"></div>
`);
  
  let editTeam = function(teamguid){
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
    $(".editmon").click(evt=>{
      let editedMonId = $(evt.currentTarget).attr("data-guid");
      $(".editmondisplay").html(
`
  <h4>Editing Monster: <span class="editmonid">${editedMonId}</span></h4>
<div class="edit form">
  <div class="form-group row">
    <label class="col-4 col-form-label" for="edittype1">Defensive Typing 1:</label> 
    <div class="col-8">
      <select id="edittype1" class="typeselect custom-select" name="edittype1">
      </select>
    </div>
  </div>
  <div class="form-group row">
    <label class="col-4 col-form-label" for="edittype2">Defensive Typing 2:</label> 
    <div class="col-8">
      <select id="edittype2" class="typeselect custom-select" name="edittype2">
        <option value="none">None</option>
      </select>
    </div>
  </div>
  <div class="form-group row">
    <label class="col-4 col-form-label" for="editfast">Fast Move Type (bonus if matches types):</label> 
    <div class="col-8">
      <select id="editfast" class="typeselect custom-select" name="editfast">
      </select>
    </div>
  </div>
  <div class="form-group row">
    <label class="col-4 col-form-label" for="editfaststyle">Fast Move Style:</label> 
    <div class="col-8">
      <select id="editfaststyle" class="faststyle custom-select" name="editfaststyle">
        <option value="fast">Quick Charge</option>
        <option value="med">Standard</option>
        <option value="slow">Chunky</option>
      </select>
    </div>
  </div>
  <div class="form-group row">
    <label class="col-4 col-form-label" for="editcharge1">Charge 1 Type (bonus if matches types):</label> 
    <div class="col-8">
      <select id="editcharge1" class="typeselect custom-select" name="editcharge1" >
      </select>
    </div>
  </div>
  <div class="form-group row">
    <label class="col-4 col-form-label" for="editc1style">Charge 1 Style:</label> 
    <div class="col-8">
      <select id="editc1style" class="cstyle custom-select" name="editfaststyle">
        <option value="high">Powerful</option>
        <option value="med">Standard</option>
        <option value="low">Spammy</option>
      </select>
    </div>
  </div>
  <div class="form-group row">
    <label class="col-4 col-form-label" for="editcharge2">Charge 2 Type (bonus if matches types):</label> 
    <div class="col-8">
      <select id="editcharge2" class="typeselect custom-select" name="editcharge2" >
      </select>
    </div>
  </div>
  <div class="form-group row">
    <label class="col-4 col-form-label" for="editc2style">Charge 2 Style:</label> 
    <div class="col-8">
      <select id="editc2style" class="cstyle custom-select" name="editc2style">
        <option value="high">Powerful</option>
        <option value="med">Standard</option>
        <option value="low">Spammy</option>
      </select>
    </div>
  </div>
  <div class="form-group row">
    <label class="col-4 col-form-label" for="atk">Atk: <span id="editatk">150</span></label> 
    <div class="col-8">
        <button id="atkup" disabled=true>Increase Attack</button>
        <button id="atkdown">Decrease Attack</button>
    </div>
  </div>
  <div class="form-group row">
    <label class="col-4 col-form-label" for="def">Def: <span id="editdef">150</span></label> 
    <div class="col-8">
        <button id="defup" disabled=true>Increase Defense</button>
        <button id="defdown">Decrease Defense</button>
    </div>
  </div>
  <div class="form-group row">
    <label class="col-4 col-form-label" for="stam">Stamina: <span id="editstam">150</span></label> 
    <div class="col-8">
        <button id="stamup" disabled=true>Increase Stamina</button>
        <button id="stamdown">Decrease Stamina</button>
    </div>
  </div>
  <button id="doneditmon">Done Editing This Monster</button>
</div>
<hr>
<hr>
`);
      let editstats = {hp:2,att:2,def:2};  //edittype1,edittype2,editfast,editfaststyle,editcharge1,editc1style,editcharge2,editc2style,atkup,atkdown,stamup,stamdown,defup,defdown,doneditmon
      types.map(ptype=>{
        $(".typeselect").append(`<option value="${ptype}">${ptype}</option>`);
      });
      let readMon = function(){
        let types=[$("#edittype1").val(), $("#edittype2").val()];
        let fastMove = {type: $("#editfast").val(), charge: $("#editfaststyle").val()};
        let charge1 = {type: $("#editcharge1").val(), power: $("#editc1style").val()};
        let charge2 = {type: $("#editcharge2").val(), power: $("#editc2style").val()};     
        return makeMonster(types, fastMove, [charge1, charge2], editstats);
      };
      let disableButtons = function(){
        let total = editstats.hp + editstats.att + editstats.def;
        if (total >= 6){
          $("#atkup").prop("disabled", true);
          $("#defup").prop("disabled", true);       
          $("#stamup").prop("disabled", true);
          $("#atkdown").prop("disabled", false);
          $("#defdown").prop("disabled", false);       
          $("#stamdown").prop("disabled", false);
          return;
        }
          $("#atkup").prop("disabled", false);
          $("#defup").prop("disabled", false);       
          $("#stamup").prop("disabled", false);      
          $("#atkdown").prop("disabled", false);
          $("#defdown").prop("disabled", false);       
          $("#stamdown").prop("disabled", false);
        if (editstats.hp <= 0){
          $("#stamdown").prop("disabled", true);
        }
        if (editstats.att <= 0){
          $("#atkdown").prop("disabled", true);
        }      
        if (editstats.def <= 0){
          $("#defdown").prop("disabled", true);
        }
      };
      $("#atkup").click(()=>{
        editstats.att += 1;
        $("#editatk").html((100 + 25*editstats.att).toString());
        disableButtons();
      });
      $("#atkdown").click(()=>{
        editstats.att -= 1;
        $("#editatk").html((100 + 25*editstats.att).toString());
        disableButtons();
      });      
      $("#defup").click(()=>{
        editstats.def += 1;
        $("#editdef").html((100 + 25*editstats.def).toString());
        disableButtons();
      });    
      $("#defdown").click(()=>{
        editstats.def -= 1;
        $("#editdef").html((100 + 25*editstats.def).toString());
        disableButtons();
      });
      $("#stamup").click(()=>{
        editstats.hp += 1;
        $("#editstam").html((100 + 25*editstats.hp).toString());
        disableButtons();
      });
      $("#stamdown").click(()=>{
        editstats.hp -= 1;
        $("#editstam").html((100 + 25*editstats.hp).toString());
        disableButtons();
      });
      $("#doneditmon").click(()=>{
        let result = readMon();
        console.log(result);
        teamObj.team[editedMonId] = result;
        $(".editmondisplay").html('');
        renderEditTeam(teamObj);
        availableTeams[teamguid] = teamObj;
        firebase.database().ref("users").child(userid).child("teams").child(teamguid).set(teamObj);
        renderTeamOption(teamObj);
      });
    
    });
    $(".changename").click(()=>{
      let newname = prompt("New Team Name?");
      teamObj.teamname = newname || "No Name Set";
      renderEditTeam(teamObj);
    });
    
    $(".alldone").click(()=>{
      let reply = confirm("All Done Editing?");
      if (!!reply){
        availableTeams[teamguid] = teamObj;
        firebase.database().ref("users").child(userid).child("teams").child(teamguid).set(teamObj);
        renderTeamOption(teamObj);
        $("#monstermaker").html("");
      }
    })
    let renderEditTeam = function(teamObj){
      $(".editteamname").html(teamObj.teamname);
    $("#editmons").html(`
       <div class="team-demo">
         <div class="mons">
${renderMonster(teamObj.team.mon1, "Lead").html()}
         </div>
         <div class="mons">${renderMonster(teamObj.team.mon2, "Swap").html()}
         </div>
         <div class="mons">${renderMonster(teamObj.team.mon3, "Close").html()}
         </div>
       </div>
    `);
    }
    renderEditTeam(teamObj);
  }

  let makeNewTeam = function(){
    let newteam = {teamname: $("#newname").val() || "New Team", team: {
        mon1: makeMonster(
      ["normal"],
      {type:"normal",charge:"med"},
      [{type:"normal",power:"med"},{type:"normal",power:"med"}],
      {hp:2,att:2,def:2}), 
        mon2: makeMonster(
      ["normal"],
      {type:"normal",charge:"med"},
      [{type:"normal",power:"med"},{type:"normal",power:"med"}],
      {hp:2,att:2,def:2}), 
        mon3: makeMonster(
      ["normal"],
      {type:"normal",charge:"med"},
      [{type:"normal",power:"med"},{type:"normal",power:"med"}],
      {hp:2,att:2,def:2})}
     };
    let newRef = firebase.database().ref("users").child(userid).child("teams").push();
    newRef.set(newteam);
  };
  $("#makenew").click(makeNewTeam);
  
  let renderTeamOption = function(teamObj){
    $(`.team-select[data-guid=${teamObj.guid}]`).html("");
    $("#teamselect").prepend(`<div class="team-select" data-guid=${teamObj.guid}>
       <div class="team-header">
         <span class="team-title">${teamObj.teamname}</span>
         <button class="teambutton" data-guid=${teamObj.guid}>Select the team: ${teamObj.teamname}</button>
         <button class="teamedit" data-guid=${teamObj.guid}>Edit this team</button>
       </div>
       <div class="team-demo">
         <div class="mons">${renderMonster(teamObj.team.mon1, "lead").html()}</div>
         <div class="mons">${renderMonster(teamObj.team.mon2, "swap").html()}</div>
         <div class="mons">${renderMonster(teamObj.team.mon3, "close").html()}</div>
       </div>
    </div>`);
    availableTeams[teamObj.guid] = teamObj;
    $(".teambutton").on("click", function(evt){
      let teamguid = $(evt.currentTarget).attr("data-guid");
      let theteam = availableTeams[teamguid].team;
      commitTeam(theteam);
    });
    $(".teamedit").on("click", function(evt){
      let teamguid = $(evt.currentTarget).attr("data-guid");
      editTeam(teamguid);
    });
  };
  
//https://supernumbergame.firebaseio.com/users/andy1234/teams/guidhere
  firebase.database().ref("users").child(userid).child("teams").on("child_added", ss=>{
    let data = ss.val();
    if (!data){
      return;
    }
    data.guid = ss.key;
    renderTeamOption(data);
  });
};

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

let gotoScreen = function(params){
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
  $("body").html(`<button id="newgame">Click To Make Game</button>`);
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
    res.maxplayers = gameJSON.maxplayers || 2;
    res.players = gameJSON.players || false;
    res.status = gameJSON.status || `Starting Up`;
    return res;
  }

  $("#newgame").click(()=>{
    let newGameref = mygamesDB.push();
    let gameObj = makeGame({});
    gameObj.creator = userid;
    gameObj.gameid = newGameref.key;
    gameObj.players = {};
    gameObj.players[userid] = userobj;
    newGameref.set(gameObj);
  });
};

renderLobby();