// Listener das checkboxes
function setupCheckboxLimits(groupName) {
  const checkboxes = document.querySelectorAll(`input[name="${groupName}"]`);
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      updateSubmitButton();
    });
  });
}

// Habilitar/desabilitar botão de submit
function updateSubmitButton() {
  const workoutSelected = document.querySelectorAll(
    'input[name="workoutType"]:checked'
  ).length;
  const muscleSelected = document.querySelectorAll(
    'input[name="muscleGroup"]:checked'
  ).length;
  const submitBtn = document.getElementById("submitBtn");

  submitBtn.disabled = !(workoutSelected > 0 && muscleSelected > 0);
}

// Redirecionar para página de resultados
document.getElementById("submitBtn").addEventListener("click", function () {
  const selectedWorkouts = Array.from(
    document.querySelectorAll('input[name="workoutType"]:checked')
  ).map((cb) => cb.value);
  const selectedMuscles = Array.from(
    document.querySelectorAll('input[name="muscleGroup"]:checked')
  ).map((cb) => cb.value);

  // Salvar no localStorage
  localStorage.setItem("selectedWorkouts", JSON.stringify(selectedWorkouts));
  localStorage.setItem("selectedMuscleGroup", JSON.stringify(selectedMuscles));

  // Redirecionar para página de rotina
  window.location.href = "../CreateRoutine/routine.html";
});

// Inicializar
setupCheckboxLimits("workoutType");
setupCheckboxLimits("muscleGroup");
