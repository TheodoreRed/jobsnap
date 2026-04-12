export type JobStatus = 'Draft' | 'In Progress' | 'Complete'
export type PhotoTag = 'Before' | 'During' | 'After' | 'Other'

export interface Photo {
  id: string
  jobId: string
  fileReference: string
  uploadedAt: string
  orderIndex: number
  caption?: string
  tag?: PhotoTag
}

export interface Job {
  id: string
  title: string
  customerName: string
  address: string
  workOrderReference?: string
  description?: string
  notes?: string
  status: JobStatus
  createdAt: string
  updatedAt: string
  photoCount: number
  latestReportGeneratedAt?: string
}

export interface JobDetailResponse {
  job: Job
  photos: Photo[]
}
