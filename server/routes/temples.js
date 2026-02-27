import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Helper function to read JSON data
const readDataFile = async (filename) => {
    try {
        const dataPath = path.join(__dirname, '../../data', filename);
        const data = await fs.readFile(dataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        return [];
    }
};

// GET all temples
router.get('/', async (req, res) => {
    try {
        const temples = await readDataFile('temples.json');
        res.json(temples);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch temples' });
    }
});

// GET temple by ID
router.get('/:id', async (req, res) => {
    try {
        const temples = await readDataFile('temples.json');
        const templeId = parseInt(req.params.id);
        const temple = temples.find(t => t.id === templeId);
        
        if (!temple) {
            return res.status(404).json({ error: 'Temple not found' });
        }
        
        res.json(temple);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch temple' });
    }
});

export default router;