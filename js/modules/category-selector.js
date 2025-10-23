import { stateManager } from "../shared/stateManager.js";

document.addEventListener("DOMContentLoaded", async () => {
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
    const workoutCategory = document.querySelectorAll(
      'input[name="workoutCategory"]:checked'
    ).length;
    const muscleSelected = document.querySelectorAll(
      'input[name="muscleGroup"]:checked'
    ).length;
    const submitBtn = document.getElementById("submitBtn");

    submitBtn.disabled = !(workoutCategory > 0 && muscleSelected > 0);
  }

  // Redirecionar para página de resultados
  document.getElementById("submitBtn").addEventListener("click", function () {
    const selectedCategories = Array.from(
      document.querySelectorAll('input[name="workoutCategory"]:checked')
    ).map((cb) => cb.value);
    const selectedMuscleGroups = Array.from(
      document.querySelectorAll('input[name="muscleGroup"]:checked')
    ).map((cb) => cb.value);

    // Salvar no localStorage
    localStorage.setItem(
      "selectedCategories",
      JSON.stringify(selectedCategories)
    );
    localStorage.setItem(
      "selectedMuscleGroups",
      JSON.stringify(selectedMuscleGroups)
    );
    stateManager
      .updateCategoriesAndMuscleGroup(selectedCategories, selectedMuscleGroups)
      .then(() => {
        window.location.href = "../../pages/exercises-selector.html";
      });
  });

  // Inicializar
  setupCheckboxLimits("workoutCategory");
  setupCheckboxLimits("muscleGroup");
});
