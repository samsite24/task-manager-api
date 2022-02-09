// NPM modules
import express from 'express';

// local modules
import './db/mongoose.mjs';

// Routers
import { userRouter } from './routers/user.mjs';
import { taskRouter } from './routers/task.mjs';

const app = express();

// Middlewares
// app.use((req, res, next) => {
//     if (req.method) {
//         res.status(503).send('Website is under maintainence. All requets are denied... ');
//     } else {
//         next();
//     }
// });
app.use(express.json());

// Route handlers
app.use(userRouter);
app.use(taskRouter);

// Initiating the server
var port = process.env.PORT;

app.listen(port, () => {
    console.log(`Server running on port ${port}...`);
});