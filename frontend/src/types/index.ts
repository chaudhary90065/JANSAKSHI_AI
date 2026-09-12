// User Types
export type UserRole = 'CITIZEN' | 'CONTRACTOR' | 'POLICE' | 'OFFICER' | 'ADMIN'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  district: string
  createdAt: string
  avatar?: string
}

export interface CitizenUser extends User {
  role: 'CITIZEN'
  address: string
  complaints: string[]
}

export interface AuthorityUser extends User {
  role: 'CONTRACTOR' | 'POLICE' | 'OFFICER' | 'ADMIN'
  employeeId: string
  department: string
  designation: string
}

// Complaint Types
export type ComplaintStatus =
  | 'SUBMITTED'
  | 'AI_VERIFIED'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETION_CLAIMED'
  | 'CITIZEN_VERIFICATION'
  | 'OFFICER_VERIFICATION'
  | 'RESOLVED'
  | 'REJECTED'
  | 'ESCALATED'

export type ComplaintCategory =
  | 'ROAD'
  | 'WATER'
  | 'SCHOOL'
  | 'ELECTRICITY'
  | 'SANITATION'
  | 'DRAINAGE'
  | 'POLICE'
  | 'OTHER'

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface Complaint {
  id: string
  complaintNumber: string
  userId: string
  category: ComplaintCategory
  title: string
  description: string
  district: string
  block?: string
  village?: string
  address: string
  latitude: string
  longitude: string
  status: ComplaintStatus
  priority: ComplaintPriority
  aiCategory?: ComplaintCategory
  aiConfidence?: number
  projectId?: string
  contractorId?: string
  createdAt: string
  updatedAt: string
  slaDeadline?: string
  resolvedAt?: string
}

// Evidence Types
export interface Evidence {
  id: string
  complaintId: string
  fileName: string
  fileType: 'image' | 'video' | 'audio' | 'document'
  filePath: string
  sha256Hash: string
  latitude?: string
  longitude?: string
  capturedAt: string
  uploadedAt: string
  uploadedBy: string
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED'
}

// Contractor Types
export interface Contractor {
  id: string
  name: string
  companyName: string
  registrationNumber: string
  phone: string
  email: string
  district: string
  performanceScore: number
  totalProjects: number
  completedProjects: number
  slaViolations: number
  repeatDefects: number
  rewardPoints: number
}

// Project Types
export interface Project {
  id: string
  projectCode: string
  projectName: string
  category: ComplaintCategory
  department: string
  district: string
  block?: string
  village?: string
  latitude?: string
  longitude?: string
  contractorId: string
  workOrderNumber: string
  startDate: string
  completionDate: string
  defectLiabilityYears: number
  maintenanceEndDate?: string
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED'
}

// Police Case Types
export type CaseStatus =
  | 'FILED'
  | 'UNDER_REVIEW'
  | 'FIR_REGISTERED'
  | 'INVESTIGATION'
  | 'RESOLVED'
  | 'CLOSED'

export interface PoliceCase {
  id: string
  caseNumber: string
  complaintId: string
  policeStation: string
  officerId?: string
  incidentDate: string
  category: ComplaintCategory
  status: CaseStatus
  firStatus: 'PENDING' | 'REGISTERED' | 'REJECTED'
  firNumber?: string
  createdAt: string
  updatedAt: string
  escalationLevel: number
}

// Feedback Types
export interface Feedback {
  id: string
  complaintId: string
  userId: string
  rating: number
  comment: string
  verificationPhotos?: string[]
  createdAt: string
}

// Escalation Types
export type EscalationReason =
  | 'SLA_BREACHED'
  | 'QUALITY_ISSUE'
  | 'CITIZEN_COMPLAINT'
  | 'REPEAT_DEFECT'
  | 'OTHER'

export interface Escalation {
  id: string
  complaintId: string
  fromRole: UserRole
  toRole: UserRole
  reason: EscalationReason
  description?: string
  createdAt: string
  status: 'ACTIVE' | 'RESOLVED'
}

// Notification Types
export type NotificationType =
  | 'COMPLAINT_CREATED'
  | 'COMPLAINT_ASSIGNED'
  | 'STATUS_UPDATE'
  | 'SLA_WARNING'
  | 'ESCALATION'
  | 'FEEDBACK_REQUEST'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  relatedId?: string
  read: boolean
  createdAt: string
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
  statusCode: number
}

// Filter Types
export interface ComplaintFilter {
  category?: ComplaintCategory
  status?: ComplaintStatus
  priority?: ComplaintPriority
  district?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: 'createdAt' | 'priority' | 'status'
  sortOrder?: 'asc' | 'desc'
}

// Dashboard Stats
export interface DashboardStats {
  totalComplaints: number
  resolvedComplaints: number
  pendingComplaints: number
  slaBreached: number
  averageResolutionTime: number
  satisfactionRate: number
}

// Hotspot Data
export interface Hotspot {
  id: string
  location: string
  latitude: string
  longitude: string
  complaintCount: number
  accidentCount: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  category: ComplaintCategory
}

// SLA Config
export interface SLAConfig {
  category: ComplaintCategory
  days: number
  escalationDays?: number
  criticalDays?: number
}

// Audit Log
export interface AuditLog {
  id: string
  userId: string
  action: string
  entity: string
  entityId: string
  changes?: Record<string, unknown>
  timestamp: string
}
