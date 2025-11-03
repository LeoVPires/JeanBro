import { stateManager } from "../shared/stateManager.js";

class FinishRoutine {
  constructor() {
    this.selectedDays = [];
    this.init();
  }

  async init() {
    await this.loadCurrentState();
    this.setupEventListeners();
    this.updateSummary();
  }

  async loadCurrentState() {
    try {
      const state = await stateManager.loadState();
      this.currentState = state;

      // Carrega configuração salva se existir
      if (state.routineConfig) {
        this.loadSavedConfig(state.routineConfig);
      }
    } catch (error) {
      console.error("Erro ao carregar estado:", error);
      this.showError("Erro ao carregar dados da rotina.");
    }
  }

  loadSavedConfig(config) {
    // Nome do treino
    if (config.name) {
      document.getElementById("routineName").value = config.name;
      this.updateCharCounter("routineName", "nameCounter");
    }

    // Dias da semana
    if (config.daysOfWeek && config.daysOfWeek.length > 0) {
      this.selectedDays = config.daysOfWeek;
      this.updateDaysButtons();
    }

    // Horário do treino
    if (config.schedule) {
      document.getElementById("hasSchedule").checked = true;
      document
        .getElementById("scheduleTimeContainer")
        .classList.remove("hidden");
      document.getElementById("scheduleTime").value = config.schedule;
    }

    // Notificações
    if (config.notifications) {
      document.getElementById("enableNotifications").checked = true;
      document
        .getElementById("notificationTimeContainer")
        .classList.remove("hidden");
      if (config.notificationTime) {
        document.getElementById("notificationTime").value =
          config.notificationTime;
      }
    }

    // Notas pessoais
    if (config.personalNotes) {
      document.getElementById("personalNotes").value = config.personalNotes;
      this.updateCharCounter("personalNotes", "notesCounter");
    }
  }

  setupEventListeners() {
    // Contadores de caracteres
    document.getElementById("routineName").addEventListener("input", (e) => {
      this.updateCharCounter("routineName", "nameCounter");
      this.updateSummary();
    });

    document.getElementById("personalNotes").addEventListener("input", (e) => {
      this.updateCharCounter("personalNotes", "notesCounter");
      this.updateSummary();
    });

    // Dias da semana
    document.querySelectorAll(".day-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.toggleDay(parseInt(e.target.dataset.day));
      });
    });

    // Horário do treino
    document.getElementById("hasSchedule").addEventListener("change", (e) => {
      const timeContainer = document.getElementById("scheduleTimeContainer");
      if (e.target.checked) {
        timeContainer.classList.remove("hidden");
      } else {
        timeContainer.classList.add("hidden");
      }
      this.updateSummary();
    });

    document.getElementById("scheduleTime").addEventListener("change", () => {
      this.updateSummary();
    });

    // Notificações
    document
      .getElementById("enableNotifications")
      .addEventListener("change", (e) => {
        const timeContainer = document.getElementById(
          "notificationTimeContainer"
        );
        if (e.target.checked) {
          timeContainer.classList.remove("hidden");
        } else {
          timeContainer.classList.add("hidden");
        }
        this.updateSummary();
      });

    document
      .getElementById("notificationTime")
      .addEventListener("change", () => {
        this.updateSummary();
      });

    // Botões de ação
    document.getElementById("backBtn").addEventListener("click", () => {
      window.history.back();
    });

    document.getElementById("saveBtn").addEventListener("click", () => {
      this.saveRoutine();
    });

    document.getElementById("modalCloseBtn").addEventListener("click", () => {
      // Redirecionar para a página inicial ou outra página
      window.location.href = "../index.html";
    });
  }

  updateCharCounter(inputId, counterId) {
    const input = document.getElementById(inputId);
    const counter = document.getElementById(counterId);
    const maxLength = parseInt(input.getAttribute("maxlength"));
    const currentLength = input.value.length;

    counter.textContent = `${currentLength}/${maxLength}`;

    // Altera a cor se estiver perto do limite
    if (currentLength > maxLength * 0.8) {
      counter.style.color = "#ef4444";
    } else {
      counter.style.color = "#6b7280";
    }
  }

  toggleDay(day) {
    const index = this.selectedDays.indexOf(day);
    if (index > -1) {
      this.selectedDays.splice(index, 1);
    } else {
      this.selectedDays.push(day);
    }

    this.updateDaysButtons();
    this.updateSummary();
  }

  updateDaysButtons() {
    document.querySelectorAll(".day-btn").forEach((btn) => {
      const day = parseInt(btn.dataset.day);
      if (this.selectedDays.includes(day)) {
        btn.classList.add("selected");
      } else {
        btn.classList.remove("selected");
      }
    });
  }

  updateSummary() {
    const summaryContent = document.getElementById("summaryContent");
    const formData = this.getFormData();

    let html = `
            <div class="summary-item">
                <span class="summary-label">Nome:</span>
                <span class="summary-value">${
                  formData.name || "Não definido"
                }</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Dias:</span>
                <span class="summary-value">${this.getDaysText(
                  formData.daysOfWeek
                )}</span>
            </div>
        `;

    if (formData.schedule) {
      html += `
                <div class="summary-item">
                    <span class="summary-label">Horário:</span>
                    <span class="summary-value">${formData.schedule}</span>
                </div>
            `;
    }

    if (formData.notifications) {
      html += `
                <div class="summary-item">
                    <span class="summary-label">Notificações:</span>
                    <span class="summary-value">${
                      formData.notificationTime || "12:00"
                    }</span>
                </div>
            `;
    }

    if (formData.personalNotes) {
      html += `
                <div class="summary-item">
                    <span class="summary-label">Observações:</span>
                    <span class="summary-value">${formData.personalNotes.substring(
                      0,
                      50
                    )}${formData.personalNotes.length > 50 ? "..." : ""}</span>
                </div>
            `;
    }

    // Adiciona contagem de exercícios
    if (this.currentState && this.currentState.selectedExercises) {
      html += `
                <div class="summary-item">
                    <span class="summary-label">Exercícios:</span>
                    <span class="summary-value">${this.currentState.selectedExercises.length} exercícios selecionados</span>
                </div>
            `;
    }

    summaryContent.innerHTML = html;
  }

  getDaysText(days) {
    if (!days || days.length === 0) return "Nenhum dia selecionado";

    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    return days.map((day) => dayNames[day]).join(", ");
  }

  getFormData() {
    const hasSchedule = document.getElementById("hasSchedule").checked;
    const enableNotifications = document.getElementById(
      "enableNotifications"
    ).checked;

    return {
      name: document.getElementById("routineName").value.trim(),
      daysOfWeek: [...this.selectedDays].sort(),
      schedule: hasSchedule
        ? document.getElementById("scheduleTime").value
        : null,
      notifications: enableNotifications,
      notificationTime: enableNotifications
        ? document.getElementById("notificationTime").value
        : null,
      personalNotes: document.getElementById("personalNotes").value.trim(),
    };
  }

  validateForm(formData) {
    if (!formData.name) {
      throw new Error("Por favor, informe um nome para a rotina.");
    }

    // if (formData.daysOfWeek.length === 0) {
    //   throw new Error("Por favor, selecione pelo menos um dia da semana.");
    // }

    if (formData.name.length > 50) {
      throw new Error("O nome da rotina deve ter no máximo 50 caracteres.");
    }

    if (formData.personalNotes.length > 500) {
      throw new Error("As observações devem ter no máximo 500 caracteres.");
    }

    return true;
  }

  async saveRoutine() {
    try {
      const formData = this.getFormData();
      this.validateForm(formData);

      // Salva a configuração da rotina
      await stateManager.updateRoutineConfig(formData);

      // Salva a rotina completa
      const routineId = await stateManager.saveRoutine();

      // Mostra modal de sucesso
      this.showSuccessModal();

      console.log("Rotina salva com ID:", routineId);
    } catch (error) {
      this.showError(error.message);
    }
  }

  showSuccessModal() {
    const modal = document.getElementById("successModal");
    modal.classList.remove("hidden");
  }

  showError(message) {
    alert(message);
  }
}

// Inicializa a aplicação quando o DOM estiver carregado
document.addEventListener("DOMContentLoaded", () => {
  new FinishRoutine();
});
