const { ObjectId } = require('mongodb');

class Borrowing {
    constructor(db) {
        this.collection = db.collection('borrowings');
    }

    async findAll(filter = {}) {
        return await this.collection.find(filter).toArray();
    }

    async findById(id) {
        return await this.collection.findOne({ _id: new ObjectId(id) });
    }

    async findByStudentId(studentId) {
        return await this.collection.find({ studentId }).toArray();
    }

    async findByBookId(bookId) {
        return await this.collection.find({ bookId }).toArray();
    }

    async create(borrowingData) {
        const result = await this.collection.insertOne({
            ...borrowingData,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return result;
    }

    async update(id, borrowingData) {
        return await this.collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...borrowingData, updatedAt: new Date() } }
        );
    }

    async delete(id) {
        return await this.collection.deleteOne({ _id: new ObjectId(id) });
    }
}

module.exports = Borrowing;
