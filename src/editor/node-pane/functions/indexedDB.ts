export default class IndexedDBExample {
  private db: IDBDatabase | null = null;

  constructor(private dbName: string, private storeName: string) {}

  async openDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = (event) => {
        reject(`Failed to open database: ${event}`);
      };

      request.onsuccess = (event) => {
        this.db = (event.target as any).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as any).result;
        db.createObjectStore(this.storeName);
      };
    });
  }

  async storeFileContents(key: string, contents: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject("Database not opened");
        return;
      }

      const transaction = this.db.transaction([this.storeName], "readwrite");
      const objectStore = transaction.objectStore(this.storeName);

      // Use add method for out-of-line keys
      const request: IDBRequest = objectStore.put({ id: key, contents });

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event: any) => {
        console.log(event);
        reject(`Failed to store file contents: ${event}`);
      };
    });
  }

  async getFileContents(id: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject("Database not opened");
        return;
      }

      const transaction = this.db.transaction([this.storeName], "readonly");
      const objectStore = transaction.objectStore(this.storeName);

      const request = objectStore.get(id);

      request.onsuccess = () => {
        resolve(request.result ? request.result.contents : null);
      };

      request.onerror = (event) => {
        reject(`Failed to retrieve file contents: ${event}`);
      };
    });
  }
}
