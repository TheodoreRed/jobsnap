import mongoose, { Schema, type InferSchemaType } from 'mongoose'

const customerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true, trim: true, index: true },
    defaultAddress: { type: String, trim: true },
    phoneNumber: { type: String, trim: true },
    email: { type: String, trim: true },
  },
  { timestamps: true }
)

export type CustomerDocument = InferSchemaType<typeof customerSchema> & { _id: mongoose.Types.ObjectId }

export const CustomerModel = mongoose.models.Customer ?? mongoose.model('Customer', customerSchema)
