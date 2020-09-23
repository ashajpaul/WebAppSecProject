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
