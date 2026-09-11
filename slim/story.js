// story.js

(function() {

  var stories = lib Stories;

  // Function to handle play button click
  function startGame() {
    // Show gender selection screen
    showGenderSelection();
  }

  // Function to show gender selection screen
  function showGenderSelection() {
    var html = `
      <div id="gender-selection-screen">
        <h1>Choose Your Hero's Gender:</h1>
        <button id="male-button">Male</button>
        <button id="female-button">Female</button>
      </div>
    `;
    
    document.getElementById("game-container").innerHTML = html;
    
    // Add event listeners to buttons
    var maleButton = document.getElementById("male-button");
    var femaleButton = document.getElementById("female-button");
    
    maleButton.addEventListener("click", function() {
      selectMaleHero();
    });
    
    femaleButton.addEventListener("click", function() {
      selectFemaleHero();
    });
  }

  // Function to show hero description after gender selection
  function showHeroDescription(gender) {
    var html = `
      <div id="hero-description-screen">
        <h1>Your Hero:</h1>
        ${gender === "male" ? "<p>Meet Eryndor Thorne, a brave and noble knight.</p>" : "<p>Meet Elara Moonwhisper, a skilled and agile warrior.</p>"}
      </div>
    `;
    
    document.getElementById("game-container").innerHTML = html;
  }

  // Function to handle male hero selection
  function selectMaleHero() {
    showHeroDescription("male");
  }

  // Function to handle female hero selection
  function selectFemaleHero() {
    showHeroDescription("female");
  }

  // Initialize SugarCube.
  window.sugarcube = new Sugarcube({
    "includeJS": ["lib/twine.js"],
    "storyName": "Adventure Game",
    "startPageID": "intro"
  });

  // Add event listener to play button
  document.getElementById("play-button").addEventListener("click", function() {
    startGame();
  });
})();

// SugarCube setup
window.sugarcube.setup(function() {
  this.start("intro");
});
