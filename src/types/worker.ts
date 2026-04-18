export type WorkerField = '청소' | '수리'
export type WorkerStatus = '활동중' | '만료'

export type Worker = {
  id: string
  name: string
  field: WorkerField
  status: WorkerStatus
  phone: string
  bankName: string
  accountNumber: string
  holder: string
  rrnHead: string
  baseAmount: number
  token: string
  startDate: string
  memo: string
}

export type WorkerWithStats = Worker & {
  thisMonthJobs: number
  thisMonthTotal: number
}

export type WorkerJob = {
  id: string
  date: string
  site: string
  task: string
  amount: number
}
