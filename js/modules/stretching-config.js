import { stateManager } from "../shared/stateManager.js";

class stretchingConfig {
  constructor() {
    this.dynamicStretches = [];
    this.staticStretches = [];
    this.init();
  }

  async init() {
    await this.loadExercises();
    await this.loadStretchings();
    this.filterStretchings();
    this.setupEventListeners();
    this.loadSavedSelection();
  }

  async loadExercises() {
    try {
      const state = await stateManager.loadState();
      this.exercises = state.selectedExercises || [];
      this.allMuscleFocus = this.exercises
        .flatMap((item) => item.muscleFocus)
        .filter((value, index, self) => self.indexOf(value) === index);
      this.allMuscleFocus.push("lombar", "pescoço");
    } catch (error) {
      console.error("Erro ao carregar exercícios:", error);
      this.showError("Erro ao carregar os exercícios selecionados.");
    }
  }

  async loadStretchings() {
    try {
      const response = await fetch("../data/stretching.json");
      if (!response.ok) {
        throw new Error("Erro ao carregar os alongamentos");
      }
      this.allStretchings = await response.json();
    } catch (error) {
      console.error("Erro ao carregar JSON:", error);
      throw error;
    }
  }

  filterStretchings() {
    if (!this.allStretchings || !this.allMuscleFocus) return;

    // Filtra alongamentos que tenham pelo menos um muscleGroup em comum
    const relevantStretchings = this.allStretchings.filter((stretching) =>
      stretching.muscleGroups.some((muscle) =>
        this.allMuscleFocus.includes(muscle)
      )
    );

    // Separa em dinâmicos e estáticos
    this.dynamicStretches = relevantStretchings.filter(
      (s) => s.type === "dynamic"
    );
    this.staticStretches = relevantStretchings.filter(
      (s) => s.type === "static"
    );
    //DEBUG: alongmanetos encontrados:
    // console.log("Alongamentos dinâmicos:", this.dynamicStretches);
    // console.log("Alongamentos estáticos:", this.staticStretches);
  }

  setupEventListeners() {
    const radioButtons = document.querySelectorAll('input[name="stretching"]');
    radioButtons.forEach((radio) => {
      radio.addEventListener("change", (event) => {
        this.handleStretchingSelection(event.target.value);
      });
    });

    const nextButton = document.getElementById("next-btn");
    if (nextButton) {
      nextButton.addEventListener("click", () => this.handleNext());
    }
  }

  handleStretchingSelection(selectedValue) {
    // DEBUG: seleção de opção de alongamentos
    // console.log("Alongamento selecionado:", selectedValue);
    this.updateStretchesVisibility(selectedValue);
  }

  updateStretchesVisibility(selectedValue) {
    const beforeDiv = document.querySelector(".stretches-before");
    const afterDiv = document.querySelector(".stretches-after");

    // Limpa TODOS os containers primeiro
    const dynamicContainer = document.getElementById("dynamic-stretches");
    const staticContainer = document.getElementById("static-stretches");

    if (dynamicContainer) dynamicContainer.innerHTML = "";
    if (staticContainer) staticContainer.innerHTML = "";

    // Reset todas as visibilidades
    beforeDiv.classList.add("hidden");
    afterDiv.classList.add("hidden");

    switch (selectedValue) {
      case "before":
        beforeDiv.classList.remove("hidden");
        this.renderStretches("dynamic", this.dynamicStretches);
        break;
      case "after":
        afterDiv.classList.remove("hidden");
        this.renderStretches("static", this.staticStretches);
        break;
      case "beforeAndAfter":
        beforeDiv.classList.remove("hidden");
        afterDiv.classList.remove("hidden");
        this.renderStretches("dynamic", this.dynamicStretches);
        this.renderStretches("static", this.staticStretches);
        break;
      case "none":
        // Garante que ambos estão vazios e hidden
        if (dynamicContainer) dynamicContainer.innerHTML = "";
        if (staticContainer) staticContainer.innerHTML = "";
        beforeDiv.classList.add("hidden");
        afterDiv.classList.add("hidden");
        break;
    }
  }

  renderStretches(type, stretches) {
    const containerId =
      type === "dynamic" ? "dynamic-stretches" : "static-stretches";
    const container = document.getElementById(containerId);

    if (!container) return;

    // Não renderiza se não houver alongamentos
    if (!stretches || stretches.length === 0) {
      container.innerHTML =
        "<p>Nenhum alongamento encontrado para esta categoria.</p>";
      return;
    }

    container.innerHTML = "";

    stretches.forEach((stretch, index) => {
      const stretchElement = this.createStretchElement(stretch, index, type);
      container.appendChild(stretchElement);
    });

    this.makeStretchesDraggable(containerId);
  }

  createStretchElement(stretch, index, type) {
    const div = document.createElement("div");
    div.className = "stretch-item draggable";
    div.draggable = true;
    div.dataset.index = index;
    div.dataset.type = type;
    div.dataset.id = stretch.name;

    div.innerHTML = `
    <div class="drag-handler"><span class="drag-handle">≡</span></div>
    <div class="stretch-header">
      <h4>${stretch.name}</h4>
    </div>
    <div class="muscle-groups">${stretch.muscleGroups.join(", ")}</div>
    <div class="stretch-content">
      <p><strong>Descrição:</strong> ${stretch.description}</p>
    </div>
    <button class="stretch-toggle-btn remove">-</button>
  `;

    // Adiciona evento de clique no botão
    const toggleBtn = div.querySelector(".stretch-toggle-btn");
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleStretch(div, toggleBtn);
    });

    return div;
  }

  toggleStretch(stretchElement, button) {
    const isRemoved = stretchElement.classList.contains("removed");

    if (isRemoved) {
      // Re-adicionar o alongamento
      stretchElement.classList.remove("removed");
      button.textContent = "-";
      button.classList.remove("add");
      button.classList.add("remove");
      stretchElement.draggable = true;

      // Reativa o drag handler
      const dragHandler = stretchElement.querySelector(".drag-handler");
      dragHandler.style.background = "#e9ecef";
      dragHandler.style.cursor = "grab";
    } else {
      // Remover o alongamento
      stretchElement.classList.add("removed");
      button.textContent = "+";
      button.classList.remove("remove");
      button.classList.add("add");
      stretchElement.draggable = false;

      // Desativa visualmente o drag handler
      const dragHandler = stretchElement.querySelector(".drag-handler");
      dragHandler.style.background = "#dee2e6";
      dragHandler.style.cursor = "not-allowed";
    }
  }

  makeStretchesDraggable(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let draggedItem = null;

    container.querySelectorAll(".draggable").forEach((item) => {
      // Drag start
      item.addEventListener("dragstart", (e) => {
        draggedItem = item;
        setTimeout(() => {
          item.classList.add("dragging");
        }, 0);
      });

      // Drag end
      item.addEventListener("dragend", (e) => {
        draggedItem = null;
        setTimeout(() => {
          item.classList.remove("dragging");
        }, 0);
      });

      // Drag over
      item.addEventListener("dragover", (e) => {
        e.preventDefault();
        const afterElement = this.getDragAfterElement(container, e.clientY);
        if (afterElement == null) {
          container.appendChild(draggedItem);
        } else {
          container.insertBefore(draggedItem, afterElement);
        }
      });
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

  getCurrentStretchOrder() {
    const dynamicOrder = [
      ...document.querySelectorAll(
        "#dynamic-stretches .stretch-item:not(.removed)"
      ),
    ].map((item) => item.dataset.id);

    const staticOrder = [
      ...document.querySelectorAll(
        "#static-stretches .stretch-item:not(.removed)"
      ),
    ].map((item) => item.dataset.id);

    return {
      dynamic: dynamicOrder,
      static: staticOrder,
    };
  }

  async loadSavedSelection() {
    try {
      const state = await stateManager.loadState();
      if (state.stretchingOption) {
        const savedRadio = document.querySelector(
          `input[value="${state.stretchingOption}"]`
        );
        if (savedRadio) {
          savedRadio.checked = true;
          this.updateStretchesVisibility(state.stretchingOption);

          // Se houver ordem salva, aplica ela
          if (state.stretchOrder) {
            setTimeout(() => this.applySavedOrder(state.stretchOrder), 100);
          }
        }
      }
    } catch (error) {
      console.error("Erro ao carregar seleção salva:", error);
    }
  }

  applySavedOrder(stretchOrder) {
    // Reordena os alongamentos baseado na ordem salva
    ["dynamic", "static"].forEach((type) => {
      const container = document.getElementById(`${type}-stretches`);
      if (container && stretchOrder[type]) {
        // Primeiro, garante que todos os alongamentos estão visíveis e não removidos
        container.querySelectorAll(".stretch-item").forEach((item) => {
          item.classList.remove("removed");
          const btn = item.querySelector(".stretch-toggle-btn");
          if (btn) {
            btn.textContent = "-";
            btn.classList.remove("add");
            btn.classList.add("remove");
          }
          item.draggable = true;
        });

        // Aplica a ordem salva
        stretchOrder[type].forEach((stretchId) => {
          const element = container.querySelector(`[data-id="${stretchId}"]`);
          if (element) {
            container.appendChild(element);
          }
        });
      }
    });
  }

  async handleNext() {
    const selectedOption = document.querySelector(
      'input[name="stretching"]:checked'
    );

    if (!selectedOption) {
      alert("Por favor, selecione uma opção de alongamento");
      return;
    }

    try {
      await stateManager.updateStretching(this.getCurrentStretchOrder());
    } catch (error) {
      console.error("Erro ao salvar seleção:", error);
    }
    // DEBUG: mostra os alongamntos que serão salvos
    // console.log(this.getCurrentStretchOrder());
    window.location.href = "finish-routine.html";
  }

  showError(message) {
    alert(message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new stretchingConfig();
});
