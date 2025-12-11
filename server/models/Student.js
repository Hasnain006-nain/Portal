const { ObjectId } = require('mongodb');

class Student {
    constructor(db) {
        this.collection = db.collection('students');
    }

    async findAll(filter = {}) {
        return await this.collection.find(filter).toArray();
    }

    async findById(id) {
        return await this.collection.findOne({ _id: new ObjectId(id) });
    }

    async findByEmail(email) {
        return await this.collection.findOne({ email });
    }

    async create(studentData) {
        const result = await this.collection.insertOne({
            ...studentData,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return result;
    }

    async update(id, studentData) {
        return await this.collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...studentData, updatedAt: new Date() } }
        );
    }

    async delete(id) {
        return await this.collection.deleteOne({ _id: new ObjectId(id) });
    }
}

module.exports = Student;
