import { Task, User, Notification, Remark, TaskCategory, IncidentReport } from "@/types";
import { ALL_TASK_DEFINITIONS } from "@/data/taskDefinitions";
import { getDefaultDueDate } from "@/utils/dateUtils";

// Mock users data
export const MOCK_USERS: User[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@amc.com",
    role: "admin",
    post: "System Administrator",
    department: "IT",
    joinDate: "2023-01-01",
  },
  {
    id: "2",
    name: "John Doe",
    email: "john@amc.com",
    role: "user",
    post: "IT Technician",
    department: "IT",
    joinDate: "2023-03-15",
  },
  {
    id: "3",
    name: "Jane Smith",
    email: "jane@amc.com",
    role: "user",
    post: "Network Engineer",
    department: "IT",
    joinDate: "2023-02-10",
  },
  {
    id: "4",
    name: "Mike Johnson",
    email: "mike@amc.com",
    role: "user",
    post: "System Administrator",
    department: "IT",
    joinDate: "2023-01-05",
  },
  {
    id: "5",
    name: "Sarah Wilson",
    email: "sarah@amc.com",
    role: "user",
    post: "Security Specialist",
    department: "Security",
    joinDate: "2023-04-20",
  },
];

// Mock credentials
export const MOCK_CREDENTIALS: Record<string, string> = {
  "admin@amc.com": "admin123",
  "john@amc.com": "john123",
  "jane@amc.com": "jane123",
  "mike@amc.com": "mike123",
  "sarah@amc.com": "sarah123",
};

// Generate mock tasks
export const generateMockTasks = (): Task[] => {
  return ALL_TASK_DEFINITIONS.slice(0, 10).map((def, index) => {
    const status =
      index % 4 === 0
        ? "completed"
        : index % 3 === 0
          ? "in-progress"
          : "pending";

    const dueDate = getDefaultDueDate(def.category);

    return {
      id: `task-${index + 1}`,
      title: def.title,
      description: def.description,
      category: def.category,
      status: status,
      priority: index % 3 === 0 ? "high" : index % 2 === 0 ? "medium" : "low",
      assignedTo: index < 5 ? "2" : "3",
      assignedBy: "1",
      dueDate: dueDate.toISOString(),
      createdAt: new Date().toISOString(),
      estimatedTime: def.estimatedTime,
      completedAt: index % 4 === 0 ? new Date().toISOString() : undefined,
    };
  });
};

// Generate mock notifications
export const generateMockNotifications = (): Notification[] => {
  return [
    {
      id: "notif-1",
      title: "New Task Assigned",
      message: "AV Check task has been assigned to you",
      type: "task-assigned",
      priority: "medium",
      userId: "2",
      read: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: "notif-2",
      title: "Task Reminder",
      message: "Network Connectivity check is due in 1 hour",
      type: "task-reminder",
      priority: "high",
      userId: "2",
      read: false,
      createdAt: new Date().toISOString(),
    },
  ];
};

// Generate mock remarks
export const generateMockRemarks = (): Remark[] => {
  return [
    {
      id: "remark-1",
      userId: "2",
      taskId: "task-1",
      message:
        "The AV system in conference room A is not responding. I've tried basic troubleshooting but it still doesn't work.",
      type: "issue",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      adminResponse:
        "Thank you for reporting this. I've contacted the AV vendor and they will visit tomorrow morning to fix the issue.",
      respondedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "remark-2",
      userId: "3",
      message:
        "I think we should implement automated backup verification instead of manual checks every month.",
      type: "suggestion",
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "remark-3",
      userId: "4",
      taskId: "task-3",
      message:
        "The server room temperature monitoring is working well. No issues to report this week.",
      type: "feedback",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
  ];
};

// Generate mock incident reports
export const generateMockIncidentReports = (): IncidentReport[] => {
  return [
    {
      id: "incident-1",
      title: "Server Room Temperature Alert",
      description: "Temperature in server room exceeded 25°C for more than 30 minutes",
      severity: "high",
      reportedBy: "2",
      reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: "resolved",
      assignedTo: "4",
      resolvedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      resolution: "AC unit was restarted and temperature normalized",
      category: "system",
      location: "Server Room A",
    },
    {
      id: "incident-2",
      title: "Network Connectivity Issues",
      description: "Multiple users reported slow network speeds in Building B",
      severity: "medium",
      reportedBy: "3",
      reportedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      status: "investigating",
      assignedTo: "3",
      category: "network",
      location: "Building B",
    },
    {
      id: "incident-3",
      title: "Suspicious Login Attempts",
      description: "Multiple failed login attempts detected from unknown IP addresses",
      severity: "high",
      reportedBy: "5",
      reportedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      status: "open",
      category: "security",
    },
    {
      id: "incident-4",
      title: "Printer Hardware Failure",
      description: "Main office printer showing hardware error codes",
      severity: "low",
      reportedBy: "2",
      reportedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      status: "resolved",
      resolvedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
      resolution: "Replaced faulty toner cartridge",
      category: "hardware",
      location: "Main Office",
    },
  ];
};

// Mock data storage utilities
export const mockDataService = {
  // Users
  getUsers: (): User[] => {
    const stored = localStorage.getItem("amc_users");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return MOCK_USERS;
      }
    }
    return MOCK_USERS;
  },

  saveUsers: (users: User[]): void => {
    localStorage.setItem("amc_users", JSON.stringify(users));
  },

  // Tasks
  getTasks: (): Task[] => {
    const stored = localStorage.getItem("amc_tasks");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        const mockTasks = generateMockTasks();
        mockDataService.saveTasks(mockTasks);
        return mockTasks;
      }
    }
    const mockTasks = generateMockTasks();
    mockDataService.saveTasks(mockTasks);
    return mockTasks;
  },

  saveTasks: (tasks: Task[]): void => {
    localStorage.setItem("amc_tasks", JSON.stringify(tasks));
  },

  // Notifications
  getNotifications: (): Notification[] => {
    const stored = localStorage.getItem("amc_notifications");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        const mockNotifications = generateMockNotifications();
        mockDataService.saveNotifications(mockNotifications);
        return mockNotifications;
      }
    }
    const mockNotifications = generateMockNotifications();
    mockDataService.saveNotifications(mockNotifications);
    return mockNotifications;
  },

  saveNotifications: (notifications: Notification[]): void => {
    localStorage.setItem("amc_notifications", JSON.stringify(notifications));
  },

  // Remarks
  getRemarks: (): Remark[] => {
    const stored = localStorage.getItem("amc_remarks");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        const mockRemarks = generateMockRemarks();
        mockDataService.saveRemarks(mockRemarks);
        return mockRemarks;
      }
    }
    const mockRemarks = generateMockRemarks();
    mockDataService.saveRemarks(mockRemarks);
    return mockRemarks;
  },

  saveRemarks: (remarks: Remark[]): void => {
    localStorage.setItem("amc_remarks", JSON.stringify(remarks));
  },

  // Incident Reports
  getIncidentReports: (): IncidentReport[] => {
    const stored = localStorage.getItem("amc_incident_reports");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        const mockIncidents = generateMockIncidentReports();
        mockDataService.saveIncidentReports(mockIncidents);
        return mockIncidents;
      }
    }
    const mockIncidents = generateMockIncidentReports();
    mockDataService.saveIncidentReports(mockIncidents);
    return mockIncidents;
  },

  saveIncidentReports: (incidents: IncidentReport[]): void => {
    localStorage.setItem("amc_incident_reports", JSON.stringify(incidents));
  },

  // Credentials
  getCredentials: (): Record<string, string> => {
    const stored = localStorage.getItem("amc_credentials");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return MOCK_CREDENTIALS;
      }
    }
    return MOCK_CREDENTIALS;
  },

  saveCredentials: (credentials: Record<string, string>): void => {
    localStorage.setItem("amc_credentials", JSON.stringify(credentials));
  },

  // Initialize all mock data
  initializeMockData: (): void => {
    if (!localStorage.getItem("amc_users")) {
      mockDataService.saveUsers(MOCK_USERS);
    }
    if (!localStorage.getItem("amc_credentials")) {
      mockDataService.saveCredentials(MOCK_CREDENTIALS);
    }
    // Tasks, notifications, and remarks are initialized when accessed
  },
};

// Initialize mock data on import
mockDataService.initializeMockData();
