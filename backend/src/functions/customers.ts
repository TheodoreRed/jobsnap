import { app } from '@azure/functions'

import { connectDb } from '../mongodb/client'
import { CustomerModel } from '../models/customer.model'
import { JobModel } from '../models/job.model'
import { PhotoModel } from '../models/photo.model'
import { internalServerError, notFound, okResponse } from '../utils/response'

function normalizeName(value: string) {
  return value.trim().toLowerCase()
}

function normalizeCustomer(customer: any) {
  return {
    id: String(customer._id),
    name: customer.name,
    defaultAddress: customer.defaultAddress,
    phoneNumber: customer.phoneNumber,
    email: customer.email,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  }
}

app.http('customersList', {
  route: 'customers',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async req => {
    try {
      await connectDb()
      const search = req.query.get('search')?.trim()

      const filter: Record<string, unknown> = {}
      if (search) {
        const regex = new RegExp(search, 'i')
        filter.$or = [{ name: regex }, { defaultAddress: regex }, { email: regex }, { phoneNumber: regex }]
      }

      const customers = await CustomerModel.find(filter).sort({ name: 1 }).lean()
      return okResponse({ items: customers.map(normalizeCustomer) })
    } catch (error) {
      console.error(error)
      return internalServerError()
    }
  },
})

app.http('customersGetById', {
  route: 'customers/{customerId}',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async req => {
    try {
      await connectDb()
      const customer = await CustomerModel.findById(req.params.customerId).lean()
      if (!customer) return notFound('Customer not found')

      const jobs = await JobModel.find({ customerId: customer._id }).sort({ updatedAt: -1 }).lean()
      const jobIds = jobs.map(job => job._id)
      const counts = await PhotoModel.aggregate([{ $match: { jobId: { $in: jobIds } } }, { $group: { _id: '$jobId', count: { $sum: 1 } } }])
      const countMap = new Map(counts.map(entry => [String(entry._id), entry.count]))

      return okResponse({
        customer: normalizeCustomer(customer),
        jobs: jobs.map(job => ({
          id: String(job._id),
          title: job.title,
          customerName: job.customerName,
          customerId: job.customerId ? String(job.customerId) : undefined,
          address: job.address,
          status: job.status,
          updatedAt: job.updatedAt,
          createdAt: job.createdAt,
          photoCount: countMap.get(String(job._id)) ?? 0,
        })),
      })
    } catch (error) {
      console.error(error)
      return internalServerError()
    }
  },
})

export async function upsertCustomerFromJob(payload: {
  customerName: string
  defaultAddress?: string
  saveCustomer?: boolean
}) {
  const normalizedName = normalizeName(payload.customerName)
  const existing = await CustomerModel.findOne({ normalizedName })
  if (existing) return existing
  if (!payload.saveCustomer) return null

  return CustomerModel.create({
    name: payload.customerName.trim(),
    normalizedName,
    defaultAddress: payload.defaultAddress?.trim() || undefined,
  })
}
