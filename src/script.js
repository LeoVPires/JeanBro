const timers = document.querySelectorAll(".timer");
const display = document.getElementById("display");
const alarmSound = document.getElementById("alarmSound");

let countdown;
let timeLeft = 0;
let activeTimerButton = null;

function startTimer(seconds) {
  // Se um timer já está ativo, pare-o
  if (countdown) {
    clearInterval(countdown);
  }
  timeLeft = seconds;
  countdown = setInterval(() => {
    timeLeft--;
    if (timeLeft === 4) {
      alarmSound.play();
    }
    if (timeLeft < 0) {
      clearInterval(countdown);
      display.textContent = "00:00";
      activeTimerButton = null;
      return;
    }
    updateDisplay(timeLeft);
  }, 1000);
}

function updateDisplay(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainderSeconds = seconds % 60;
  const displayMinutes = `${minutes < 10 ? "0" : ""}${minutes}`;
  const displaySeconds = `${
    remainderSeconds < 10 ? "0" : ""
  }${remainderSeconds}`;
  display.textContent = `${displayMinutes}:${displaySeconds}`;
}

timers.forEach((button) => {
  button.addEventListener("click", () => {
    const timeInSeconds = parseInt(button.dataset.time);

    // Se o botão clicado é o mesmo que o ativo, pause/retome
    if (button === activeTimerButton) {
      updateDisplay(0);
      timeLeft = 0;
      activeTimerButton = null;
    } else {
      // Se um novo botão é clicado, cancela o anterior e inicia um novo
      updateDisplay(timeInSeconds);
      if (countdown) {
        clearInterval(countdown);
      }
      activeTimerButton = button;
      startTimer(timeInSeconds);
    }
  });
});

// stopBtn.addEventListener("click", () => {
//   if (countdown) {
//     clearInterval(countdown);
//   }
//   timeLeft = 0;
//   isPaused = false;
//   activeTimerButton = null;
//   updateDisplay(0);
// });

// Atualiza o display inicial
updateDisplay(0);
