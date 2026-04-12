import mongoose, { Schema, type InferSchemaType } from 'mongoose'

export const JOB_STATUSES = ['Draft', 'In Progress', 'Complete'] as const

const jobSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    workOrderReference: { type: String, trim: true },
    description: { type: String, trim: true },
    notes: { type: String, trim: true },
    status: { type: String, enum: JOB_STATUSES, required: true, default: 'Draft' },
    latestReportGeneratedAt: { type: Date },
  },
  { timestamps: true }
)

export type JobDocument = InferSchemaType<typeof jobSchema> & { _id: mongoose.Types.ObjectId }

export const JobModel = mongoose.models.Job ?? mongoose.model('Job', jobSchema)
