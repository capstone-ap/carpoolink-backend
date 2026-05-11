import { Router } from 'express';
import surveyRouter from './surveys.js';
import usersRouter from './users.js';
import mentorsRouter from './mentors.js';
import mentoringsRouter from './mentorings.js';
import scriptsRouter from './scripts.js';

const router = Router();

router.use('/api/surveys', surveyRouter);
router.use('/api/users', usersRouter);
router.use('/api/mentors', mentorsRouter);
router.use('/api/mentorings', mentoringsRouter);
router.use('/api/scripts', scriptsRouter);

export default router;