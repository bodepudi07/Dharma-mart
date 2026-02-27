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

// GET all poojas
router.get('/', async (req, res) => {
    try {
        const poojas = await readDataFile('poojas.json');
        res.json(poojas);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch poojas' });
    }
});

// GET pooja by ID
router.get('/:id', async (req, res) => {
    try {
        const poojas = await readDataFile('poojas.json');
        const poojaId = parseInt(req.params.id);
        const pooja = poojas.find(p => p.id === poojaId);
        
        if (!pooja) {
            return res.status(404).json({ error: 'Pooja not found' });
        }
        
        res.json(pooja);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pooja' });
    }
});

export default router;