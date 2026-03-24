import cron from 'node-cron';
import User from '../models/User';
import AcademicStudy from '../models/AcademicStudy';
import { sendResearchUpdateEmail } from './email.service';

export const initCronJobs = () => {
    // Run every Sunday at 9:00 AM
    cron.schedule('0 9 * * 0', async () => {
        console.log('[Cron] Starting Weekly Research Update Job...');
        try {
            // Find all users who opted in to research updates
            const users = await User.find({ 'notificationPreferences.researchUpdates': true });
            if (!users || users.length === 0) return;

            // Find studies approved in the last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const newStudies = await AcademicStudy.find({
                approvalStatus: 'approved',
                createdAt: { $gte: sevenDaysAgo }
            });

            if (!newStudies || newStudies.length === 0) {
                console.log('[Cron] No new studies this week, skipping emails.');
                return;
            }

            console.log(`[Cron] Found ${newStudies.length} new studies. Distributing updates...`);

            for (const user of users) {
                await sendResearchUpdateEmail(user.email, newStudies.length);
            }
        } catch (e) {
            console.error('[Cron] Error running weekly job: ', e);
        }
    });
    console.log('[Cron] Initialized cron jobs');
};