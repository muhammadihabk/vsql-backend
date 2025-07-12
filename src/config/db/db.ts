import 'dotenv/config';
import mongoose from 'mongoose';

async function connect() {
  try {
    await mongoose.connect(
      `mongodb://${process.env.MONGO_INITDB_ROOT_USERNAME}:${process.env.MONGO_INITDB_ROOT_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_INITDB_DATABASE}?authSource=admin`
    );
  } catch (error) {
    console.log(error);
  }
}

export default { connect };
