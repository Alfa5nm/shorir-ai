import type { AICoach } from "../ports/aiCoach.js";
import type { Database } from "../ports/database.js";
import type { ImageProcessor } from "../ports/imageProcessor.js";
import type { ObjectStorage } from "../ports/objectStorage.js";

export interface ModuleDependencies {
  database: Database;
  aiCoach: AICoach;
  imageProcessor: ImageProcessor;
  objectStorage: ObjectStorage;
}
