import { app } from '@azure/functions'

import { connectDb } from '../mongodb/client'
import { JobModel } from '../models/job.model'
import { MessageModel } from '../models/message.model'
import { PhotoModel } from '../models/photo.model'
import { QuizModel } from '../models/quiz.model'
import { ReportModel } from '../models/report.model'
import { SessionModel } from '../models/session.model'
import { internalServerError, okResponse } from '../utils/response'

function parseDateParam(value: string | null, fallback: Date) {
  if (!value) return fallback
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return fallback
  return parsed
}

function normalizeEndDate(value: Date) {
  const end = new Date(value)
  end.setUTCHours(23, 59, 59, 999)
  return end
}

app.http('analyticsOverview', {
  route: 'analytics/overview',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async req => {
    try {
      await connectDb()

      const now = new Date()
      const defaultFrom = new Date(now)
      defaultFrom.setUTCDate(defaultFrom.getUTCDate() - 29)
      defaultFrom.setUTCHours(0, 0, 0, 0)

      const from = parseDateParam(req.query.get('from'), defaultFrom)
      from.setUTCHours(0, 0, 0, 0)

      const to = normalizeEndDate(parseDateParam(req.query.get('to'), now))

      const dateRange = { $gte: from, $lte: to }

      const [
        totalJobs,
        totalPhotos,
        totalReports,
        totalSessions,
        totalMessages,
        totalQuizzes,
        uniqueCustomers,
        jobsCreated,
        photosUploaded,
        reportsGenerated,
        sessionsCreated,
        jobsByStatus,
        messagesByRole,
        topCustomers,
        sessionMessageLeaders,
      ] = await Promise.all([
        JobModel.countDocuments({ createdAt: dateRange }),
        PhotoModel.countDocuments({ uploadedAt: dateRange }),
        ReportModel.countDocuments({ generatedAt: dateRange }),
        SessionModel.countDocuments({ createdAt: dateRange }),
        MessageModel.countDocuments({ timestamp: dateRange }),
        QuizModel.countDocuments({ createdAt: dateRange }),
        JobModel.aggregate([
          { $match: { createdAt: dateRange } },
          { $group: { _id: { $ifNull: ['$customerId', { $toLower: '$customerName' }] } } },
          { $count: 'count' },
        ]),
        JobModel.aggregate([
          { $match: { createdAt: dateRange } },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
        PhotoModel.aggregate([
          { $match: { uploadedAt: dateRange } },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$uploadedAt' } }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
        ReportModel.aggregate([
          { $match: { generatedAt: dateRange } },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$generatedAt' } }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
        SessionModel.aggregate([
          { $match: { createdAt: dateRange } },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
        JobModel.aggregate([
          { $match: { createdAt: dateRange } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        MessageModel.aggregate([
          { $match: { timestamp: dateRange } },
          { $group: { _id: '$role', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        JobModel.aggregate([
          { $match: { createdAt: dateRange } },
          { $group: { _id: '$customerName', count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
          { $limit: 10 },
        ]),
        MessageModel.aggregate([
          { $match: { timestamp: dateRange } },
          { $group: { _id: '$sessionId', count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
          { $limit: 8 },
        ]),
      ])

      const sessionIds = sessionMessageLeaders.map(entry => entry._id).filter(Boolean)
      const sessions = await SessionModel.find({ _id: { $in: sessionIds } }, { _id: 1, title: 1 }).lean()
      const sessionTitleMap = new Map(sessions.map(session => [session._id, session.title]))

      const response = {
        range: {
          from,
          to,
          days: Math.max(1, Math.ceil((to.getTime() - from.getTime() + 1) / 86_400_000)),
        },
        totals: {
          jobs: totalJobs,
          photos: totalPhotos,
          reports: totalReports,
          sessions: totalSessions,
          messages: totalMessages,
          quizzes: totalQuizzes,
          customers: uniqueCustomers[0]?.count ?? 0,
        },
        series: {
          jobsCreated: jobsCreated.map(entry => ({ date: entry._id, count: entry.count })),
          photosUploaded: photosUploaded.map(entry => ({ date: entry._id, count: entry.count })),
          reportsGenerated: reportsGenerated.map(entry => ({ date: entry._id, count: entry.count })),
          sessionsCreated: sessionsCreated.map(entry => ({ date: entry._id, count: entry.count })),
        },
        jobsByStatus: jobsByStatus.map(entry => ({ status: entry._id, count: entry.count })),
        messagesByRole: messagesByRole.map(entry => ({ role: entry._id, count: entry.count })),
        topCustomers: topCustomers.map(entry => ({ customerName: entry._id, count: entry.count })),
        sessionMessageLeaders: sessionMessageLeaders.map(entry => ({
          sessionId: entry._id,
          title: sessionTitleMap.get(entry._id) ?? entry._id,
          count: entry.count,
        })),
      }

      return okResponse(response)
    } catch (error) {
      console.error(error)
      return internalServerError()
    }
  },
})
