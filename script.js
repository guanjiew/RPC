// Set the base URL for your server
axios.defaults.baseURL = "https://localhost:3000"; // Replace with your server URL
axios.defaults.withCredentials = true;

function login() {
  axios.post("/login")
    .then((response) => {
      console.log("Login successful!");
    })
    .catch((error) => {
      console.error("An error occurred while logging in:", error);
    });
}


function logout() {
  axios.post("/logout")
    .then((response) => {
      console.log("Logout successful!");
    })
    .catch((error) => {
      console.error("An error occurred while logging out:", error);
    });
}

function makeChoice(playerChoice) {
  var buttons = document.querySelectorAll(".choices button");
  buttons.forEach(function (button) {
    button.classList.remove("highlight");
  });

  var computerChoice = getComputerChoice();
  var result = determineWinner(playerChoice, computerChoice);

  var resultMessage = document.querySelector(".result-message");
  resultMessage.innerHTML =
    "<p>You chose " +
    playerChoice +
    ".<br>The computer chose " +
    computerChoice +
    ".</p><p>" +
    result +
    "</p>";

  // Log the game result to the server-side database
  logGameResult(playerChoice, computerChoice, result);
}

function getComputerChoice() {
  var choices = ["rock", "paper", "scissors"];
  var randomIndex = Math.floor(Math.random() * 3);
  return choices[randomIndex];
}

function determineWinner(playerChoice, computerChoice) {
  if (playerChoice === computerChoice) {
    return "It's a tie!";
  }

  if (
    (playerChoice === "rock" && computerChoice === "scissors") ||
    (playerChoice === "paper" && computerChoice === "rock") ||
    (playerChoice === "scissors" && computerChoice === "paper")
  ) {
    return "You win!";
  } else {
    return "You lose!";
  }
}

function logGameResult(playerChoice, computerChoice, result) {
  axios
    .post("/record", {
      playerChoice: playerChoice,
      computerChoice: computerChoice,
      result: result,
    })
    .then(function (response) {
      console.log("Game result logged successfully!");
    })
    .catch(function (error) {
      console.error("An error occurred while logging the game result:", error);
    });
}

var currentPage = 1;
var pageSize = 5; // Number of results per page

// Function to fetch game results from the server and update the table
function fetchGameResults(page) {
  axios
    .get("/game-results", {
      params: {
        page: page,
        pageSize: pageSize,
      },
    })
    .then((response) => {
      var tableBody = document.querySelector("#game-results-table tbody");
      tableBody.innerHTML = "";

      console.log("Game results:", response.data.results);

      response.data.results.forEach((result) => {
        var row = document.createElement("tr");
        row.innerHTML = `
              <td>${result.player1}</td>
              <td>${result.player2}</td>
              <td>${result.result}</td>
            `;
        tableBody.appendChild(row);
      });

      updatePagination(response.data.totalPages);
    })
    .catch((error) => {
      console.error("Error fetching game results:", error);
    });
}

// Function to update the pagination buttons
function updatePagination(totalPages) {
  var pagination = document.querySelector(".pagination");
  pagination.innerHTML = "";

  var prevButton = document.createElement("button");
  prevButton.textContent = "Prev";
  prevButton.addEventListener("click", () => goToPage("prev"));
  pagination.appendChild(prevButton);

  for (var i = 1; i <= totalPages; i++) {
    var pageButton = document.createElement("button");
    pageButton.textContent = i;
    pageButton.classList.toggle("active", i === currentPage);
    pageButton.addEventListener("click", () => goToPage(i));
    pagination.appendChild(pageButton);
  }

  var nextButton = document.createElement("button");
  nextButton.textContent = "Next";
  nextButton.addEventListener("click", () => goToPage("next"));
  pagination.appendChild(nextButton);
}

// Function to navigate to a specific page or prev/next page
function goToPage(page) {
  if (page === "prev" && currentPage > 1) {
    currentPage--;
  } else if (page === "next") {
    currentPage++;
  } else {
    currentPage = page;
  }
  fetchGameResults(currentPage);
}

// Call fetchGameResults with the initial page when the page loads
window.addEventListener("load", () => fetchGameResults(currentPage));
// Call fetchGameResults when the page loads
window.addEventListener("load", fetchGameResults);
