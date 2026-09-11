// story.js

(function() {

  var stories = lib Stories;

  // Function to handle play button click
  function startGame() {
    console.log("Play button clicked!");
    
    // Show gender selection screen
    var html = `
      <div id="gender-selection-screen">
        <h1>Choose Your Hero's Gender:</h1>
        <button id="male-button">Male</button>
        <button id="female-button">Female</button>
      </div>
    `;
    
    document.getElementById("game-container").innerHTML = html;
  }

  // Add event listener to play button
  document.getElementById("play-button").addEventListener("click", function() {
    startGame();
  });
})();
