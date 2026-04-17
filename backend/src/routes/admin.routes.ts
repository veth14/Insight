import { Router } from 'express';
import { getUsers, updateUserStatus, updateUser, getRegistrations, approveRegistration, rejectRegistration } from '../controllers/admin.controller';
import { getAuditLogs } from '../controllers/audit.controller';
import { getUserActivities } from '../controllers/activity.controller';
import { getLiterature, approveLiterature, rejectLiterature } from '../controllers/literature.controller';
import { getAnalytics } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { UserRole } from '../types';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, authorize(UserRole.ADMIN, UserRole.FACULTY));

/**
 * @route   GET /api/admin/users
 * @desc    Get all non-admin users (supports ?status=active|suspended&search=)
 * @access  Admin / Faculty
 */
router.get('/users', getUsers);

/**
 * @route   PATCH /api/admin/users/:uid/status
 * @desc    Set a user's status to active or suspended
 * @access  Admin / Faculty
 */
router.patch('/users/:uid/status', updateUserStatus);

/**
 * @route   PUT /api/admin/users/:uid
 * @desc    Update editable user fields (name, phone, yearLevel, status, studentAccessRights)
 * @access  Admin / Faculty
 */
router.put('/users/:uid', updateUser);

/**
 * @route   GET /api/admin/audit
 * @desc    Get audit log entries (supports ?search=&limit=&skip=)
 * @access  Admin / Faculty
 */
router.get('/audit', getAuditLogs);

/**
 * @route   GET /api/admin/activities
 * @desc    Get user activity log entries (supports ?search=&type=&limit=&skip=)
 * @access  Admin / Faculty
 */
router.get('/activities', getUserActivities);

/**
 * @route   GET  /api/admin/registrations
 * @route   PATCH /api/admin/registrations/:uid/approve
 * @route   PATCH /api/admin/registrations/:uid/reject
 */
router.get('/registrations', getRegistrations);
router.patch('/registrations/:uid/approve', approveRegistration);
router.patch('/registrations/:uid/reject', rejectRegistration);

/**
 * @route   GET   /api/admin/literature
 * @route   PATCH /api/admin/literature/:id/approve
 * @route   PATCH /api/admin/literature/:id/reject
 * @desc    Manage research submissions
 * @access  Admin / Faculty
 */
router.get('/literature', getLiterature);
router.patch('/literature/:id/approve', approveLiterature);
router.patch('/literature/:id/reject', rejectLiterature);

/**
 * @route   GET /api/admin/analytics
 * @desc    Returns dashboard stats, user growth, year level dist, top categories
 * @access  Admin / Faculty
 */
router.get('/analytics', getAnalytics);

/**
 * GET /api/admin/ai/models
 * Returns available generative AI models (protected admin route)
 */
router.get('/ai/models', (req, res) => {
	// defer to controller (imported below to avoid circular imports)
	const { listAIModels } = require('../controllers/admin.controller');
	return listAIModels(req, res);
});

export default router;
