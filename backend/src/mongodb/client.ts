import mongoose from 'mongoose'

let connected = false

export async function connectDb(): Promise<void> {
  if (connected && mongoose.connection.readyState === 1) return

  connected = false

  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set')

  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB_NAME ?? 'quizapp',
    serverSelectionTimeoutMS: 5000,
  })

  connected = true
}
