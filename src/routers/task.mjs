// NPM modules
import express from 'express';

// local modules
import { Task } from '../models/task.mjs';
import { auth } from '../middleware/auth.mjs';

var router = express.Router();

// Creating New Task
router.post('/tasks', auth, async (req, res) => {
    const task = await new Task({
        ...req.body,
        owner: req.user._id
    });

    try {
        await task.save();
        res.status(201).send(task);
        console.log('New Task Added: ', task);

    } catch(err) {
        res.status(400).send(err.message);
    }
});

// Fetching all Tasks
router.get('/tasks', auth, async (req, res) => {
    const match = {};

    if (req.query.completed) {
        match.completed = req.query.completed === 'true';
    }

    var limit, skip = '';
    
    if (req.query.limit && req.query.skip) {
        limit = parseInt(req.query.limit);
        skip = parseInt(req.query.skip);
    } else {
        limit = 10;
        skip = 0;
    }

    const sort = {};

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split('_');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }

    try {
        // const tasks = await Task.find({
        //     owner: req.user._id
        // });
        
        await req.user.populate({
            path: 'tasks',
            match,
            options: { limit, skip, sort }
        });
        res.status(200).send(req.user.tasks);
    } catch(err) {
        res.status(500).send(err);
    }
});

// Fetching one Task
router.get('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            owner: req.user._id
        });
        
        if (!task) {
            return res.status(404).send('Task Not Found!');
        }
        
        console.log('User Tasks: ', task);

        res.status(200).send(task);
    } catch(err) {
        res.status(500).send(err);
    }
});

// Update a Task
router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['description', 'completed'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update)); 

    if (!isValidOperation) {
        return res.status(400).send({
            error: 'Invalid Updates!'
        });
    }

    try {
        const task = await Task.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!task) {
            return res.status(404).send('Task Not Found!');
        }

        updates.forEach((update) => task[update] = req.body[update]);
        await task.save();

        console.log('Task Updated: ', task);
        res.send(task);
    } catch (e) {
        res.status(400).send(e.message);
    }
});

// Delete a Task
router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!task) {
            return res.status(404).send('Task Not Found!');
        }

        console.log(task);

        res.send(task);
    } catch (e) {
        res.status(400).send(e);
    }
});

var taskRouter = router;

export { taskRouter };