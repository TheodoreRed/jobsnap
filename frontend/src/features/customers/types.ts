import type { Job } from '@/features/jobs/types'

export interface Customer {
  id: string
  name: string
  defaultAddress?: string
  phoneNumber?: string
  email?: string
  createdAt: string
  updatedAt: string
}

export interface CustomerDetailResponse {
  customer: Customer
  jobs: Job[]
}
