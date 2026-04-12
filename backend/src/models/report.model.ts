import mongoose, { Schema, type InferSchemaType } from 'mongoose'

const reportSchema = new Schema(
  {
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    generatedAt: { type: Date, required: true, default: () => new Date() },
    fileReference: { type: String, required: true },
  },
  { timestamps: true }
)

export type ReportDocument = InferSchemaType<typeof reportSchema> & { _id: mongoose.Types.ObjectId }

export const ReportModel = mongoose.models.Report ?? mongoose.model('Report', reportSchema)
