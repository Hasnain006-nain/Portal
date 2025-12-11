const { ObjectId } = require('mongodb');

class Request {
    constructor(db) {
        this.collection = db.collection('requests');
    }

    async findAll(filter = {}) {
        return await this.collection.find(filter).sort({ createdAt: -1 }).toArray();
    }

    async findById(id) {
        return await this.collection.findOne({ _id: new ObjectId(id) });
    }

    async findByStudentId(studentId) {
        return await this.collection.find({ studentId }).sort({ createdAt: -1 }).toArray();
    }

    async findByType(type) {
        return await this.collection.find({ type }).sort({ createdAt: -1 }).toArray();
    }

    async findPending() {
        return await this.collection.find({ status: 'pending' }).sort({ createdAt: -1 }).toArray();
    }

    async create(requestData) {
        const result = await this.collection.insertOne({
            ...requestData,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return result;
    }

    async update(id, requestData) {
        return await this.collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...requestData, updatedAt: new Date() } }
        );
    }

    async delete(id) {
        return await this.collection.deleteOne({ _id: new ObjectId(id) });
    }
}

module.exports = Request;
