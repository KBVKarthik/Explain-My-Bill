export interface LineItem {
  id: number
  description: string
  amount: number
  explanation: string
  suspicious: string
  flags: string
}

export interface Bill {
  id: number
  title: string
  category: string
  source: string
  total_amount: number
  suspicious_score: number
  summary: string
  created_at: string
  line_items: LineItem[]
}
