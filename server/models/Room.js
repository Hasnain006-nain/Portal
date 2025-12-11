const { ObjectId } = require('mongodb');

class Room {
    constructor(db) {
        this.collection = db.collection('rooms');
    }

    async findAll(filter = {}) {
        return await this.collection.find(filter).toArray();
    }

    async findById(id) {
        return await this.collection.findOne({ _id: new ObjectId(id) });
    }

    async findByHostelId(hostelId) {
        // Try both string and ObjectId formats
        try {
            const objectId = new ObjectId(hostelId);
            return await this.collection.find({
                $or: [
                    { hostelId: hostelId },
                    { hostelId: objectId }
                ]
            }).toArray();
        } catch (error) {
            // If not a valid ObjectId, just search as string
            return await this.collection.find({ hostelId }).toArray();
        }
    }

    async create(roomData) {
        const result = await this.collection.insertOne({
            ...roomData,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return result;
    }

    async update(id, roomData) {
        return await this.collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...roomData, updatedAt: new Date() } }
        );
    }

    async delete(id) {
        return await this.collection.deleteOne({ _id: new ObjectId(id) });
    }

    async addResident(id, residentData) {
        return await this.collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $push: { residents: residentData },
                $set: { updatedAt: new Date() }
            }
        );
    }

    async removeResident(id, residentId) {
        return await this.collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $pull: { residents: { _id: new ObjectId(residentId) } },
                $set: { updatedAt: new Date() }
            }
        );
    }

    async updateResident(id, residentId, residentData) {
        return await this.collection.updateOne(
            { _id: new ObjectId(id), 'residents._id': new ObjectId(residentId) },
            {
                $set: {
                    'residents.$': { ...residentData, _id: new ObjectId(residentId) },
                    updatedAt: new Date()
                }
            }
        );
    }

    async addWarning(id, warningData) {
        return await this.collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $push: { warnings: warningData },
                $set: { updatedAt: new Date() }
            }
        );
    }
}

module.exports = Room;
