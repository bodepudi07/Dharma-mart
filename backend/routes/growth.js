import express from 'express';
import db from '../db.js';
import { authenticate } from './middleware/auth.js';
import { standardResponse, errorResponse } from '../middleware/responseHandler.js';

const router = express.Router();

const XP_PER_TASK = 50;
const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 2000, 4000, 8000, 15000];

const getLevelFromXp = (xp) => {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
    }
    return 1;
};

const createTemplate = (userId) => ({
    userId,
    id: Date.now(),
    xp: 0,
    level: 1,
    xpForNextLevel: LEVEL_THRESHOLDS[1],
    xpForCurrentLevel: LEVEL_THRESHOLDS[0],
    streak: 0,
    dailyTasks: [
        { type: 'meditate', isCompleted: false },
        { type: 'seva', isCompleted: false },
        { type: 'shloka', isCompleted: false },
        { type: 'darshan', isCompleted: false },
        { type: 'chant', isCompleted: false },
    ],
    lastUpdate: new Date().toISOString().split('T')[0],
});

const processGrowthData = (userData, userId) => {
    const todayStr = new Date().toISOString().split('T')[0];

    // Reset daily tasks if last update was not today
    if (userData.lastUpdate !== todayStr) {
        userData.dailyTasks = createTemplate(userId).dailyTasks;
        userData.lastUpdate = todayStr;
    }

    if (!userData.dailyTasks) {
        userData.dailyTasks = createTemplate(userId).dailyTasks;
    }

    const level = getLevelFromXp(userData.xp);
    return {
        userId: userData.userId,
        xp: userData.xp,
        streak: userData.streak,
        level,
        xpForCurrentLevel: LEVEL_THRESHOLDS[level - 1],
        xpForNextLevel: LEVEL_THRESHOLDS[level] || userData.xp,
        dailyTasks: userData.dailyTasks,
        lastUpdate: userData.lastUpdate,
    };
};

// GET spiritual growth for a user
router.get('/:userId', authenticate, async (req, res, next) => {
    const userId = parseInt(req.params.userId);
    if (req.user.id !== userId && req.user.role !== 'admin') {
        return errorResponse(res, 403, 'Access denied');
    }

    try {
        const allGrowth = await db.read('spiritual_growth.json');
        let userData = allGrowth.find(d => d.userId === userId);

        if (!userData) {
            return standardResponse(res, 200, processGrowthData(createTemplate(userId), userId));
        }

        const processed = processGrowthData(userData, userId);
        // Persist any daily task resets
        await db.write('spiritual_growth.json', allGrowth);
        return standardResponse(res, 200, processed);
    } catch (error) {
        next(error);
    }
});

// POST complete a spiritual task
router.post('/:userId/complete-task', authenticate, async (req, res, next) => {
    const userId = parseInt(req.params.userId);
    if (req.user.id !== userId) {
        return errorResponse(res, 403, 'Access denied');
    }

    const { taskType } = req.body;
    if (!taskType) return errorResponse(res, 400, 'taskType is required');

    try {
        const allGrowth = await db.read('spiritual_growth.json');
        let userData = allGrowth.find(d => d.userId === userId);

        if (!userData) {
            userData = createTemplate(userId);
            allGrowth.push(userData);
        }

        // Ensure daily tasks are fresh
        const todayStr = new Date().toISOString().split('T')[0];
        if (userData.lastUpdate !== todayStr) {
            userData.dailyTasks = createTemplate(userId).dailyTasks;
            userData.lastUpdate = todayStr;
        }

        const task = userData.dailyTasks.find(t => t.type === taskType);
        if (!task) return errorResponse(res, 400, 'Invalid task type');
        if (task.isCompleted) return standardResponse(res, 200, processGrowthData(userData, userId), 'Task already completed today');

        task.isCompleted = true;

        // Streak multiplier: min(2, 1 + streak * 0.1)
        const multiplier = Math.min(2, 1 + (userData.streak || 0) * 0.1);
        const baseXP = taskType === 'chant' ? 108 : XP_PER_TASK;
        const xpGain = Math.round(baseXP * multiplier);
        userData.xp += xpGain;

        // Check if all tasks completed today for streak
        const allCompleted = userData.dailyTasks.every(t => t.isCompleted);
        if (allCompleted) {
            userData.streak = (userData.streak || 0) + 1;
        }

        await db.write('spiritual_growth.json', allGrowth);
        return standardResponse(res, 200, processGrowthData(userData, userId), `+${xpGain} XP earned!`);
    } catch (error) {
        next(error);
    }
});

export default router;
