import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTask } from "@/context/TaskContext";
import { useAuth } from "@/context/AuthContext";
import ModernChart from "@/components/charts/ModernChart";
import DeadlineAlert, { getDeadlineStatus } from "@/components/DeadlineAlert";
import {
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Bell,
  BarChart3,
  Settings,
  TrendingUp,
  Calendar,
  Target,
  Activity,
  Shield,
  FileText,
  AlertCircle,
  CheckSquare,
  XCircle,
  Eye,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format, isToday, isTomorrow, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from "date-fns";

const AdminDashboard = () => {
  const { tasks, notifications, incidentReports, getTasksByUser } = useTask();
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  // Calculate overall statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = tasks.filter((t) => t.status === "pending").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress").length;
  const overdueTasks = tasks.filter(
    (t) => new Date(t.dueDate) < new Date() && t.status !== "completed",
  ).length;

  // Calculate compliance percentage
  const compliancePercentage = totalTasks > 0 
    ? Math.round(((completedTasks + inProgressTasks) / totalTasks) * 100) 
    : 0;

  // Get critical deadline tasks
  const criticalTasks = tasks.filter((task) => {
    const status = getDeadlineStatus(task.dueDate, task.status);
    return status.urgency === "overdue" || status.urgency === "critical";
  });

  // Filter tasks by period
  const getTasksByPeriod = (period: "daily" | "weekly" | "monthly") => {
    // Filter by task category instead of due date
    return tasks.filter((task) => task.category === period);
  };

  const periodTasks = getTasksByPeriod(selectedPeriod);
  const periodCompleted = periodTasks.filter((t) => t.status === "completed").length;
  const periodPending = periodTasks.filter((t) => t.status === "pending").length;
  const periodInProgress = periodTasks.filter((t) => t.status === "in-progress").length;

  // Incident reports statistics
  const openIncidents = incidentReports.filter((i) => i.status === "open").length;
  const investigatingIncidents = incidentReports.filter((i) => i.status === "investigating").length;
  const resolvedIncidents = incidentReports.filter((i) => i.status === "resolved").length;
  const highPriorityIncidents = incidentReports.filter((i) => i.severity === "high").length;

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  // Data for charts
  const taskCompletionData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Completed Tasks",
        data: [12, 19, 15, 17, 14, 22, 18],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
      },
      {
        label: "Total Tasks",
        data: [15, 22, 18, 20, 17, 25, 21],
        borderColor: "rgb(156, 163, 175)",
        backgroundColor: "rgba(156, 163, 175, 0.1)",
        fill: true,
      },
    ],
  };

  const taskStatusData = {
    labels: ["Completed", "In Progress", "Pending", "Overdue"],
    datasets: [
      {
        label: "Tasks",
        data: [completedTasks, inProgressTasks, pendingTasks, overdueTasks],
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(156, 163, 175, 0.8)",
          "rgba(239, 68, 68, 0.8)",
        ],
        borderWidth: 2,
        borderColor: "white",
      },
    ],
  };

  const incidentData = {
    labels: ["Open", "Investigating", "Resolved", "Closed"],
    datasets: [
      {
        label: "Incidents",
        data: [
          openIncidents,
          investigatingIncidents,
          resolvedIncidents,
          incidentReports.filter((i) => i.status === "closed").length,
        ],
        backgroundColor: [
          "rgba(239, 68, 68, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(156, 163, 175, 0.8)",
        ],
        borderWidth: 2,
        borderColor: "white",
      },
    ],
  };

  const complianceData = {
    labels: ["Compliant", "Non-Compliant"],
    datasets: [
      {
        label: "Compliance",
        data: [compliancePercentage, 100 - compliancePercentage],
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)",
          "rgba(239, 68, 68, 0.8)",
        ],
        borderWidth: 2,
        borderColor: "white",
      },
    ],
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "text-red-600 bg-red-100";
      case "medium": return "text-orange-600 bg-orange-100";
      case "low": return "text-green-600 bg-green-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "text-red-600 bg-red-100";
      case "investigating": return "text-orange-600 bg-orange-100";
      case "resolved": return "text-green-600 bg-green-100";
      case "closed": return "text-gray-600 bg-gray-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Overview of system performance and task management
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <Link to="/admin/tasks">
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/reports">
              <BarChart3 className="mr-2 h-4 w-4" />
              View Reports
            </Link>
          </Button>
        </div>
      </div>

      {/* Critical Deadline Alerts */}
      {criticalTasks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Critical Deadline Alerts ({criticalTasks.length})
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {criticalTasks.slice(0, 3).map((task) => (
              <DeadlineAlert
                key={task.id}
                task={task}
                showAlert={true}
                className="animate-pulse"
              />
            ))}
            {criticalTasks.length > 3 && (
              <div className="text-sm text-red-600 text-center">
                +{criticalTasks.length - 3} more critical tasks require attention
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">Across all users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {compliancePercentage}%
            </div>
            <p className="text-xs text-muted-foreground">
              {completedTasks + inProgressTasks} of {totalTasks} tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {openIncidents + investigatingIncidents}
            </div>
            <p className="text-xs text-muted-foreground">
              {highPriorityIncidents} high priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {overdueTasks > 0 ? "Overdue Tasks" : "Active Users"}
            </CardTitle>
            {overdueTasks > 0 ? (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            ) : (
              <Users className="h-4 w-4 text-blue-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${overdueTasks > 0 ? "text-red-600" : "text-blue-600"}`}
            >
              {overdueTasks > 0 ? overdueTasks : 5}
            </div>
            <p className="text-xs text-muted-foreground">
              {overdueTasks > 0
                ? "Need immediate attention"
                : "Currently online"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Task Assignment by Period */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Task Assignments by Period
          </CardTitle>
          <CardDescription>
            Overview of tasks assigned by admin for different time periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as "daily" | "weekly" | "monthly")}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
            
            <TabsContent value="daily" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-green-700">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{periodCompleted}</p>
                  </div>
                  <CheckSquare className="h-8 w-8 text-green-600" />
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-blue-700">In Progress</p>
                    <p className="text-2xl font-bold text-blue-600">{periodInProgress}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-orange-700">Pending</p>
                    <p className="text-2xl font-bold text-orange-600">{periodPending}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Recent Daily Tasks</h4>
                <div className="space-y-2">
                  {periodTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-gray-600">
                          Due: {format(new Date(task.dueDate), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <Badge variant={task.status === "completed" ? "default" : "secondary"}>
                        {task.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="weekly" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-green-700">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{periodCompleted}</p>
                  </div>
                  <CheckSquare className="h-8 w-8 text-green-600" />
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-blue-700">In Progress</p>
                    <p className="text-2xl font-bold text-blue-600">{periodInProgress}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-orange-700">Pending</p>
                    <p className="text-2xl font-bold text-orange-600">{periodPending}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Weekly Task Overview</h4>
                <div className="space-y-2">
                  {periodTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-gray-600">
                          Due: {format(new Date(task.dueDate), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <Badge variant={task.status === "completed" ? "default" : "secondary"}>
                        {task.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="monthly" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-green-700">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{periodCompleted}</p>
                  </div>
                  <CheckSquare className="h-8 w-8 text-green-600" />
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-blue-700">In Progress</p>
                    <p className="text-2xl font-bold text-blue-600">{periodInProgress}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-orange-700">Pending</p>
                    <p className="text-2xl font-bold text-orange-600">{periodPending}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Monthly Task Overview</h4>
                <div className="space-y-2">
                  {periodTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-gray-600">
                          Due: {format(new Date(task.dueDate), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <Badge variant={task.status === "completed" ? "default" : "secondary"}>
                        {task.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Completion Trend */}
          <ModernChart 
            type="line" 
            data={taskCompletionData} 
            title="Task Completion Trend"
            description="Daily task completion over the past week"
          />

          {/* Task Status Distribution */}
          <ModernChart 
            type="doughnut" 
            data={taskStatusData} 
            title="Task Status Distribution"
            description="Current breakdown of all tasks by status"
          />

          {/* Compliance Chart */}
          <ModernChart 
            type="doughnut" 
            data={complianceData} 
            title="Compliance Overview"
            description="Overall system compliance percentage"
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Today's Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Tasks Due Today</span>
                <span className="font-medium">{tasks.filter((t) => isToday(new Date(t.dueDate))).length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Completed Today</span>
                <span className="font-medium text-green-600">
                  {
                    tasks.filter(
                      (t) =>
                        t.status === "completed" &&
                        t.completedAt &&
                        isToday(new Date(t.completedAt)),
                    ).length
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">In Progress</span>
                <span className="font-medium text-blue-600">
                  {inProgressTasks}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Unread Notifications</span>
                <span className="font-medium text-orange-600">
                  {unreadNotifications}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Incident Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Incident Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {incidentReports
                  .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())
                  .slice(0, 5)
                  .map((incident) => (
                    <div key={incident.id} className="p-3 bg-gray-50 rounded">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{incident.title}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {format(new Date(incident.reportedAt), "MMM dd, HH:mm")}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Badge className={`text-xs ${getSeverityColor(incident.severity)}`}>
                            {incident.severity}
                          </Badge>
                          <Badge className={`text-xs ${getStatusColor(incident.status)}`}>
                            {incident.status}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                        {incident.description}
                      </p>
                    </div>
                  ))}
              </div>
              <div className="mt-4">
                <Button variant="outline" size="sm" className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  View All Incidents
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Tasks with Deadline Status */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime(),
                  )
                  .slice(0, 5)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-gray-600">
                          {task.assignedTo
                            ? `Assigned to User ${task.assignedTo}`
                            : "Unassigned"}
                        </p>
                      </div>
                      <DeadlineAlert task={task} className="text-xs" />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
