const { ObjectId } = require('mongodb');

class Announcement {
    constructor(db) {
        this.collection = db.collection('announcements');
    }

    async findAll(filter = {}) {
        return await this.collection.find(filter).sort({ createdAt: -1 }).toArray();
    }

    async findById(id) {
        return await this.collection.findOne({ _id: new ObjectId(id) });
    }

    async findByType(type) {
        return await this.collection.find({ type }).sort({ createdAt: -1 }).toArray();
    }

    async findByPriority(priority) {
        return await this.collection.find({ priority }).sort({ createdAt: -1 }).toArray();
    }

    async create(announcementData) {
        const result = await this.collection.insertOne({
            ...announcementData,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return result;
    }

    async update(id, announcementData) {
        return await this.collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...announcementData, updatedAt: new Date() } }
        );
    }

    async delete(id) {
        return await this.collection.deleteOne({ _id: new ObjectId(id) });
    }
}

module.exports = Announcement;
