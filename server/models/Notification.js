const { ObjectId } = require('mongodb');

class Notification {
    constructor(db) {
        this.collection = db.collection('notifications');
    }

    async findAll(filter = {}) {
        return await this.collection.find(filter).sort({ createdAt: -1 }).toArray();
    }

    async findById(id) {
        return await this.collection.findOne({ _id: new ObjectId(id) });
    }

    async findByRecipient(recipientEmail) {
        return await this.collection.find({ recipientEmail }).sort({ createdAt: -1 }).toArray();
    }

    async findUnread(recipientEmail) {
        return await this.collection.find({
            recipientEmail,
            read: false
        }).sort({ createdAt: -1 }).toArray();
    }

    async create(notificationData) {
        const result = await this.collection.insertOne({
            ...notificationData,
            read: false,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return result;
    }

    async markAsRead(id) {
        return await this.collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { read: true, updatedAt: new Date() } }
        );
    }

    async markAllAsRead(recipientEmail) {
        return await this.collection.updateMany(
            { recipientEmail, read: false },
            { $set: { read: true, updatedAt: new Date() } }
        );
    }

    async delete(id) {
        return await this.collection.deleteOne({ _id: new ObjectId(id) });
    }

    async deleteAll(recipientEmail) {
        return await this.collection.deleteMany({ recipientEmail });
    }
}

module.exports = Notification;
