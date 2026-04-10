import { Router } from 'express';
import surveyRouter from './survey.js';
import usersRouter from './users.js';
import mentorsRouter from './mentors.js';
import mentoringsRouter from './mentorings.js';
import scriptsRouter from './scripts.js';

const router = Router();

router.use('/survey', surveyRouter);
router.use('/users', usersRouter);
router.use('/mentors', mentorsRouter);
router.use('/mentorings', mentoringsRouter);
router.use('/scripts', scriptsRouter);

export default router;