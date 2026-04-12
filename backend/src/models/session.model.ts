import mongoose, { type Document, type Model } from 'mongoose'

export interface ISession extends Document<string> {
  _id: string
  title: string
  subtitle: string
  createdAt: Date
  updatedAt: Date
}

const sessionSchema = new mongoose.Schema<ISession>(
  {
    _id: { type: String, required: true },
    title: { type: String, required: true, default: 'New Chat' },
    subtitle: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id
        delete ret.__v
        return ret
      },
    },
  }
)

export const SessionModel: Model<ISession> =
  (mongoose.models.Session as Model<ISession>) ?? mongoose.model<ISession>('Session', sessionSchema)
