import { idbManager } from "./idbManager.js";

class StateManager {
  constructor() {
    this.currentState = {
      currentStep: 1,
      selectedCategories: [],
      selectedMuscleGroups: [],
      selectedExercises: [],
      stretchingSelections: {
        dynamic: [],
        static: [],
      },
      seriesConfig: {
        type: "sequential",
        sameForAll: true,
        globalSets: 3,
      },
      routineConfig: {
        name: "",
        daysOfWeek: [],
        schedule: null, // Corrigi o nome da propriedade
        notifications: false,
        notificationTime: "12:00",
        personalNotes: "",
      },
    };
  }

  // Salva o estado atual no IndexedDB
  async saveState() {
    await idbManager.saveAppState(this.currentState);
  }

  // Carrega o estado do IndexedDB
  async loadState() {
    const savedState = await idbManager.getAppState();
    if (savedState) {
      this.currentState = { ...this.currentState, ...savedState };
    }
    return this.currentState;
  }

  // Limpa o estado (quando o usuário completa ou cancela)
  async clearState() {
    this.currentState = {
      currentStep: 1,
      selectedCategories: [],
      selectedExercises: [],
      stretchingSelections: [],
      seriesConfig: {
        type: "sequential",
        sameForAll: true,
        globalSets: 3,
      },
      customSeries: {},
      routineConfig: {
        name: "",
        daysOfWeek: [],
        notifications: false,
        notificationTime: "12:00",
        personalNotes: "",
      },
    };
    await idbManager.clearAppState();
  }

  // Métodos específicos para cada etapa
  async updateCategoriesAndMuscleGroup(categories, muscleGroups) {
    this.currentState.selectedCategories = categories;
    this.currentState.selectedMuscleGroups = muscleGroups;
    this.currentState.currentStep = 2;
    await this.saveState();
  }

  async updateExercises(exercises) {
    this.currentState.selectedExercises = exercises;
    this.currentState.currentStep = 3;
    await this.saveState();
  }

  async updateStretching(stretchingData) {
    this.currentState.stretchingSelections = stretchingData;
    this.currentState.currentStep = 4;
    await this.saveState();
  }

  async updateSeriesConfig(config) {
    this.currentState.seriesConfig = config;
    this.currentState.currentStep = 5;
    await this.saveState();
  }

  async updateRoutineConfig(config) {
    this.currentState.routineConfig = config;
    await this.saveState();
  }

  // Finaliza e salva a rotina completa
  async saveRoutine() {
    const routine = {
      ...this.currentState.routineConfig,
      exercises: this.currentState.selectedExercises.map((exercise) => ({
        ...exercise,
        series: this.currentState.seriesConfig.sameForAll
          ? this.currentState.seriesConfig.globalSets
          : this.currentState.customSeries[exercise.id] || 3,
      })),

      stretching: this.currentState.stretchingSelections || {
        dynamic: [],
        static: [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const routineId = await idbManager.saveRoutine(routine);
    await this.clearState();
    return routineId;
  }

  getCurrentState() {
    return this.currentState;
  }
}

export const stateManager = new StateManager();
