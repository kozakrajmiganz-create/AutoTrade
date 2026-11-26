import express from "express";
import cors from "cors";
import path from 'node:path';
import { userController } from './Controllers/user-controller.js';

const app = express();
app.get('/api/response', userController.response)



app.listen(3000, () => { console.log('A szerver fut') });