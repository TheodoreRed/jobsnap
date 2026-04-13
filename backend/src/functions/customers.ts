import { app } from '@azure/functions'
import { z } from 'zod'

import { connectDb } from '../mongodb/client'
import { CustomerModel } from '../models/customer.model'
import { JobModel } from '../models/job.model'
import { badRequest, createdResponse, internalServerError, okResponse } from '../utils/response'

const customerInputSchema = z.object({
  name: z.string().trim().min(1),
  primaryAddress: z.string().trim().optional(),
  notes: z.string().trim().optional(),
})

app.http('customersList', {
  route: 'customers',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async () => {
    try {
      await connectDb()

      const [customers, jobStats] = await Promise.all([
        CustomerModel.find({}).sort({ name: 1 }).lean(),
        JobModel.aggregate([
          { $sort: { updatedAt: -1 } },
          {
            $group: {
              _id: '$customerName',
              jobCount: { $sum: 1 },
              latestJobUpdatedAt: { $max: '$updatedAt' },
              latestAddress: { $first: '$address' },
            },
          },
          { $project: { _id: 0, name: '$_id', jobCount: 1, latestJobUpdatedAt: 1, latestAddress: 1 } },
        ]),
      ])

      const map = new Map<string, any>()

      for (const customer of customers) {
        map.set(customer.name, {
          id: String(customer._id),
          name: customer.name,
          primaryAddress: customer.primaryAddress ?? '',
          notes: customer.notes,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
          jobCount: 0,
          latestJobUpdatedAt: null,
        })
      }

      for (const stat of jobStats) {
        const name = (stat.name as string).trim()
        if (!name) continue

        const existing = map.get(name)
        if (existing) {
          existing.jobCount = stat.jobCount
          existing.latestJobUpdatedAt = stat.latestJobUpdatedAt
          if (!existing.primaryAddress) existing.primaryAddress = stat.latestAddress ?? ''
        } else {
          map.set(name, {
            id: `derived:${name}`,
            name,
            primaryAddress: stat.latestAddress ?? '',
            notes: undefined,
            createdAt: stat.latestJobUpdatedAt,
            updatedAt: stat.latestJobUpdatedAt,
            jobCount: stat.jobCount,
            latestJobUpdatedAt: stat.latestJobUpdatedAt,
          })
        }
      }

      const items = [...map.values()].sort((a, b) => a.name.localeCompare(b.name))

      return okResponse({ items })
    } catch (error) {
      console.error(error)
      return internalServerError()
    }
  },
})

app.http('customersCreate', {
  route: 'customers',
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async req => {
    try {
      await connectDb()
      const body = await req.json()
      const parsed = customerInputSchema.safeParse(body)
      if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Invalid customer payload')

      const name = parsed.data.name.trim()
      const existing = await CustomerModel.findOne({ name }).lean()
      if (existing) {
        const updated = await CustomerModel.findByIdAndUpdate(existing._id, parsed.data, { new: true }).lean()
        return okResponse(updated)
      }

      const created = await CustomerModel.create(parsed.data)
      return createdResponse(created)
    } catch (error) {
      console.error(error)
      return internalServerError()
    }
  },
})
