'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/api';

interface ComplaintItem {
  id: number;
  title: string;
  category: string;
  status: string;
  createdAt: string;
  daysPending: number | null;
}

interface DepartmentStat {
  department: string;
  total: number;
  resolved: number;
  pending: number;
  complaints: ComplaintItem[];
}

interface HotspotComplaint {
  id: number;
  title: string;
  status: string;
  district: string | null;
  block: string | null;
  village: string | null;
  address: string | null;
  latitude: string;
  longitude: string;
  createdAt: string;
  daysPending: number | null;
}

interface Hotspot {
  category: string;
  department: string;
  complaintCount: number;
  centerLatitude: number;
  centerLongitude: number;
  placeDetail: {
    district: string | null;
    block: string | null;
    village: string | null;
    address: string | null;
  };
  complaints: HotspotComplaint[];
}

export default function ComplaintClassifierPage() {
  const [activeTab, setActiveTab] = useState<'stats' | 'hotspots'>('stats');

  // Department stats state
  const [totalComplaints, setTotalComplaints] = useState(0);
  const [departments, setDepartments] = useState<DepartmentStat[]>([]);
  const [expandedDept, setExpandedDept] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  // Hotspots state
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [expandedHotspot, setExpandedHotspot] = useState<number | null>(null);
  const [hotspotsLoading, setHotspotsLoading] = useState(true);
  const [hotspotsError, setHotspotsError] = useState('');
  const [hotspotsFetched, setHotspotsFetched] = useState(false);

  useEffect(() => {
    axios
      .get('/api/complaints/classifier-stats')
      .then((res) => {
        setTotalComplaints(res.data.totalComplaints);
        setDepartments(res.data.departments);
      })
      .catch(() => setStatsError('Could not load complaint data'))
      .finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'hotspots' && !hotspotsFetched) {
      axios
        .get('/api/complaints/hotspots')
        .then((res) => {
          setHotspots(res.data.hotspots);
        })
        .catch(() => setHotspotsError('Could not load hotspot data'))
        .finally(() => {
          setHotspotsLoading(false);
          setHotspotsFetched(true);
        });
    }
  }, [activeTab, hotspotsFetched]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">🤖 AI Complaint Classifier</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b mb-6">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'stats'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Department Stats
        </button>
        <button
          onClick={() => setActiveTab('hotspots')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'hotspots'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📍 Hotspots
        </button>
      </div>

      {/* Department Stats Tab */}
      {activeTab === 'stats' && (
        <>
          {statsLoading && <div className="p-8">Loading...</div>}
          {statsError && <div className="p-8 text-red-600">{statsError}</div>}
          {!statsLoading && !statsError && (
            <>
              <p className="text-gray-600 mb-6">
                Total Complaints: <span className="font-semibold">{totalComplaints}</span>
              </p>

              <div className="space-y-3">
                {departments.map((dept) => (
                  <div key={dept.department} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() =>
                        setExpandedDept(expandedDept === dept.department ? null : dept.department)
                      }
                      className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 text-left"
                    >
                      <span className="font-semibold">{dept.department}</span>
                      <span className="text-sm text-gray-600">
                        Total: {dept.total} | Resolved: {dept.resolved} | Pending: {dept.pending}
                      </span>
                    </button>

                    {expandedDept === dept.department && (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-100 text-left">
                            <th className="p-2">ID</th>
                            <th className="p-2">Title</th>
                            <th className="p-2">Category</th>
                            <th className="p-2">Status</th>
                            <th className="p-2">Filed On</th>
                            <th className="p-2">Days Pending</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dept.complaints.map((c) => (
                            <tr key={c.id} className="border-t">
                              <td className="p-2">#{c.id}</td>
                              <td className="p-2">{c.title}</td>
                              <td className="p-2">{c.category}</td>
                              <td className="p-2">{c.status}</td>
                              <td className="p-2">
                                {new Date(c.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-2">
                                {c.daysPending === null ? '—' : `${c.daysPending} days`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Hotspots Tab */}
      {activeTab === 'hotspots' && (
        <>
          {hotspotsLoading && <div className="p-8">Loading...</div>}
          {hotspotsError && <div className="p-8 text-red-600">{hotspotsError}</div>}
          {!hotspotsLoading && !hotspotsError && (
            <>
              <p className="text-gray-600 mb-6">
                Total Hotspots: <span className="font-semibold">{hotspots.length}</span>
                <span className="text-xs text-gray-400 ml-2">
                  (2+ same-category complaints within ~150m of each other)
                </span>
              </p>

              {hotspots.length === 0 && (
                <p className="text-gray-500">
                  Abhi koi hotspot detect nahi hua. Jaise-jaise GPS-tagged complaints aayengi, yahan dikhne lagengi.
                </p>
              )}

              <div className="space-y-3">
                {hotspots.map((h, idx) => (
                  <div key={idx} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedHotspot(expandedHotspot === idx ? null : idx)}
                      className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 text-left"
                    >
                      <div>
                        <span className="font-semibold">{h.category}</span>
                        <span className="text-sm text-gray-500 ml-2">({h.department})</span>
                        <div className="text-xs text-gray-500 mt-1">
                          {[h.placeDetail.village, h.placeDetail.block, h.placeDetail.district]
                            .filter(Boolean)
                            .join(', ') || h.placeDetail.address || 'Location detail not available'}
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-red-600 whitespace-nowrap ml-4">
                        {h.complaintCount} complaints
                      </span>
                    </button>

                    {expandedHotspot === idx && (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-100 text-left">
                            <th className="p-2">ID</th>
                            <th className="p-2">Title</th>
                            <th className="p-2">Status</th>
                            <th className="p-2">Address</th>
                            <th className="p-2">Filed On</th>
                            <th className="p-2">Days Pending</th>
                          </tr>
                        </thead>
                        <tbody>
                          {h.complaints.map((c) => (
                            <tr key={c.id} className="border-t">
                              <td className="p-2">#{c.id}</td>
                              <td className="p-2">{c.title}</td>
                              <td className="p-2">{c.status}</td>
                              <td className="p-2">
                                {c.address ||
                                  [c.village, c.block, c.district].filter(Boolean).join(', ') ||
                                  '—'}
                              </td>
                              <td className="p-2">
                                {new Date(c.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-2">
                                {c.daysPending === null ? '—' : `${c.daysPending} days`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}