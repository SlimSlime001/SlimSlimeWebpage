// story.js

(function() {

  // Initialize SugarCube.
  window.sugarcube = new Sugarcube({
    "includeJS": ["lib/twine.js"],
    "storyName": "Adventure Game",
    "startPageID": "intro"
  });

  // Add event listener to play button
  document.getElementById("play-button").addEventListener("click", function() {
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
  });
})();
