// Simple file-based database using JSON files
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = path.join(__dirname, '../data');

class Database {
    constructor() {
        this.dataDir = dataDir;
    }

    async read(filename) {
        try {
            const filePath = path.join(this.dataDir, filename);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error reading ${filename}:`, error);
            return [];
        }
    }

    async write(filename, data) {
        try {
            const filePath = path.join(this.dataDir, filename);
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error(`Error writing ${filename}:`, error);
            return false;
        }
    }

    async find(filename, predicate) {
        const data = await this.read(filename);
        return data.find(predicate);
    }

    async findAll(filename) {
        return await this.read(filename);
    }

    async insert(filename, newItem) {
        const data = await this.read(filename);
        data.push(newItem);
        return await this.write(filename, data);
    }

    async update(filename, id, updates) {
        const data = await this.read(filename);
        const index = data.findIndex(item => item.id == id);
        if (index !== -1) {
            data[index] = { ...data[index], ...updates };
            return await this.write(filename, data);
        }
        return false;
    }

    async delete(filename, id) {
        const data = await this.read(filename);
        const filteredData = data.filter(item => item.id != id);
        if (filteredData.length < data.length) {
            return await this.write(filename, filteredData);
        }
        return false;
    }
}

export default new Database();