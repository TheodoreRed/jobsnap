import { app } from '@azure/functions'
import { z } from 'zod'

import { connectDb } from '../mongodb/client'
import { JobModel } from '../models/job.model'
import { PHOTO_TAGS, PhotoModel } from '../models/photo.model'
import { badRequest, createdResponse, internalServerError, notFound, okResponse } from '../utils/response'

const createPhotoSchema = z.object({
  dataUrl: z.string().min(1),
  fileName: z.string().trim().min(1),
  caption: z.string().trim().optional(),
  tag: z.enum(PHOTO_TAGS).optional(),
})

const updatePhotoSchema = z.object({
  caption: z.string().trim().optional(),
  tag: z.enum(PHOTO_TAGS).optional(),
  orderIndex: z.number().int().nonnegative().optional(),
})

function ensureImageDataUrl(dataUrl: string) {
  if (!dataUrl.startsWith('data:image/')) throw new Error('Only image uploads are allowed')
}

app.http('photosCreate', {
  route: 'jobs/{jobId}/photos',
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (req, ctx) => {
    try {
      await connectDb()
      const jobId = req.params.jobId
      const body = await req.json()
      const parsed = createPhotoSchema.safeParse(body)
      if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Invalid photo payload')

      const jobExists = await JobModel.exists({ _id: jobId })
      if (!jobExists) return notFound('Job not found')

      ensureImageDataUrl(parsed.data.dataUrl)

      const nextIndex = await PhotoModel.countDocuments({ jobId })
      const created = await PhotoModel.create({
        jobId,
        fileReference: parsed.data.dataUrl,
        orderIndex: nextIndex,
        caption: parsed.data.caption,
        tag: parsed.data.tag,
      })

      return createdResponse({
        id: String(created._id),
        jobId,
        fileReference: created.fileReference,
        uploadedAt: created.uploadedAt,
        orderIndex: created.orderIndex,
        caption: created.caption,
        tag: created.tag,
      })
    } catch (error: any) {
      console.error(error)
      return badRequest(error.message ?? 'Failed to upload photo')
    }
  },
})

app.http('photosPatch', {
  route: 'jobs/{jobId}/photos/{photoId}',
  methods: ['PATCH'],
  authLevel: 'anonymous',
  handler: async req => {
    try {
      await connectDb()
      const { jobId, photoId } = req.params
      const body = await req.json()
      const parsed = updatePhotoSchema.safeParse(body)
      if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Invalid photo payload')

      const updated = await PhotoModel.findOneAndUpdate({ _id: photoId, jobId }, parsed.data, { new: true }).lean()
      if (!updated) return notFound('Photo not found')

      return okResponse({
        id: String(updated._id),
        jobId: String(updated.jobId),
        fileReference: updated.fileReference,
        uploadedAt: updated.uploadedAt,
        orderIndex: updated.orderIndex,
        caption: updated.caption,
        tag: updated.tag,
      })
    } catch (error) {
      console.error(error)
      return internalServerError()
    }
  },
})

app.http('photosDelete', {
  route: 'jobs/{jobId}/photos/{photoId}',
  methods: ['DELETE'],
  authLevel: 'anonymous',
  handler: async req => {
    try {
      await connectDb()
      const { jobId, photoId } = req.params
      const deleted = await PhotoModel.findOneAndDelete({ _id: photoId, jobId }).lean()
      if (!deleted) return notFound('Photo not found')

      const remainingPhotos = await PhotoModel.find({ jobId }).sort({ orderIndex: 1, uploadedAt: 1 })
      await Promise.all(
        remainingPhotos.map((photo, index) => {
          if (photo.orderIndex === index) return Promise.resolve()
          return PhotoModel.updateOne({ _id: photo._id }, { orderIndex: index })
        })
      )

      return okResponse({ ok: true })
    } catch (error) {
      console.error(error)
      return internalServerError()
    }
  },
})

app.http('photosReorder', {
  route: 'jobs/{jobId}/photos/reorder',
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async req => {
    try {
      await connectDb()
      const jobId = req.params.jobId
      const body = await req.json()
      const schema = z.object({ orderedPhotoIds: z.array(z.string()).min(1) })
      const parsed = schema.safeParse(body)
      if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Invalid reorder payload')

      await Promise.all(
        parsed.data.orderedPhotoIds.map((photoId, index) =>
          PhotoModel.updateOne({ _id: photoId, jobId }, { orderIndex: index })
        )
      )

      return okResponse({ ok: true })
    } catch (error) {
      console.error(error)
      return internalServerError()
    }
  },
})
