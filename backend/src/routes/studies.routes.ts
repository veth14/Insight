import { Router } from 'express';
import { uploadStudy, getMyStudies, pdfUpload } from '../controllers/studies.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All study routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/studies/upload
 * @desc    Upload a research PDF + metadata; creates pending AcademicStudy
 * @access  Private (4th year students)
 */
router.post('/upload', pdfUpload.fields([{ name: 'pdf', maxCount: 1 }, { name: 'image', maxCount: 1 }]), uploadStudy);

/**
 * @route   GET /api/studies/my
 * @desc    Get all studies uploaded by the current user
 * @access  Private
 */
router.get('/my', getMyStudies);

export default router;
