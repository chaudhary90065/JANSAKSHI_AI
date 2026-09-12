'use client'

import { BarChart3, TrendingUp, AlertCircle, CheckCircle2, Clock, MapPin } from 'lucide-react'

export default function AdminDashboard() {
  const stats = [
    {
      title: 'Total Complaints',
      value: '2,450',
      change: '+12%',
      icon: AlertCircle,
      color: 'primary',
    },
    {
      title: 'Resolved',
      value: '1,960',
      change: '+8%',
      icon: CheckCircle2,
      color: 'accent',
    },
    {
      title: 'Pending',
      value: '324',
      change: '-5%',
      icon: Clock,
      color: 'primary',
    },
    {
      title: 'SLA Breached',
      value: '47',
      change: '+2%',
      icon: AlertCircle,
      color: 'danger',
    },
  ]

  const complaintsByCategory = [
    { category: 'Road', count: 320, percentage: 26 },
    { category: 'Water', count: 210, percentage: 17 },
    { category: 'School', count: 180, percentage: 15 },
    { category: 'Electricity', count: 165, percentage: 13 },
    { category: 'Police', count: 140, percentage: 11 },
    { category: 'Other', count: 233, percentage: 18 },
  ]

  const topHotspots = [
    { location: 'Main Chowk', complaints: 45, risk: 'CRITICAL', incidents: 8 },
    { location: 'ABC Village', complaints: 38, risk: 'HIGH', incidents: 5 },
    { location: 'XYZ School Area', complaints: 32, risk: 'HIGH', incidents: 3 },
    { location: 'Market Street', complaints: 28, risk: 'MEDIUM', incidents: 2 },
    { location: 'Residential Colony', complaints: 22, risk: 'MEDIUM', incidents: 1 },
  ]

  const recentComplaints = [
    { id: 'GOV-2026-0098', title: 'Pothole on Main Road', category: 'ROAD', status: 'RESOLVED', time: '2 hours ago' },
    { id: 'GOV-2026-0099', title: 'Water Pipeline Burst', category: 'WATER', status: 'IN_PROGRESS', time: '4 hours ago' },
    { id: 'GOV-2026-0100', title: 'School Infrastructure', category: 'SCHOOL', status: 'ASSIGNED', time: '6 hours ago' },
    { id: 'GOV-2026-0101', title: 'Streetlight Issue', category: 'ELECTRICITY', status: 'ESCALATED', time: '8 hours ago' },
  ]

  const topContractors = [
    { name: 'XYZ Construction', resolved: 156, rating: 4.8, slaViolations: 2 },
    { name: 'ABC Infrastructure', resolved: 142, rating: 4.6, slaViolations: 3 },
    { name: 'Water Board', resolved: 128, rating: 4.5, slaViolations: 1 },
    { name: 'Electricity Dept', resolved: 115, rating: 4.7, slaViolations: 0 },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-secondary mb-2">Governance Command Center</h1>
        <p className="text-gray-600">Real-time analytics and oversight of all complaints</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div key={idx} className="bg-white rounded-xl p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-600">{stat.title}</h3>
                <div className={`p-3 rounded-lg ${
                  stat.color === 'primary' ? 'bg-primary/20' :
                  stat.color === 'accent' ? 'bg-accent/20' :
                  'bg-red-200/50'
                }`}>
                  <Icon className={`${
                    stat.color === 'primary' ? 'text-primary' :
                    stat.color === 'accent' ? 'text-accent' :
                    'text-danger'
                  }`} size={24} />
                </div>
              </div>
              <div className="text-3xl font-bold text-secondary mb-2">{stat.value}</div>
              <p className={`text-sm font-semibold ${
                stat.change.startsWith('+') ? 'text-danger' : 'text-accent'
              }`}>
                {stat.change}
              </p>
            </div>
          )
        })}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-8 mb-12">
        {/* Complaints by Category */}
        <div className="lg:col-span-2 bg-white rounded-xl p-8 shadow-card">
          <h2 className="text-2xl font-bold text-secondary mb-6">Complaints by Category</h2>
          <div className="space-y-4">
            {complaintsByCategory.map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-700">{item.category}</span>
                  <span className="text-sm font-bold text-primary">{item.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{item.percentage}% of total</p>
              </div>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="bg-gradient-to-br from-primary to-orange-600 text-white rounded-xl p-8 shadow-card">
          <h2 className="text-2xl font-bold mb-6">Performance Metrics</h2>
          <div className="space-y-6">
            <div>
              <p className="text-sm opacity-90 mb-2">Average Resolution Time</p>
              <p className="text-3xl font-bold">5.2 Days</p>
              <p className="text-xs opacity-75 mt-1">↓ 12% from last month</p>
            </div>
            <div className="h-px bg-white opacity-20" />
            <div>
              <p className="text-sm opacity-90 mb-2">Citizen Satisfaction</p>
              <p className="text-3xl font-bold">98%</p>
              <p className="text-xs opacity-75 mt-1">↑ 3% from last month</p>
            </div>
            <div className="h-px bg-white opacity-20" />
            <div>
              <p className="text-sm opacity-90 mb-2">SLA Compliance</p>
              <p className="text-3xl font-bold">96.2%</p>
              <p className="text-xs opacity-75 mt-1">↑ 1.5% from last month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hotspots and Recent Complaints */}
      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        {/* High-Risk Hotspots */}
        <div className="bg-white rounded-xl p-8 shadow-card">
          <h2 className="text-2xl font-bold text-secondary mb-6 flex items-center gap-2">
            <MapPin size={24} className="text-danger" />
            High-Risk Hotspots
          </h2>
          <div className="space-y-4">
            {topHotspots.map((hotspot, idx) => (
              <div key={idx} className="border-l-4 border-danger pl-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-secondary">{hotspot.location}</h3>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    hotspot.risk === 'CRITICAL' ? 'bg-red-100 text-danger' :
                    'bg-orange-100 text-warning'
                  }`}>
                    {hotspot.risk}
                  </span>
                </div>
                <div className="flex gap-6 text-sm text-gray-600">
                  <span>📝 {hotspot.complaints} complaints</span>
                  <span>⚠️ {hotspot.incidents} incidents</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-8 shadow-card">
          <h2 className="text-2xl font-bold text-secondary mb-6">Recent Complaints</h2>
          <div className="space-y-3">
            {recentComplaints.map((complaint, idx) => (
              <div key={idx} className="p-4 bg-neutral rounded-lg hover:shadow-card transition">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-secondary">{complaint.id}</p>
                    <p className="text-sm text-gray-600">{complaint.title}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    complaint.status === 'RESOLVED' ? 'bg-green-100 text-accent' :
                    complaint.status === 'IN_PROGRESS' ? 'bg-orange-100 text-warning' :
                    complaint.status === 'ESCALATED' ? 'bg-red-100 text-danger' :
                    'bg-blue-100 text-primary'
                  }`}>
                    {complaint.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{complaint.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Contractors */}
      <div className="bg-white rounded-xl p-8 shadow-card">
        <h2 className="text-2xl font-bold text-secondary mb-6">Top Performers</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Contractor Name</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Resolved</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Rating</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">SLA Violations</th>
              </tr>
            </thead>
            <tbody>
              {topContractors.map((contractor, idx) => (
                <tr key={idx} className="border-b border-gray-200 hover:bg-neutral transition">
                  <td className="py-4 px-4 font-medium text-secondary">{contractor.name}</td>
                  <td className="py-4 px-4 text-center">
                    <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-full">
                      {contractor.resolved}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-yellow-500 font-bold">★ {contractor.rating}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`font-bold ${contractor.slaViolations === 0 ? 'text-accent' : 'text-warning'}`}>
                      {contractor.slaViolations}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
