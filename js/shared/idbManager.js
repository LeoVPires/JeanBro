import { openDB } from "https://unpkg.com/idb?module";

class IDBManager {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return this.db;

    this.db = await openDB("JeanBroDB", 1, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Store para exercícios base
        if (!db.objectStoreNames.contains("exercises")) {
          const store = db.createObjectStore("exercises", { keyPath: "id" });
          store.createIndex("muscleGroup", "muscleGroup");
          store.createIndex("category", "category");
        }

        // Store para alongamentos
        if (!db.objectStoreNames.contains("stretching")) {
          const store = db.createObjectStore("stretching", { keyPath: "id" });
          store.createIndex("muscleGroup", "muscleGroup");
        }

        // Store para estado da aplicação (apenas 1 registro)
        if (!db.objectStoreNames.contains("appState")) {
          db.createObjectStore("appState", { keyPath: "id" });
        }

        // Store para rotinas salvas
        if (!db.objectStoreNames.contains("routines")) {
          const store = db.createObjectStore("routines", {
            keyPath: "id",
            autoIncrement: true,
          });
          store.createIndex("createdAt", "createdAt");
          store.createIndex("name", "name");
        }
      },
    });

    this.initialized = true;
    return this.db;
  }

  // Exercícios
  async loadInitialExercisesIfNeeded(exercisesData) {
    const db = await this.init();
    const count = await db.count("exercises");

    if (count === 0) {
      console.log("Carregando exercícios iniciais...");
      const tx = db.transaction("exercises", "readwrite");
      const store = tx.objectStore("exercises");

      for (const exercise of exercisesData) {
        await store.put(exercise);
      }
      await tx.done;
    }
  }

  async getExercisesByCategoriesAndMuscleGroup(
    selectedCategories,
    selectedMuscleGroups
  ) {
    const db = await this.init();
    const allExercises = await db.getAll("exercises");
    return allExercises.filter((exercise) => {
      const matchesWorkout =
        selectedCategories.length === 0 ||
        selectedCategories.includes(exercise.categories);
      const matchesMuscle =
        selectedMuscleGroups.length === 0 ||
        selectedMuscleGroups.includes(exercise.muscleGroups);

      return matchesWorkout && matchesMuscle;
    });
  }

  // Alongamentos
  async loadStretchingDataIfNeeded(stretchingData) {
    const db = await this.init();
    const count = await db.count("stretching");

    if (count === 0) {
      console.log("Carregando dados de alongamento...");
      const tx = db.transaction("stretching", "readwrite");
      const store = tx.objectStore("stretching");

      for (const stretch of stretchingData) {
        await store.put(stretch);
      }
      await tx.done;
    }
  }

  async getStretchingByMuscleGroups(muscleGroups) {
    const db = await this.init();
    const allStretching = await db.getAll("stretching");
    return allStretching.filter((stretch) =>
      stretch.muscleGroups.some((mg) => muscleGroups.includes(mg))
    );
  }

  // Estado da aplicação
  async saveAppState(state) {
    const db = await this.init();
    await db.put("appState", { id: "current", ...state });
  }

  async getAppState() {
    const db = await this.init();
    const state = await db.get("appState", "current");
    if (state) {
      const { id, ...cleanState } = state;
      return cleanState;
    }
    return null;
  }

  async clearAppState() {
    const db = await this.init();
    await db.delete("appState", "current");
  }

  // Rotinas
  async saveRoutine(routine) {
    const db = await this.init();
    return await db.add("routines", routine);
  }

  async getRoutines() {
    const db = await this.init();
    return await db.getAll("routines");
  }

  async deleteRoutine(id) {
    const db = await this.init();
    await db.delete("routines", id);
  }
}

export const idbManager = new IDBManager();
