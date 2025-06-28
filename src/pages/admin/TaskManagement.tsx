import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTask } from "@/context/TaskContext";
import { getAllUsers } from "@/context/AuthContext";
import {
  getTaskDefinitionsByCategory,
  ALL_TASK_DEFINITIONS,
} from "@/data/taskDefinitions";
import { TaskCategory } from "@/types";
import {
  Plus,
  Search,
  Filter,
  Users,
  User,
  Calendar,
  Clock,
  Info,
} from "lucide-react";
import DeadlineAlert from "@/components/DeadlineAlert";
import {
  getDefaultDueDate,
  getDueDateRangeDescription,
  formatDueDate,
} from "@/utils/dateUtils";
import { format } from "date-fns";

const TaskManagement = () => {
  const { tasks, createTask, assignTask } = useTask();
  const [selectedCategory, setSelectedCategory] =
    useState<TaskCategory>("daily");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isAutoAssignDialogOpen, setIsAutoAssignDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [selectedTaskForAssign, setSelectedTaskForAssign] = useState<
    string | null
  >(null);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    status: "all",
    assignedTo: "all",
    dueDate: "all",
  });

  const [autoAssignConfig, setAutoAssignConfig] = useState({
    strategy: "distribute" as "distribute" | "round-robin" | "load-balance",
    includeUnassigned: true,
    assignToAllUsers: true,
    skipExisting: true,
  });

  const [scheduledAutoAssign, setScheduledAutoAssign] = useState({
    enabled: false,
    time: "09:00",
    lastRun: null as string | null,
  });

  // Load available users from localStorage
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const allUsers = await getAllUsers();
        // Filter out admin users, only show regular users for task assignment
        const regularUsers = allUsers
          .filter((user) => user.role === "user")
          .map((user) => ({
            id: user.id,
            name: user.name,
            post: user.post || "Staff",
            email: user.email,
          }));
        setAvailableUsers(regularUsers);
      } catch (error) {
        console.error("Failed to load users:", error);
        setAvailableUsers([]);
      }
    };

    loadUsers();

    // Listen for storage changes to update user list in real-time
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "amc_users") {
        loadUsers();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Load auto-assignment configuration from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('amc_auto_assign_config');
    const savedSchedule = localStorage.getItem('amc_scheduled_auto_assign');
    
    if (savedConfig) {
      setAutoAssignConfig(JSON.parse(savedConfig));
    }
    
    if (savedSchedule) {
      setScheduledAutoAssign(JSON.parse(savedSchedule));
    }
  }, []);

  // Save configuration to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('amc_auto_assign_config', JSON.stringify(autoAssignConfig));
  }, [autoAssignConfig]);

  useEffect(() => {
    localStorage.setItem('amc_scheduled_auto_assign', JSON.stringify(scheduledAutoAssign));
  }, [scheduledAutoAssign]);

  // Handle scheduled auto-assignment
  useEffect(() => {
    if (!scheduledAutoAssign.enabled) return;

    const checkScheduledAssignment = () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      // Check if we already ran today
      if (scheduledAutoAssign.lastRun === today) return;
      
      const [scheduledHour, scheduledMinute] = scheduledAutoAssign.time.split(':').map(Number);
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Check if it's time to run (within 1 minute of scheduled time)
      if (currentHour === scheduledHour && Math.abs(currentMinute - scheduledMinute) <= 1) {
        handleAutoAssignDailyTasks();
        setScheduledAutoAssign(prev => ({
          ...prev,
          lastRun: today
        }));
      }
    };

    // Check every minute
    const interval = setInterval(checkScheduledAssignment, 60000);
    
    // Also check immediately
    checkScheduledAssignment();
    
    return () => clearInterval(interval);
  }, [scheduledAutoAssign.enabled, scheduledAutoAssign.time, scheduledAutoAssign.lastRun]);

  const getUserInfo = (userId: string) => {
    return (
      availableUsers.find((u) => u.id === userId) || {
        name: "Unassigned",
        post: "",
      }
    );
  };

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    category: "daily" as TaskCategory,
    estimatedTime: 30,
    dueDate: formatDueDate(getDefaultDueDate("daily")),
  });

  // Update due date when category changes
  useEffect(() => {
    const defaultDueDate = getDefaultDueDate(newTask.category);
    setNewTask((prev) => ({
      ...prev,
      dueDate: formatDueDate(defaultDueDate),
    }));
  }, [newTask.category]);

  const predefinedTasks = getTaskDefinitionsByCategory(selectedCategory);
  const existingTasks = tasks.filter(
    (task) => task.category === selectedCategory,
  );

  const filteredTasks = existingTasks.filter((task) => {
    // Search filter
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus =
      filters.status === "all" || task.status === filters.status;

    // Assigned user filter
    const matchesAssignedTo =
      filters.assignedTo === "all" || task.assignedTo === filters.assignedTo;

    // Due date filter
    let matchesDueDate = true;
    if (filters.dueDate !== "all") {
      const taskDueDate = new Date(task.dueDate);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      switch (filters.dueDate) {
        case "overdue":
          matchesDueDate = taskDueDate < today && task.status !== "completed";
          break;
        case "today":
          matchesDueDate = taskDueDate >= today && taskDueDate < tomorrow;
          break;
        case "week":
          matchesDueDate = taskDueDate >= today && taskDueDate <= nextWeek;
          break;
        default:
          matchesDueDate = true;
      }
    }

    return (
      matchesSearch && matchesStatus && matchesAssignedTo && matchesDueDate
    );
  });

  const handleCreateTask = () => {
    createTask({
      ...newTask,
      dueDate: new Date(newTask.dueDate).toISOString(),
    });
    setNewTask({
      title: "",
      description: "",
      category: "daily",
      estimatedTime: 30,
      dueDate: formatDueDate(getDefaultDueDate("daily")),
    });
    setIsCreateDialogOpen(false);
  };

  const handleCreateFromTemplate = (template: any) => {
    const appropriateDueDate = getDefaultDueDate(template.category);

    createTask({
      title: template.title,
      description: template.description,
      category: template.category,
      estimatedTime: template.estimatedTime,
      dueDate: appropriateDueDate.toISOString(),
    });
  };

  const handleAssignTask = (userId: string) => {
    if (selectedTaskForAssign) {
      assignTask(selectedTaskForAssign, userId);
      setIsAssignDialogOpen(false);
      setSelectedTaskForAssign(null);
    }
  };

  const handleAutoAssignDailyTasks = () => {
    if (availableUsers.length === 0) {
      alert("No users available for task assignment");
      return;
    }

    // Get all daily task definitions
    const dailyTaskDefinitions = getTaskDefinitionsByCategory("daily");
    
    // Check if daily tasks already exist for today
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const existingDailyTasks = tasks.filter(task => 
      task.category === "daily" && 
      task.dueDate.startsWith(todayString)
    );

    if (existingDailyTasks.length > 0 && autoAssignConfig.skipExisting) {
      const confirmAssign = confirm(
        `Daily tasks for today already exist (${existingDailyTasks.length} tasks). Do you want to assign additional tasks to unassigned users?`
      );
      if (!confirmAssign) return;
    }

    // Create tasks for each user based on strategy
    let tasksCreated = 0;
    let tasksAssigned = 0;

    if (autoAssignConfig.assignToAllUsers) {
      availableUsers.forEach((user, userIndex) => {
        dailyTaskDefinitions.forEach((taskDef, taskIndex) => {
          let shouldAssignToUser = false;

          // Apply assignment strategy
          switch (autoAssignConfig.strategy) {
            case "distribute":
              // Distribute tasks evenly among users
              shouldAssignToUser = (userIndex + taskIndex) % availableUsers.length === userIndex;
              break;
            case "round-robin":
              // Assign tasks in rotation
              shouldAssignToUser = taskIndex % availableUsers.length === userIndex;
              break;
            case "load-balance":
              // Assign based on current workload
              const userCurrentTasks = existingDailyTasks.filter(task => task.assignedTo === user.id).length;
              const minTasks = Math.min(...availableUsers.map(u => 
                existingDailyTasks.filter(task => task.assignedTo === u.id).length
              ));
              shouldAssignToUser = userCurrentTasks <= minTasks;
              break;
          }
          
          if (shouldAssignToUser) {
            // Check if this specific task is already assigned to this user today
            const taskAlreadyExists = existingDailyTasks.some(task => 
              task.title === taskDef.title && 
              task.assignedTo === user.id
            );

            if (!taskAlreadyExists || !autoAssignConfig.skipExisting) {
              const dueDate = getDefaultDueDate("daily");
              
              createTask({
                title: taskDef.title,
                description: taskDef.description,
                category: "daily",
                estimatedTime: taskDef.estimatedTime,
                dueDate: dueDate.toISOString(),
                assignedTo: user.id,
              });
              
              tasksCreated++;
              tasksAssigned++;
            }
          }
        });
      });
    }

    // Also create unassigned tasks for any remaining task definitions
    if (autoAssignConfig.includeUnassigned) {
      dailyTaskDefinitions.forEach((taskDef) => {
        const taskAlreadyExists = existingDailyTasks.some(task => 
          task.title === taskDef.title
        );

        if (!taskAlreadyExists || !autoAssignConfig.skipExisting) {
          const dueDate = getDefaultDueDate("daily");
          
          createTask({
            title: taskDef.title,
            description: taskDef.description,
            category: "daily",
            estimatedTime: taskDef.estimatedTime,
            dueDate: dueDate.toISOString(),
            // Leave unassigned for manual assignment
          });
          
          tasksCreated++;
        }
      });
    }

    alert(`Successfully created ${tasksCreated} daily tasks and assigned ${tasksAssigned} to users.`);
  };

  const openAssignDialog = (taskId: string) => {
    setSelectedTaskForAssign(taskId);
    setIsAssignDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "in-progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case "pending":
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600 mt-1">
            Create, assign, and manage tasks across all categories
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setIsAutoAssignDialogOpen(true)}
            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
          >
            <Users className="mr-2 h-4 w-4" />
            Auto-Assign Daily Tasks
          </Button>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Custom Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Create a custom task with specific requirements and timeline.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Task Title</Label>
                    <Input
                      id="title"
                      value={newTask.title}
                      onChange={(e) =>
                        setNewTask((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Enter task title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newTask.category}
                      onValueChange={(value: TaskCategory) =>
                        setNewTask((prev) => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">
                          Daily (Due tomorrow)
                        </SelectItem>
                        <SelectItem value="weekly">
                          Weekly (Due within 7 days)
                        </SelectItem>
                        <SelectItem value="monthly">
                          Monthly (Due within 15 days)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-blue-600 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      {getDueDateRangeDescription(newTask.category)}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe the task requirements and steps"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estimatedTime">Est. Time (minutes)</Label>
                    <Input
                      id="estimatedTime"
                      type="number"
                      value={newTask.estimatedTime}
                      onChange={(e) =>
                        setNewTask((prev) => ({
                          ...prev,
                          estimatedTime: parseInt(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) =>
                        setNewTask((prev) => ({
                          ...prev,
                          dueDate: e.target.value,
                        }))
                      }
                    />
                    <div className="text-xs text-gray-500">
                      Auto-set based on category. You can adjust if needed.
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateTask}>Create Task</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Task Categories and Management */}
      <Tabs
        value={selectedCategory}
        onValueChange={(value) => setSelectedCategory(value as TaskCategory)}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily" className="flex items-center gap-2">
            Daily Tasks
            <Badge variant="secondary">
              {tasks.filter((t) => t.category === "daily").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-2">
            Weekly Tasks
            <Badge variant="secondary">
              {tasks.filter((t) => t.category === "weekly").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-2">
            Monthly Tasks
            <Badge variant="secondary">
              {tasks.filter((t) => t.category === "monthly").length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Search and Filter */}
        <div className="flex items-center gap-4 mt-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog
            open={isFilterDialogOpen}
            onOpenChange={setIsFilterDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
                {(filters.status !== "all" ||
                  filters.assignedTo !== "all" ||
                  filters.dueDate !== "all") && (
                  <Badge className="ml-2 h-4 w-4 p-0 bg-blue-600">
                    {
                      Object.values(filters).filter((value) => value !== "all")
                        .length
                    }
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Filter Tasks</DialogTitle>
                <DialogDescription>
                  Filter tasks by status, assignee, and due date.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  <Select
                    value={filters.assignedTo}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, assignedTo: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="">Unassigned</SelectItem>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Select
                    value={filters.dueDate}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, dueDate: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="today">Due Today</SelectItem>
                      <SelectItem value="week">Due This Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters({
                      status: "all",
                      assignedTo: "all",
                      dueDate: "all",
                    });
                  }}
                >
                  Reset
                </Button>
                <Button onClick={() => setIsFilterDialogOpen(false)}>
                  Apply Filters
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="daily" className="space-y-6">
          <TaskCategoryContent
            category="daily"
            predefinedTasks={predefinedTasks}
            existingTasks={filteredTasks}
            onCreateFromTemplate={handleCreateFromTemplate}
            onAssignTask={openAssignDialog}
            getUserInfo={getUserInfo}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="weekly" className="space-y-6">
          <TaskCategoryContent
            category="weekly"
            predefinedTasks={getTaskDefinitionsByCategory("weekly")}
            existingTasks={filteredTasks}
            onCreateFromTemplate={handleCreateFromTemplate}
            onAssignTask={openAssignDialog}
            getUserInfo={getUserInfo}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6">
          <TaskCategoryContent
            category="monthly"
            predefinedTasks={getTaskDefinitionsByCategory("monthly")}
            existingTasks={filteredTasks}
            onCreateFromTemplate={handleCreateFromTemplate}
            onAssignTask={openAssignDialog}
            getUserInfo={getUserInfo}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
      </Tabs>

      {/* Assign Task Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Task</DialogTitle>
            <DialogDescription>
              Select a user to assign this task to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {availableUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No users available for task assignment.</p>
                <p className="text-sm mt-1">
                  Users who sign up will appear here automatically.
                </p>
              </div>
            ) : (
              availableUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleAssignTask(user.id)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-sm">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.post}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <Button size="sm">Assign</Button>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto-Assignment Configuration Dialog */}
      <Dialog open={isAutoAssignDialogOpen} onOpenChange={setIsAutoAssignDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Auto-Assign Daily Tasks</DialogTitle>
            <DialogDescription>
              Automatically assign daily tasks to all available users with intelligent distribution
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Assignment Strategy */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Assignment Strategy</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="distribute"
                    name="strategy"
                    value="distribute"
                    checked={autoAssignConfig.strategy === "distribute"}
                    onChange={(e) => setAutoAssignConfig(prev => ({ ...prev, strategy: e.target.value as any }))}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="distribute" className="text-sm font-normal">
                    <span className="font-medium">Distribute Evenly</span>
                    <p className="text-gray-600">Spread tasks evenly across all users</p>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="round-robin"
                    name="strategy"
                    value="round-robin"
                    checked={autoAssignConfig.strategy === "round-robin"}
                    onChange={(e) => setAutoAssignConfig(prev => ({ ...prev, strategy: e.target.value as any }))}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="round-robin" className="text-sm font-normal">
                    <span className="font-medium">Round Robin</span>
                    <p className="text-gray-600">Assign tasks in rotation to each user</p>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="load-balance"
                    name="strategy"
                    value="load-balance"
                    checked={autoAssignConfig.strategy === "load-balance"}
                    onChange={(e) => setAutoAssignConfig(prev => ({ ...prev, strategy: e.target.value as any }))}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="load-balance" className="text-sm font-normal">
                    <span className="font-medium">Load Balance</span>
                    <p className="text-gray-600">Assign based on current user workload</p>
                  </Label>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Options</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="assignToAllUsers"
                    checked={autoAssignConfig.assignToAllUsers}
                    onChange={(e) => setAutoAssignConfig(prev => ({ ...prev, assignToAllUsers: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="assignToAllUsers" className="text-sm font-normal">
                    Assign tasks to all available users
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeUnassigned"
                    checked={autoAssignConfig.includeUnassigned}
                    onChange={(e) => setAutoAssignConfig(prev => ({ ...prev, includeUnassigned: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="includeUnassigned" className="text-sm font-normal">
                    Create unassigned tasks for manual assignment
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="skipExisting"
                    checked={autoAssignConfig.skipExisting}
                    onChange={(e) => setAutoAssignConfig(prev => ({ ...prev, skipExisting: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="skipExisting" className="text-sm font-normal">
                    Skip tasks that already exist for today
                  </Label>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Assignment Summary</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• Available users: {availableUsers.length}</p>
                <p>• Daily task templates: {getTaskDefinitionsByCategory("daily").length}</p>
                <p>• Strategy: {autoAssignConfig.strategy.replace('-', ' ')}</p>
                <p>• Estimated tasks to create: {Math.ceil(getTaskDefinitionsByCategory("daily").length * (autoAssignConfig.assignToAllUsers ? 1 : 0.5))}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAutoAssignDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleAutoAssignDailyTasks();
                setIsAutoAssignDialogOpen(false);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Users className="mr-2 h-4 w-4" />
              Auto-Assign Tasks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface TaskCategoryContentProps {
  category: TaskCategory;
  predefinedTasks: any[];
  existingTasks: any[];
  onCreateFromTemplate: (template: any) => void;
  onAssignTask: (taskId: string) => void;
  getUserInfo: (userId: string) => { name: string; post: string };
  getStatusBadge: (status: string) => React.ReactNode;
}

const TaskCategoryContent: React.FC<TaskCategoryContentProps> = ({
  category,
  predefinedTasks,
  existingTasks,
  onCreateFromTemplate,
  onAssignTask,
  getUserInfo,
  getStatusBadge,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Predefined Task Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Available Templates</CardTitle>
          <CardDescription>
            Standard {category} tasks that can be created and assigned
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {predefinedTasks.map((template) => (
            <div
              key={template.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <h4 className="font-medium">{template.title}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {template.description}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>~{template.estimatedTime} min</span>
                  {template.frequency && <span>{template.frequency}</span>}
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => onCreateFromTemplate(template)}
                className="ml-4"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Existing Tasks with Assignment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Created Tasks ({existingTasks.length})
          </CardTitle>
          <CardDescription>
            Tasks with assignment details and current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {existingTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No {category} tasks created yet.</p>
              <p className="text-sm text-gray-500 mt-1">
                Use the templates above to create tasks.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {existingTasks.map((task) => {
                const assignedUser = getUserInfo(task.assignedTo || "");
                const isOverdue =
                  new Date(task.dueDate) < new Date() &&
                  task.status !== "completed";

                return (
                  <div
                    key={task.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-lg">{task.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {task.description}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(isOverdue ? "overdue" : task.status)}
                        <DeadlineAlert task={task} className="text-xs" />
                      </div>
                    </div>

                    {/* Assignment and Timeline Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="text-gray-600">Assigned to:</span>
                          <p className="font-medium">
                            {task.assignedTo ? assignedUser.name : "Unassigned"}
                          </p>
                          {task.assignedTo && (
                            <p className="text-xs text-gray-500">
                              {assignedUser.post}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="text-gray-600">Due date:</span>
                          <p className="font-medium">
                            {format(new Date(task.dueDate), "MMM dd, yyyy")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="text-gray-600">Estimated:</span>
                          <p className="font-medium">
                            {task.estimatedTime} min
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Assignment Action */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAssignTask(task.id)}
                        className="flex-1"
                      >
                        <Users className="h-4 w-4 mr-1" />
                        {task.assignedTo ? "Reassign" : "Assign Task"}
                      </Button>
                    </div>

                    {/* Completion Info */}
                    {task.status === "completed" && task.completedAt && (
                      <div className="bg-green-50 border-l-4 border-green-400 p-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-green-800">
                            Completed on{" "}
                            {format(
                              new Date(task.completedAt),
                              "MMM dd, yyyy h:mm a",
                            )}
                          </span>
                        </div>
                        {task.actualTime && (
                          <p className="text-green-700 mt-1">
                            Actual time: {task.actualTime} minutes
                          </p>
                        )}
                      </div>
                    )}

                    {/* Overdue Warning */}
                    {isOverdue && (
                      <div className="bg-red-50 border-l-4 border-red-400 p-3 text-sm">
                        <span className="font-medium text-red-800">
                          This task is overdue and requires immediate attention
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskManagement;
