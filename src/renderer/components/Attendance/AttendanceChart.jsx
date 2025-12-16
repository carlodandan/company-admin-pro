import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, TrendingUp, Loader2, AlertCircle } from 'lucide-react';

const AttendanceChart = () => {
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    leaveToday: 0,
    attendanceRate: '0%'
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    loadWeeklyData();
  }, []);

  const loadWeeklyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch real weekly data from database
      const [weeklyResponse, summaryResponse] = await Promise.all([
        window.electronAPI.getWeeklyAttendance(),
        window.electronAPI.getTodayAttendanceSummary()
      ]);
      
      // Set weekly data
      if (weeklyResponse && Array.isArray(weeklyResponse)) {
        setWeeklyData(weeklyResponse);
      } else {
        setWeeklyData([]);
      }
      
      // Set summary data
      if (summaryResponse) {
        setSummary(summaryResponse);
      }
      
    } catch (error) {
      console.error('Error loading weekly data:', error);
      setError('Failed to load attendance data. Please try again.');
      setWeeklyData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold">Weekly Attendance Trend</h3>
            <p className="text-gray-600">Loading attendance data...</p>
          </div>
        </div>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold">Weekly Attendance Trend</h3>
            <p className="text-gray-600">Error loading data</p>
          </div>
        </div>
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-300" />
          <p className="text-red-500">{error}</p>
          <button
            onClick={loadWeeklyData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!weeklyData || weeklyData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold">Weekly Attendance Trend</h3>
            <p className="text-gray-600">No attendance data available</p>
          </div>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Attendance data will appear here once recorded</p>
          <button
            onClick={loadWeeklyData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Data
          </button>
        </div>
      </div>
    );
  }

  // Find max value for scaling - include all status types for proper scaling
  const maxAttendance = Math.max(...weeklyData.map(day => 
    day.present + day.absent + (day.late || 0) + (day.leave || 0)
  )) || 1; // Default to 1 to avoid division by zero

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold">Weekly Attendance Trend</h3>
          <p className="text-gray-600">Last 7 days overview</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm">Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm">Late</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm">Leave</span>
          </div>
        </div>
      </div>

      <div className="h-48 flex items-end gap-3 mb-6 px-4">
        {weeklyData.map((day, index) => {
          const total = day.present + day.absent + (day.late || 0) + (day.leave || 0);
          const hasData = total > 0;
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="flex-1 w-full flex flex-col justify-end gap-0.5">
                {/* Present bar */}
                <div 
                  className="w-full bg-green-500 rounded-t hover:bg-green-600 transition-all duration-300 cursor-pointer"
                  style={{ 
                    height: hasData ? `${(day.present / maxAttendance) * 100}%` : '0%',
                    opacity: hasData ? 1 : 0.3
                  }}
                  title={`Present: ${day.present}`}
                ></div>
                
                {/* Late bar */}
                {(day.late || 0) > 0 && (
                  <div 
                    className="w-full bg-yellow-500 hover:bg-yellow-600 transition-all duration-300 cursor-pointer"
                    style={{ 
                      height: hasData ? `${(day.late / maxAttendance) * 100}%` : '0%' 
                    }}
                    title={`Late: ${day.late || 0}`}
                  ></div>
                )}
                
                {/* Leave bar */}
                {(day.leave || 0) > 0 && (
                  <div 
                    className="w-full bg-blue-500 hover:bg-blue-600 transition-all duration-300 cursor-pointer"
                    style={{ 
                      height: hasData ? `${(day.leave / maxAttendance) * 100}%` : '0%' 
                    }}
                    title={`On Leave: ${day.leave || 0}`}
                  ></div>
                )}
                
                {/* Absent bar */}
                <div 
                  className="w-full bg-red-500 rounded-t hover:bg-red-600 transition-all duration-300 cursor-pointer"
                  style={{ 
                    height: hasData ? `${(day.absent / maxAttendance) * 100}%` : '0%',
                    opacity: hasData ? 1 : 0.3
                  }}
                  title={`Absent: ${day.absent}`}
                ></div>
              </div>
              <span className="mt-2 text-sm font-medium text-gray-600">{day.day}</span>
              <span className="text-xs text-gray-400 mt-1">{new Date(day.date).getDate()}</span>
            </div>
          );
        })}
      </div>

      {/* Attendance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Present Today</p>
              <p className="text-xl font-bold">{summary.presentToday}</p>
            </div>
            <CheckCircle className="text-green-500" size={24} />
          </div>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp size={14} className="text-green-500" />
            <span className="text-sm text-green-600">Real-time data</span>
          </div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Absent Today</p>
              <p className="text-xl font-bold">{summary.absentToday}</p>
            </div>
            <XCircle className="text-red-500" size={24} />
          </div>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp size={14} className="text-red-500" />
            <span className="text-sm text-red-600">Real-time data</span>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Late Today</p>
              <p className="text-xl font-bold">{summary.lateToday || 0}</p>
            </div>
            <Clock className="text-yellow-500" size={24} />
          </div>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp size={14} className="text-yellow-500" />
            <span className="text-sm text-yellow-600">Real-time data</span>
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Attendance Rate</p>
              <p className="text-xl font-bold">{summary.attendanceRate}</p>
            </div>
            <TrendingUp className="text-blue-500" size={24} />
          </div>
          <div className="flex items-center gap-1 mt-2">
            <Clock size={14} className="text-blue-500" />
            <span className="text-sm text-blue-600">Based on today's data</span>
          </div>
        </div>
      </div>

      {/* Refresh button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={loadWeeklyData}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default AttendanceChart;