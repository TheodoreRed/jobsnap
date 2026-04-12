import mongoose, { type Document, type Model } from 'mongoose'

export interface IQuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface IQuiz extends Document {
  sessionId: string
  title: string
  questions: IQuizQuestion[]
  createdAt: Date
}

const quizSchema = new mongoose.Schema<IQuiz>(
  {
    sessionId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    questions: [
      {
        id: { type: String, required: true },
        question: { type: String, required: true },
        options: [{ type: String }],
        correctIndex: { type: Number, required: true },
        explanation: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
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

export const QuizModel: Model<IQuiz> =
  (mongoose.models.Quiz as Model<IQuiz>) ?? mongoose.model<IQuiz>('Quiz', quizSchema)
