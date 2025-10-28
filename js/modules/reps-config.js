import { stateManager } from "../shared/stateManager.js";

class RepsConfig {
  constructor() {
    this.exercises = [];
    this.draggedItem = null;
    this.init();
  }

  async init() {
    await this.loadExercises();
    this.renderExercises();
    this.setupEventListeners();
    this.setupDragAndDrop();
  }

  async loadExercises() {
    try {
      const state = await stateManager.loadState();
      this.exercises = state.selectedExercises || [];
      console.log("Exercícios carregados:", this.exercises);

      if (this.exercises.length === 0) {
        this.showError(
          "Nenhum exercício selecionado. Volte e selecione alguns exercícios."
        );
        return;
      }
    } catch (error) {
      console.error("Erro ao carregar exercícios:", error);
      this.showError("Erro ao carregar os exercícios selecionados.");
    }
  }

  // Método CORRIGIDO para lidar com o formato real dos dados
  createExerciseCard(exercise, index) {
    const card = document.createElement("div");
    card.className = "exercise-card draggable";
    card.draggable = true;
    card.dataset.exerciseId = exercise.id;
    card.dataset.index = index;

    // O level agora é um objeto com apenas UMA chave (o nível selecionado)
    // Exemplo: { "heavy": { "reps": "20-25" } }
    const levelName = Object.keys(exercise.level)[0]; // Pega a primeira (e única) chave
    const levelConfig = exercise.level[levelName];

    console.log(`Exercício ${exercise.name}:`, {
      levelName,
      levelConfig,
      fullExercise: exercise,
    });

    // Determina que tipo de informação mostrar
    const hasReps = levelConfig && levelConfig.reps;
    const hasTime = levelConfig && levelConfig.time;
    const hasLoad = levelConfig && levelConfig.load;

    card.innerHTML = `
            <div class="drag-handle">≡</div>
            <div class="exercise-content">
                <div class="exercise-info">
                    <h3 class="name">${exercise.name}</h3>
                </div>
                
                <div class="exercise-config">
                    <p class="level"><strong>${this.capitalizeFirstLetter(
                      levelName
                    )}:</strong></p>
                    
                    ${
                      hasReps
                        ? `
                        <p class="reps">${levelConfig.reps} repetições</p>
                    `
                        : ""
                    }
                    
                    ${
                      hasTime
                        ? `
                        <p class="time">${levelConfig.time}</p>
                    `
                        : ""
                    }
                    
                    ${
                      hasLoad
                        ? `
                        <p class="load">${levelConfig.load}</p>
                    `
                        : ""
                    }
                    
                    <!-- Remove a parte do calculated-load já que não temos userLoadMin/userLoadMax -->
                </div>

                <div class="custom-sets-container" style="display: none;">
                    <label for="sets-${exercise.id}">Séries:</label>
                    <input type="number" 
                           id="sets-${exercise.id}" 
                           class="exercise-sets-input" 
                           min="1" 
                           max="20" 
                           value="3"
                           data-exercise-id="${exercise.id}">
                </div>
            </div>
        `;

    return card;
  }

  // Resto dos métodos permanecem iguais...
  setupEventListeners() {
    const sameSetsCheckbox = document.getElementById("same-sets-for-all");
    const globalSetsContainer = document.getElementById(
      "global-sets-container"
    );

    sameSetsCheckbox.addEventListener("change", (e) => {
      const isChecked = e.target.checked;
      globalSetsContainer.style.display = isChecked ? "block" : "none";
      this.toggleIndividualSets(!isChecked);
    });

    document.getElementById("next-btn").addEventListener("click", () => {
      this.saveConfigAndProceed();
    });

    document.getElementById("back-btn").addEventListener("click", () => {
      window.history.back();
    });
  }

  toggleIndividualSets(show) {
    const individualContainers = document.querySelectorAll(
      ".custom-sets-container"
    );
    individualContainers.forEach((container) => {
      container.style.display = show ? "block" : "none";
    });
  }

  setupDragAndDrop() {
    const container = document.getElementById("exercises-order");

    container.addEventListener("dragstart", (e) => {
      if (e.target.classList.contains("draggable")) {
        this.draggedItem = e.target;
        e.target.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
      }
    });

    container.addEventListener("dragend", (e) => {
      if (e.target.classList.contains("draggable")) {
        e.target.classList.remove("dragging");
        this.draggedItem = null;
      }
    });

    container.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      const afterElement = this.getDragAfterElement(container, e.clientY);
      const draggable = document.querySelector(".dragging");

      if (afterElement == null) {
        container.appendChild(draggable);
      } else {
        container.insertBefore(draggable, afterElement);
      }
    });

    container.addEventListener("drop", (e) => {
      e.preventDefault();
      this.updateExerciseOrder();
    });
  }

  getDragAfterElement(container, y) {
    const draggableElements = [
      ...container.querySelectorAll(".draggable:not(.dragging)"),
    ];

    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      { offset: Number.NEGATIVE_INFINITY }
    ).element;
  }

  updateExerciseOrder() {
    const container = document.getElementById("exercises-order");
    const newOrder = [...container.querySelectorAll(".draggable")]
      .map((card) => {
        return this.exercises.find(
          (ex) => ex.id === parseInt(card.dataset.exerciseId)
        );
      })
      .filter((ex) => ex != null);

    this.exercises = newOrder;
    console.log(
      "Nova ordem:",
      this.exercises.map((ex) => ex.name)
    );
  }

  async saveConfigAndProceed() {
    try {
      const seriesType = document.getElementById("reps-type").value;
      const sameForAll = document.getElementById("same-sets-for-all").checked;
      const globalSets = sameForAll
        ? parseInt(document.getElementById("global-sets").value)
        : null;

      const customSeries = {};

      if (!sameForAll) {
        const setInputs = document.querySelectorAll(".exercise-sets-input");
        setInputs.forEach((input) => {
          const exerciseId = parseInt(input.dataset.exerciseId);
          customSeries[exerciseId] = parseInt(input.value) || 3;
        });
      }

      const seriesConfig = {
        type: seriesType,
        sameForAll: sameForAll,
        globalSets: globalSets,
        customSeries: customSeries,
        exerciseOrder: this.exercises.map((ex) => ex.id),
      };

      await stateManager.updateSeriesConfig(seriesConfig, customSeries);
      window.location.href = "stretching-config.html";
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      this.showError("Erro ao salvar configuração. Tente novamente.");
    }
  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  showError(message) {
    alert(message);
  }

  renderExercises() {
    const container = document.getElementById("exercises-order");
    container.innerHTML = "";

    this.exercises.forEach((exercise, index) => {
      const card = this.createExerciseCard(exercise, index);
      container.appendChild(card);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new RepsConfig();
});
