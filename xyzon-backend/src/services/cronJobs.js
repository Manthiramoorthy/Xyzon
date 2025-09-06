const cron = require('node-cron');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const { sendEventReminder } = require('../services/mailService');

class CronJobs {
    static init() {
        // Send event reminders daily at 9 AM
        cron.schedule('0 9 * * *', async () => {
            console.log('Running daily reminder job...');
            await this.sendDailyReminders();
        });

        // Update event status every hour
        cron.schedule('0 * * * *', async () => {
            console.log('Running event status update job...');
            await this.updateEventStatuses();
        });

        // Clean up expired payment orders daily at midnight
        cron.schedule('0 0 * * *', async () => {
            console.log('Running payment cleanup job...');
            await this.cleanupExpiredPayments();
        });
    }

    static async sendDailyReminders() {
        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const dayAfterTomorrow = new Date(tomorrow);
            dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

            // Find events starting tomorrow
            const upcomingEvents = await Event.find({
                startDate: {
                    $gte: tomorrow,
                    $lt: dayAfterTomorrow
                },
                status: 'published'
            });

            for (const event of upcomingEvents) {
                // Find all registered users who haven't received reminder
                const registrations = await EventRegistration.find({
                    event: event._id,
                    status: 'registered',
                    reminderEmailSent: false
                });

                for (const registration of registrations) {
                    try {
                        await sendEventReminder(registration, event);

                        // Mark reminder as sent
                        registration.reminderEmailSent = true;
                        await registration.save();

                        console.log(`Reminder sent to ${registration.email} for event ${event.title}`);
                    } catch (error) {
                        console.error(`Failed to send reminder to ${registration.email}:`, error.message);
                    }
                }
            }

            console.log(`Processed ${upcomingEvents.length} events for reminders`);
        } catch (error) {
            console.error('Error in sendDailyReminders:', error);
        }
    }

    static async updateEventStatuses() {
        try {
            const now = new Date();

            // Update events to completed if end date has passed
            const completedEvents = await Event.updateMany(
                {
                    endDate: { $lt: now },
                    status: 'published'
                },
                { status: 'completed' }
            );

            console.log(`Updated ${completedEvents.modifiedCount} events to completed status`);
        } catch (error) {
            console.error('Error in updateEventStatuses:', error);
        }
    }

    static async cleanupExpiredPayments() {
        try {
            const Payment = require('../models/Payment');

            // Find payments older than 1 hour that are still in created status
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

            const expiredPayments = await Payment.updateMany(
                {
                    status: 'created',
                    createdAt: { $lt: oneHourAgo }
                },
                { status: 'failed', errorDescription: 'Payment expired' }
            );

            console.log(`Marked ${expiredPayments.modifiedCount} payments as expired`);
        } catch (error) {
            console.error('Error in cleanupExpiredPayments:', error);
        }
    }
}

module.exports = CronJobs;
