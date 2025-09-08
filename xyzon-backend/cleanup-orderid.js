const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGO_DB || 'xyzon'
}).then(async () => {
    const db = mongoose.connection.db;

    // Check for any documents with orderId field
    const paymentsWithOrderId = await db.collection('payments').find({ orderId: { $exists: true } }).toArray();
    console.log('Found', paymentsWithOrderId.length, 'payment records with orderId field');

    if (paymentsWithOrderId.length > 0) {
        console.log('Sample records with orderId:');
        paymentsWithOrderId.slice(0, 3).forEach(payment => {
            console.log('- ID:', payment._id, 'orderId:', payment.orderId, 'razorpayOrderId:', payment.razorpayOrderId);
        });

        // Remove orderId field from all documents
        const result = await db.collection('payments').updateMany(
            { orderId: { $exists: true } },
            { $unset: { orderId: '' } }
        );
        console.log('Removed orderId field from', result.modifiedCount, 'documents');
    }

    mongoose.disconnect();
}).catch(console.error);
