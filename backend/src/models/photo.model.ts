import mongoose, { Schema, type InferSchemaType } from 'mongoose'

export const PHOTO_TAGS = ['Before', 'During', 'After', 'Other'] as const

const photoSchema = new Schema(
  {
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    fileReference: { type: String, required: true },
    uploadedAt: { type: Date, required: true, default: () => new Date() },
    orderIndex: { type: Number, required: true },
    caption: { type: String, trim: true },
    tag: { type: String, enum: PHOTO_TAGS },
  },
  { timestamps: true }
)

export type PhotoDocument = InferSchemaType<typeof photoSchema> & { _id: mongoose.Types.ObjectId }

export const PhotoModel = mongoose.models.Photo ?? mongoose.model('Photo', photoSchema)
