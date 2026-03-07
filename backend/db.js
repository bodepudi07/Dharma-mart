import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = path.join(__dirname, '../data');

/**
 * A robust JSON-based database engine.
 * It caches data in memory to avoid repetitive disk I/O, ensuring high performance.
 * It queues write operations to prevent file corruption during concurrent updates.
 */
class Database {
    constructor() {
        this.dataDir = dataDir;
        this.memoryCache = new Map(); // In-memory cache: Map<filename, any[]>
        this.writeQueue = new Map();  // Promise queue for safe writes: Map<filename, Promise>
    }

    /**
     * Reads a collection from memory or disk.
     * @param {string} collection - The JSON filename (e.g., 'temples.json').
     * @returns {Promise<any[]>} The collection data.
     */
    async read(collection) {
        // Return from high-speed memory cache if initialized
        if (this.memoryCache.has(collection)) {
            return this.memoryCache.get(collection);
        }

        try {
            const filePath = path.join(this.dataDir, collection);
            const data = await fs.readFile(filePath, 'utf8');
            const parsedData = JSON.parse(data);

            // Populate cache
            this.memoryCache.set(collection, parsedData);
            return parsedData;
        } catch (error) {
            console.error(`DB Read Error [${collection}]:`, error);
            // Default to empty array if file missing
            return [];
        }
    }

    /**
     * Writes data safely to disk by queuing operations per file.
     * @param {string} collection - The JSON filename.
     * @param {any[]} data - The updated data array.
     * @returns {Promise<boolean>} True if successful.
     */
    async write(collection, data) {
        // Update high-speed memory cache immediately for instantaneous consistent reads
        this.memoryCache.set(collection, data);

        const filePath = path.join(this.dataDir, collection);
        const dataString = JSON.stringify(data, null, 2);

        // Queue the disk write to prevent race conditions Corrupting JSON files
        let promise = this.writeQueue.get(collection) || Promise.resolve();

        promise = promise.then(async () => {
            try {
                await fs.writeFile(filePath, dataString);
                return true;
            } catch (error) {
                console.error(`DB Write Error [${collection}]:`, error);
                return false;
            }
        });

        this.writeQueue.set(collection, promise);
        return promise;
    }

    // --- Query API ---

    /**
     * Finds a single item by a specific condition.
     */
    async findOne(collection, predicate) {
        const data = await this.read(collection);
        return data.find(predicate) || null;
    }

    /**
     * Retrieves all items, with optional query parameters.
     * @param {string} collection - The JSON filename.
     * @param {Object} query - Query options (limit, offset, filter).
     */
    async find(collection, query = {}) {
        let data = await this.read(collection);

        if (query.filter) {
            data = data.filter(query.filter);
        }

        if (query.sort) {
            data = data.sort(query.sort);
        }

        if (query.offset !== undefined || query.limit !== undefined) {
            const offset = query.offset || 0;
            const limit = query.limit || data.length;
            data = data.slice(offset, offset + limit);
        }

        return data;
    }

    /**
     * Inserts a new item into the collection.
     */
    async insert(collection, item) {
        const data = await this.read(collection);

        // Auto-increment ID implementation
        if (!item.id) {
            item.id = data.length > 0 ? Math.max(...data.map(d => d.id || 0)) + 1 : 1;
        }

        data.push(item);
        await this.write(collection, data);
        return item;
    }

    /**
     * Updates an existing item by ID.
     */
    async update(collection, id, updates) {
        const data = await this.read(collection);
        const index = data.findIndex(item => item.id == id);

        if (index === -1) return null;

        data[index] = { ...data[index], ...updates };
        await this.write(collection, data);
        return data[index];
    }

    /**
     * Deletes an item by ID.
     */
    async delete(collection, id) {
        const data = await this.read(collection);
        const filteredData = data.filter(item => item.id != id);

        if (filteredData.length === data.length) return false;

        await this.write(collection, filteredData);
        return true;
    }
}

// Export a singleton instance
export default new Database();