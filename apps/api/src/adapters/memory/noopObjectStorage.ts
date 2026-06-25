import type { ObjectStorage } from "../../ports/objectStorage.js";

export function createNoopObjectStorage(): ObjectStorage {
  return {
    enabled: false,
    async putObject(key) {
      return { key };
    },
    async deleteObject() {
      return;
    }
  };
}
