const { ObjectId } = require('mongodb');

class Hostel {
    constructor(db) {
        this.collection = db.collection('hostels');
    }

    async findAll(filter = {}) {
        return await this.collection.find(filter).toArray();
    }

    async findById(id) {
        return await this.collection.findOne({ _id: new ObjectId(id) });
    }

    async create(hostelData) {
        const result = await this.collection.insertOne({
            ...hostelData,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return result;
    }

    async update(id, hostelData) {
        return await this.collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...hostelData, updatedAt: new Date() } }
        );
    }

    async delete(id) {
        return await this.collection.deleteOne({ _id: new ObjectId(id) });
    }
}

module.exports = Hostel;
