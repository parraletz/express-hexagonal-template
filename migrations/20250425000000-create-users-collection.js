module.exports = {
  async up(db) {
    // Create users collection with validation
    await db.createCollection('users', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name', 'email', 'password', 'createdAt', 'updatedAt'],
          properties: {
            name: {
              bsonType: 'string',
              description: 'must be a string and is required'
            },
            email: {
              bsonType: 'string',
              description: 'must be a string and is required'
            },
            password: {
              bsonType: 'string',
              description: 'must be a string and is required'
            },
            createdAt: {
              bsonType: 'date',
              description: 'must be a date and is required'
            },
            updatedAt: {
              bsonType: 'date',
              description: 'must be a date and is required'
            }
          }
        }
      }
    });

    // Create unique index on email
    await db.collection('users').createIndex(
      { email: 1 },
      { unique: true }
    );
  },

  async down(db) {
    await db.collection('users').drop();
  }
};
