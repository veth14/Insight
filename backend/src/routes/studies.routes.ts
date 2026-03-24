import { Router } from 'express';
import { uploadStudy, getMyStudies, pdfUpload } from '../controllers/studies.controller';
import {
    searchStudies,
    getBookmarks,
    toggleBookmark,
    checkBookmark,
    getReadingHistory,
    updateProgress,
    getDashboard,
    getStudyById,
    getTrendingTopics,
    trackDownload,
} from '../controllers/library.controller';
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

/**
 * @route   GET /api/studies/search
 * @desc    Full-text search across approved studies with filters
 * @access  Private
 */
/**
 * @route   GET /api/studies/dashboard
 * @desc    Personalised dashboard data (stats, recentlyAdded, recommended, trending)
 * @access  Private
 */
router.get('/dashboard', getDashboard);

router.get('/search', searchStudies);

/**
 * @route   GET /api/studies/bookmarks
 * @desc    Get all studies bookmarked by the current user
 * @access  Private
 */
router.get('/bookmarks', getBookmarks);

/**
 * @route   GET /api/studies/reading-history
 * @desc    Get reading history with progress for the current user
 * @access  Private
 */
router.get('/reading-history', getReadingHistory);

/**
 * @route   GET /api/studies/bookmarks/check/:id
 * @desc    Check if a study is bookmarked by the current user
 * @access  Private
 */
router.get('/bookmarks/check/:id', checkBookmark);

/**
 * @route   POST /api/studies/:id/bookmark
 * @desc    Toggle bookmark on a study (add / remove)
 * @access  Private
 */
router.post('/:id/bookmark', toggleBookmark);

/**
 * @route   PUT /api/studies/:id/progress
 * @desc    Upsert reading progress for a study
 * @access  Private
 */
router.put('/:id/progress', updateProgress);

/**
 * @route   GET /api/studies/trending-topics
 * @desc    Distinct categories ranked by study count
 * @access  Private
 */
router.get('/trending-topics', getTrendingTopics);

/**
 * @route   GET /api/studies/:id
 * @desc    Get single approved study with signed URLs + bookmark status
 * @access  Private
 */
router.get('/:id', getStudyById);

/**
 * @route   POST /api/studies/:id/download
 * @desc    Increment download count for a study
 * @access  Private
 */
router.post('/:id/download', trackDownload);

export default router;
