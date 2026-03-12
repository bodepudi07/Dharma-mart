import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = path.join(__dirname, 'database');

/**
 * A robust JSON-based database engine.
 * It caches data in memory to avoid repetitive disk I/O, ensuring high performance.
 * It queues write operations to prevent file corruption during concurrent updates.
 */
class Database {
    constructor() {
        this.dataDir = dataDir;
        this.memoryCache = new Map();
        this.writeQueue = new Map();
    }

    /**
     * Validates and resolves a collection path, preventing path traversal attacks.
     */
    _resolveCollectionPath(collection) {
        const filePath = path.join(this.dataDir, collection);
        const resolved = path.resolve(filePath);
        if (!resolved.startsWith(path.resolve(this.dataDir))) {
            throw new Error(`Invalid collection path: ${collection}`);
        }
        return resolved;
    }

    /**
     * Reads a collection from memory or disk.
     */
    async read(collection) {
        if (this.memoryCache.has(collection)) {
            return this.memoryCache.get(collection);
        }

        try {
            const filePath = this._resolveCollectionPath(collection);
            const data = await fs.readFile(filePath, 'utf8');
            const parsedData = JSON.parse(data);
            this.memoryCache.set(collection, parsedData);
            return parsedData;
        } catch (error) {
            if (error.code === 'ENOENT') {
                // File doesn't exist yet, return empty array and create it
                this.memoryCache.set(collection, []);
                return [];
            }
            console.error(`DB Read Error [${collection}]:`, error.message);
            return [];
        }
    }

    /**
     * Writes data safely to disk using atomic write pattern.
     */
    async write(collection, data) {
        this.memoryCache.set(collection, data);

        const filePath = this._resolveCollectionPath(collection);
        const tempPath = filePath + '.tmp';
        const dataString = JSON.stringify(data, null, 2);

        let promise = this.writeQueue.get(collection) || Promise.resolve();

        promise = promise.then(async () => {
            try {
                // Atomic write: write to temp file first, then rename
                await fs.writeFile(tempPath, dataString, 'utf8');
                await fs.rename(tempPath, filePath);
                return true;
            } catch (error) {
                console.error(`DB Write Error [${collection}]:`, error.message);
                // Clean up temp file if it exists
                try { await fs.unlink(tempPath); } catch { }
                return false;
            }
        });

        this.writeQueue.set(collection, promise);
        return promise;
    }

    async findOne(collection, predicate) {
        const data = await this.read(collection);
        return data.find(predicate) || null;
    }

    async find(collection, query = {}) {
        let data = await this.read(collection);

        if (query.filter) {
            data = data.filter(query.filter);
        }

        if (query.sort) {
            data = [...data].sort(query.sort);
        }

        if (query.offset !== undefined || query.limit !== undefined) {
            const offset = query.offset || 0;
            const limit = query.limit || data.length;
            data = data.slice(offset, offset + limit);
        }

        return data;
    }

    async insert(collection, item) {
        const data = await this.read(collection);

        if (!item.id) {
            item.id = data.length > 0 ? Math.max(...data.map(d => d.id || 0)) + 1 : 1;
        }

        data.push(item);
        await this.write(collection, data);
        return item;
    }

    async update(collection, id, updates) {
        const data = await this.read(collection);
        const index = data.findIndex(item => String(item.id) === String(id));

        if (index === -1) return null;

        data[index] = { ...data[index], ...updates };
        await this.write(collection, data);
        return data[index];
    }

    async delete(collection, id) {
        const data = await this.read(collection);
        const filteredData = data.filter(item => String(item.id) !== String(id));

        if (filteredData.length === data.length) return false;

        await this.write(collection, filteredData);
        return true;
    }
}

export default new Database();