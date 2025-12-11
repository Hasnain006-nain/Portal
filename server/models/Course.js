const { ObjectId } = require('mongodb');

class Course {
    constructor(db) {
        this.collection = db.collection('courses');
    }

    async findAll(filter = {}) {
        return await this.collection.find(filter).toArray();
    }

    async findById(id) {
        return await this.collection.findOne({ _id: new ObjectId(id) });
    }

    async create(courseData) {
        const result = await this.collection.insertOne({
            ...courseData,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return result;
    }

    async update(id, courseData) {
        return await this.collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...courseData, updatedAt: new Date() } }
        );
    }

    async delete(id) {
        return await this.collection.deleteOne({ _id: new ObjectId(id) });
    }
}

module.exports = Course;
