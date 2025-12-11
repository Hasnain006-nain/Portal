const { ObjectId } = require('mongodb');

class Enrollment {
    constructor(db) {
        this.collection = db.collection('enrollments');
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

    async findByCourseId(courseCode) {
        return await this.collection.find({ courseCode }).toArray();
    }

    async findByStudentAndCourse(studentId, courseCode) {
        return await this.collection.findOne({ studentId, courseCode });
    }

    async create(enrollmentData) {
        const result = await this.collection.insertOne({
            ...enrollmentData,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return result;
    }

    async update(id, enrollmentData) {
        return await this.collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    ...enrollmentData,
                    updatedAt: new Date()
                }
            }
        );
    }

    async delete(id) {
        return await this.collection.deleteOne({ _id: new ObjectId(id) });
    }
}

module.exports = Enrollment;
