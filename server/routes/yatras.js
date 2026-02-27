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

// GET all yatras
router.get('/', async (req, res) => {
    try {
        const yatras = await readDataFile('yatras.json');
        res.json(yatras);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch yatras' });
    }
});

// GET yatra by ID
router.get('/:id', async (req, res) => {
    try {
        const yatras = await readDataFile('yatras.json');
        const yatraId = parseInt(req.params.id);
        const yatra = yatras.find(y => y.id === yatraId);
        
        if (!yatra) {
            return res.status(404).json({ error: 'Yatra not found' });
        }
        
        res.json(yatra);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch yatra' });
    }
});

export default router;