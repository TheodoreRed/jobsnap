import mongoose from 'mongoose'
import { app } from '@azure/functions'
import { z } from 'zod'

import { connectDb } from '../mongodb/client'
import { upsertCustomerFromJob } from './customers'
import { JobModel, JOB_STATUSES } from '../models/job.model'
import { PhotoModel } from '../models/photo.model'
import { badRequest, createdResponse, internalServerError, notFound, okResponse } from '../utils/response'

const jobInputSchema = z.object({
  title: z.string().trim().min(1),
  customerName: z.string().trim().min(1),
  customerId: z.string().trim().optional(),
  saveCustomer: z.boolean().optional(),
  address: z.string().trim().min(1),
  workOrderReference: z.string().trim().optional(),
  description: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  status: z.enum(JOB_STATUSES).default('Draft'),
})

const jobPatchSchema = jobInputSchema
  .omit({ saveCustomer: true, customerId: true })
  .partial()
  .refine(payload => Object.keys(payload).length > 0, {
    message: 'At least one field is required',
  })


function normalizeJob(job: any, photoCount = 0) {
  return {
    id: String(job._id),
    title: job.title,
    customerName: job.customerName,
    customerId: job.customerId ? String(job.customerId) : undefined,
    address: job.address,
    workOrderReference: job.workOrderReference,
    description: job.description,
    notes: job.notes,
    status: job.status,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    latestReportGeneratedAt: job.latestReportGeneratedAt,
    photoCount,
  }
}

app.http('jobsList', {
  route: 'jobs',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async req => {
    try {
      await connectDb()
      const search = req.query.get('search')?.trim()
      const status = req.query.get('status')?.trim()
      const customerId = req.query.get('customerId')?.trim()

      const filter: Record<string, unknown> = {}
      if (status && JOB_STATUSES.includes(status as (typeof JOB_STATUSES)[number])) {
        filter.status = status
      }

      if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
        filter.customerId = new mongoose.Types.ObjectId(customerId)
      }

      if (search) {
        const regex = new RegExp(search, 'i')
        filter.$or = [{ title: regex }, { customerName: regex }, { address: regex }, { workOrderReference: regex }]
      }

      const jobs = await JobModel.find(filter).sort({ updatedAt: -1 }).lean()
      const jobIds = jobs.map(job => job._id)
      const counts = await PhotoModel.aggregate([{ $match: { jobId: { $in: jobIds } } }, { $group: { _id: '$jobId', count: { $sum: 1 } } }])
      const countMap = new Map(counts.map(entry => [String(entry._id), entry.count]))

      return okResponse({
        items: jobs.map(job => normalizeJob(job, countMap.get(String(job._id)) ?? 0)),
      })
    } catch (error) {
      console.error(error)
      return internalServerError()
    }
  },
})

app.http('jobsCreate', {
  route: 'jobs',
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async req => {
    try {
      await connectDb()
      const body = await req.json()
      const parsed = jobInputSchema.safeParse(body)
      if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Invalid job payload')

      const payload = parsed.data
      let resolvedCustomerId: mongoose.Types.ObjectId | undefined
      let resolvedCustomerName = payload.customerName

      if (payload.customerId) {
        if (!mongoose.Types.ObjectId.isValid(payload.customerId)) {
          return badRequest('Invalid customer id')
        }
      }

      const customer = await upsertCustomerFromJob({
        customerName: payload.customerName,
        defaultAddress: payload.address,
        saveCustomer: payload.saveCustomer,
      })

      if (customer) {
        resolvedCustomerId = customer._id
        resolvedCustomerName = customer.name
      } else if (payload.customerId) {
        resolvedCustomerId = new mongoose.Types.ObjectId(payload.customerId)
      }

      const created = await JobModel.create({
        title: payload.title,
        customerName: resolvedCustomerName,
        customerId: resolvedCustomerId,
        address: payload.address,
        workOrderReference: payload.workOrderReference,
        description: payload.description,
        notes: payload.notes,
        status: payload.status,
      })
      return createdResponse(normalizeJob(created, 0))
    } catch (error) {
      console.error(error)
      return internalServerError()
    }
  },
})

app.http('jobsGetById', {
  route: 'jobs/{jobId}',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async req => {
    try {
      await connectDb()
      const jobId = req.params.jobId
      const job = await JobModel.findById(jobId).lean()
      if (!job) return notFound('Job not found')

      const photos = await PhotoModel.find({ jobId }).sort({ orderIndex: 1, uploadedAt: 1 }).lean()

      return okResponse({
        job: normalizeJob(job, photos.length),
        photos: photos.map(photo => ({
          id: String(photo._id),
          jobId: String(photo.jobId),
          fileReference: photo.fileReference,
          uploadedAt: photo.uploadedAt,
          orderIndex: photo.orderIndex,
          caption: photo.caption,
          tag: photo.tag,
        })),
      })
    } catch (error) {
      console.error(error)
      return internalServerError()
    }
  },
})

app.http('jobsPatchById', {
  route: 'jobs/{jobId}',
  methods: ['PATCH'],
  authLevel: 'anonymous',
  handler: async req => {
    try {
      await connectDb()
      const body = await req.json()
      const parsed = jobPatchSchema.safeParse(body)
      if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Invalid job payload')

      const updated = await JobModel.findByIdAndUpdate(req.params.jobId, parsed.data, {
        new: true,
      }).lean()

      if (!updated) return notFound('Job not found')

      const photoCount = await PhotoModel.countDocuments({ jobId: updated._id })
      return okResponse(normalizeJob(updated, photoCount))
    } catch (error) {
      console.error(error)
      return internalServerError()
    }
  },
})
