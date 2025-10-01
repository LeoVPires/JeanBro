let exercisesData = [];
let currentSelections = {};

// Carregar seleções do localStorage
function loadSelections() {
  const selectedWorkouts = JSON.parse(
    localStorage.getItem("selectedWorkouts") || "[]"
  );
  const selectedMuscleGroup = JSON.parse(
    localStorage.getItem("selectedMuscleGroup") || "[]"
  );

  return { selectedWorkouts, selectedMuscleGroup };
}

// Carregar exercícios do JSON
async function loadExercises() {
  try {
    const response = await fetch("../data/exercises.json");
    if (!response.ok) {
      throw new Error("Erro ao carregar os exercícios");
    }
    return await response.json();
  } catch (error) {
    console.error("Erro ao carregar JSON:", error);
    throw error;
  }
}

// Filtrar exercícios baseado nas seleções
function filterExercises(exercises, selectedWorkouts, selectedMuscleGroup) {
  return exercises.filter((exercise) => {
    const matchesWorkout =
      selectedWorkouts.length === 0 ||
      selectedWorkouts.includes(exercise.category);
    const matchesMuscle =
      selectedMuscleGroup.length === 0 ||
      selectedMuscleGroup.includes(exercise.muscleGroup);

    return matchesWorkout && matchesMuscle;
  });
}

// Verificar se o exercício tem carga (load)
function hasLoad(exercise) {
  if (!exercise.level) return false;

  const levels = Object.values(exercise.level);
  return levels.some((level) => level && level.load);
}

// Criar o seletor de nível e informações
function createLevelSelector(exercise) {
  if (!exercise.level) return "";

  const hasLoadProperty = hasLoad(exercise);
  const levels = ["light", "moderate", "heavy"];

  let html = `
        <div class="exercise-config">
            <div class="level-selector">
                <label for="level-${
                  exercise.id
                }"><strong>Nível de Intensidade:</strong></label>
                <select id="level-${exercise.id}" class="level-select">
                    ${levels
                      .map(
                        (level) =>
                          `<option value="${level}">${
                            level.charAt(0).toUpperCase() + level.slice(1)
                          }</option>`
                      )
                      .join("")}
                </select>
            </div>
    `;

  // Input para RM apenas se o exercício tem carga
  if (hasLoadProperty) {
    html += `
            <div class="rm-input">
                <label for="rm-${exercise.id}"><strong>Seu RM (kg):</strong></label>
                <input type="number" id="rm-${exercise.id}" min="0" step="0.5" placeholder="Ex: 100">
            </div>
        `;
  }

  // Container para informações de cada nível
  html += `<div class="level-info" id="level-info-${exercise.id}">`;

  levels.forEach((level) => {
    if (exercise.level[level]) {
      const levelData = exercise.level[level];
      const isActive = level === "light" ? "active" : "";

      html += `
                <div class="level-option ${isActive}" data-level="${level}" data-exercise="${exercise.id}">
                    
            `;

      if (levelData.reps) {
        html += `<p><strong>Repetições:</strong> ${levelData.reps}</p>`;
      }

      if (levelData.time) {
        html += `<p><strong>Tempo:</strong> ${levelData.time}</p>`;
      }

      if (levelData.load) {
        html += `<p><strong>Carga:</strong> <span class="load-display">${levelData.load}</span></p>`;
      }

      html += `</div>`;
    }
  });

  html += `</div></div>`;

  return html;
}

// Atualizar display de carga quando o RM for inserido
function updateLoadDisplay(exerciseId, rmValue) {
  const levelOptions = document.querySelectorAll(
    `.level-option[data-exercise="${exerciseId}"]`
  );

  levelOptions.forEach((option) => {
    const loadDisplay = option.querySelector(".load-display");
    if (loadDisplay) {
      const originalText =
        loadDisplay.getAttribute("data-original") || loadDisplay.textContent;
      loadDisplay.setAttribute("data-original", originalText);

      if (rmValue && !isNaN(rmValue)) {
        // Extrai porcentagens do texto (ex: "40-60% 1RM" → [40, 60])
        const percentages = originalText.match(/(\d+(\.\d+)?)/g);
        if (percentages) {
          if (percentages.length === 2) {
            const minLoad = (
              (rmValue * parseFloat(percentages[0])) /
              100
            ).toFixed(1);
            const maxLoad = (
              (rmValue * parseFloat(percentages[1])) /
              100
            ).toFixed(1);
            loadDisplay.textContent = `${originalText} (${minLoad}-${maxLoad}kg)`;
          } else if (percentages.length === 1) {
            const load = ((rmValue * parseFloat(percentages[0])) / 100).toFixed(
              1
            );
            loadDisplay.textContent = `${originalText} (${load}kg)`;
          }
        }
      } else {
        loadDisplay.textContent = originalText;
      }
    }
  });
}

// Configurar event listeners para cada exercício
function setupExerciseEvents(exercise) {
  const levelSelect = document.getElementById(`level-${exercise.id}`);
  const rmInput = document.getElementById(`rm-${exercise.id}`);
  // const openModal = document.getElementById(`open-dialog-${exercise.id}`);
  // const closeModal = document.getElementById(`close-dialog-${exercise.id}`);

  if (levelSelect) {
    levelSelect.addEventListener("change", function () {
      const selectedLevel = this.value;

      // Oculta todas as opções deste exercício
      document
        .querySelectorAll(`.level-option[data-exercise="${exercise.id}"]`)
        .forEach((option) => {
          option.classList.remove("active");
        });

      // Mostra a opção selecionada
      const selectedOption = document.querySelector(
        `.level-option[data-level="${selectedLevel}"][data-exercise="${exercise.id}"]`
      );
      if (selectedOption) {
        selectedOption.classList.add("active");
      }

      // Atualiza o display de carga se houver RM
      if (rmInput) {
        updateLoadDisplay(exercise.id, parseFloat(rmInput.value));
      }
    });
  }

  if (rmInput) {
    rmInput.addEventListener("input", function () {
      updateLoadDisplay(exercise.id, parseFloat(this.value));
    });
  }
}

// Exibir exercícios na tela
function displayExercises(exercises) {
  const container = document.getElementById("exerciseList");
  const filtersContainer = document.getElementById("appliedFilters");
  const { selectedWorkouts, selectedMuscleGroup } = loadSelections();

  // Mostrar filtros aplicados
  filtersContainer.innerHTML = `
        <p><strong>Tipos de Treino:</strong> ${
          selectedWorkouts.length > 0 ? selectedWorkouts.join(", ") : "Nenhum"
        }</p>
        <p><strong>Grupos Musculares:</strong> ${
          selectedMuscleGroup.length > 0
            ? selectedMuscleGroup.join(", ")
            : "Nenhum"
        }</p>
    `;

  // Mostrar exercícios
  if (exercises.length === 0) {
    container.innerHTML = `
            <div class="error">
                <p>Nenhum exercício encontrado com os filtros selecionados.</p>
                <p>Tente selecionar outras combinações.</p>
            </div>
        `;
    return;
  }

  container.innerHTML = exercises
    .map(
      (exercise) => `
            <div class="exercise-card">
                <div class="exercise-info">
                    <h3>${exercise.name || "Exercício sem nome"}</h3>
                    <p><strong>Tipo:</strong> ${
                      exercise.category || "Não especificado"
                    }</p>
                    <p><strong>Grupo Muscular:</strong> ${
                      exercise.muscleGroup || "Não especificado"
                    }</p>
                    
                    ${
                      exercise.description
                        ? `<p><strong>Descrição:</strong> ${exercise.description}</p>`
                        : ""
                    }
                    <button class="open-dialog" data-dialog-id="dialog-${
                      exercise.id
                    }">v</button>
                </div>
                
            </div>
            <dialog id="dialog-${exercise.id}" class="exercise-dialog">

              <img src="${exercise.img} />
              ${
                exercise.equipment
                  ? `<p><strong>Equipamento:</strong> ${exercise.equipment}</p>`
                  : ""
              }
              ${createLevelSelector(exercise)}
              <button class="close-dialog">add</button>
            </dialog>
        `
    )
    .join("");

  // Configurar eventos para cada exercício
  exercises.forEach((exercise) => {
    setupExerciseEvents(exercise);
  });
}

// Função de controle dos Dialog's
document.addEventListener("click", function (event) {
  console.log("testeeeeee");
  // Abrir o Dialog
  if (event.target.classList.contains("open-dialog")) {
    const dialogId = event.target.getAttribute("data-dialog-id");
    console.log(dialogId);
    const targetDialog = document.getElementById(dialogId);

    if (targetDialog) {
      targetDialog.showModal(); // Abre como modal
      console.log("tentando abrir");
    } else {
      console.log("nao abrir");
    }
  }

  // Fechar o Dialog
  if (event.target.classList.contains("close-dialog")) {
    // Encontra o dialog ancestral mais próximo e o fecha
    const dialog = event.target.closest("dialog");
    if (dialog) {
      dialog.close(); // Fecha o dialog
    }
  }
});

// Fechar modal clicando no backdrop (área escura atrás)
document.addEventListener(
  "click",
  function (event) {
    if (event.target.tagName === "DIALOG") {
      event.target.close();
    }
  },
  true
); // Usando event capturing

// Função principal que orquestra o carregamento
async function init() {
  try {
    const { selectedWorkouts, selectedMuscleGroup } = loadSelections();

    // Carregar e filtrar exercícios
    const allExercises = await loadExercises();

    const filteredExercises = filterExercises(
      allExercises,
      selectedWorkouts,
      selectedMuscleGroup
    );

    // Exibir resultados
    displayExercises(filteredExercises);
  } catch (error) {
    document.getElementById("exerciseList").innerHTML = `
            <div class="error">
                <p>Erro ao carregar os exercícios.</p>
                <p>Verifique se o arquivo data/exercises.json existe e está no formato correto.</p>
                <p>Detalhes do erro: ${error.message}</p>
            </div>
        `;
  }
}

// Iniciar quando a página carregar
document.addEventListener("DOMContentLoaded", init);
