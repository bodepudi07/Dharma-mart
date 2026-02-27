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

// GET all books
router.get('/', async (req, res) => {
    try {
        const books = await readDataFile('books.json');
        res.json(books);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

// GET book by ID
router.get('/:id', async (req, res) => {
    try {
        const books = await readDataFile('books.json');
        const bookId = parseInt(req.params.id);
        const book = books.find(b => b.id === bookId);
        
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        res.json(book);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch book' });
    }
});

export default router;