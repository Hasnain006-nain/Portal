const { ObjectId } = require('mongodb');

class Book {
    constructor(db) {
        this.collection = db.collection('books');
    }

    async findAll(filter = {}) {
        return await this.collection.find(filter).toArray();
    }

    async findById(id) {
        return await this.collection.findOne({ _id: new ObjectId(id) });
    }

    async create(bookData) {
        const result = await this.collection.insertOne({
            ...bookData,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return result;
    }

    async update(id, bookData) {
        return await this.collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...bookData, updatedAt: new Date() } }
        );
    }

    async delete(id) {
        return await this.collection.deleteOne({ _id: new ObjectId(id) });
    }
}

module.exports = Book;
