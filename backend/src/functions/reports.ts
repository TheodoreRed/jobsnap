import { app } from '@azure/functions'
import { z } from 'zod'

import { connectDb } from '../mongodb/client'
import { JobModel } from '../models/job.model'
import { ReportModel } from '../models/report.model'
import { badRequest, createdResponse, internalServerError, notFound, okResponse } from '../utils/response'

app.http('reportsCreate', {
  route: 'jobs/{jobId}/reports',
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async req => {
    try {
      await connectDb()
      const jobId = req.params.jobId
      const body = await req.json()
      const schema = z.object({ fileReference: z.string().trim().min(1) })
      const parsed = schema.safeParse(body)
      if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Invalid report payload')

      const job = await JobModel.findById(jobId)
      if (!job) return notFound('Job not found')

      const report = await ReportModel.create({ jobId, fileReference: parsed.data.fileReference })
      job.latestReportGeneratedAt = report.generatedAt
      await job.save()

      return createdResponse({
        id: String(report._id),
        jobId,
        generatedAt: report.generatedAt,
        fileReference: report.fileReference,
      })
    } catch (error) {
      console.error(error)
      return internalServerError()
    }
  },
})

app.http('reportsList', {
  route: 'jobs/{jobId}/reports',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async req => {
    try {
      await connectDb()
      const jobId = req.params.jobId
      const reports = await ReportModel.find({ jobId }).sort({ generatedAt: -1 }).lean()

      return okResponse({
        items: reports.map(report => ({
          id: String(report._id),
          jobId: String(report.jobId),
          generatedAt: report.generatedAt,
          fileReference: report.fileReference,
        })),
      })
    } catch (error) {
      console.error(error)
      return internalServerError()
    }
  },
})
