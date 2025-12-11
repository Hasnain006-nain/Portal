const { ObjectId } = require('mongodb');

class User {
    constructor(db) {
        this.collection = db.collection('users');
    }

    async findByEmail(email) {
        return await this.collection.findOne({ email });
    }

    async findById(id) {
        return await this.collection.findOne({ _id: new ObjectId(id) });
    }

    async create(userData) {
        const result = await this.collection.insertOne({
            ...userData,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return result;
    }

    async update(id, userData) {
        return await this.collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...userData, updatedAt: new Date() } }
        );
    }

    async updatePassword(id, hashedPassword, oldPasswordHash = null) {
        const updateQuery = {
            $set: {
                password: hashedPassword,
                updatedAt: new Date()
            }
        };

        // Add old password to history if provided
        if (oldPasswordHash) {
            updateQuery.$push = {
                passwordHistory: {
                    $each: [oldPasswordHash],
                    $slice: -5 // Keep only last 5 passwords
                }
            };
        }

        return await this.collection.updateOne(
            { _id: new ObjectId(id) },
            updateQuery
        );
    }

    async getPasswordHistory(id) {
        const user = await this.collection.findOne(
            { _id: new ObjectId(id) },
            { projection: { passwordHistory: 1 } }
        );
        return user?.passwordHistory || [];
    }
}

module.exports = User;
