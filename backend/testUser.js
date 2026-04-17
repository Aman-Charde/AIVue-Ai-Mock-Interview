import mongoose from 'mongoose';
import User from './models/User.js';

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/ai-mock-interview');
  try {
    const user = await User.create({ name: 'Test', email: 'test2@test.com', password: '123' });
    console.log("Success", user);
  } catch (e) {
    console.error("FAIL", e);
  }
  process.exit();
}

test();
