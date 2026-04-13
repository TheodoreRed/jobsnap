import mongoose, { Schema, type InferSchemaType } from 'mongoose'

const customerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    primaryAddress: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
)

customerSchema.index({ name: 1 }, { unique: true })

export type CustomerDocument = InferSchemaType<typeof customerSchema> & { _id: mongoose.Types.ObjectId }

export const CustomerModel = mongoose.models.Customer ?? mongoose.model('Customer', customerSchema)
