import mongoose, { type Document, type Model } from 'mongoose'

export interface IMessageAttachment {
  name: string
  size: string
  status: string
}

export interface IMessage extends Document {
  sessionId: string
  role: 'user' | 'ai'
  content: string
  attachments?: IMessageAttachment[]
  timestamp: Date
}

const messageSchema = new mongoose.Schema<IMessage>(
  {
    sessionId: { type: String, required: true, index: true },
    role: { type: String, enum: ['user', 'ai'], required: true },
    content: { type: String, required: true },
    attachments: [
      {
        name: { type: String },
        size: { type: String },
        status: { type: String },
      },
    ],
    timestamp: { type: Date, default: Date.now },
  },
  {
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = (ret._id as mongoose.Types.ObjectId).toString()
        delete ret._id
        delete ret.__v
        return ret
      },
    },
  }
)

export const MessageModel: Model<IMessage> =
  (mongoose.models.Message as Model<IMessage>) ?? mongoose.model<IMessage>('Message', messageSchema)
