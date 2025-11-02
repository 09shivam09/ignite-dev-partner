import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { SEOHead } from "@/components/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Calendar as CalendarIcon, DollarSign, CheckCircle2 } from "lucide-react";

interface BudgetItem {
  id: string;
  category: string;
  allocated: number;
  spent: number;
}

interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  dueDate?: string;
}

interface TimelineItem {
  id: string;
  milestone: string;
  date: string;
  completed: boolean;
}

const PlannerToolkit = () => {
  // Budget Planner State
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([
    { id: "1", category: "Venue", allocated: 50000, spent: 0 },
    { id: "2", category: "Catering", allocated: 30000, spent: 0 },
    { id: "3", category: "Photography", allocated: 20000, spent: 0 }
  ]);
  const [newCategory, setNewCategory] = useState("");
  const [newBudget, setNewBudget] = useState("");

  // Checklist State
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: "1", task: "Book venue", completed: false, dueDate: "2025-12-01" },
    { id: "2", task: "Send invitations", completed: false, dueDate: "2025-11-15" },
    { id: "3", task: "Finalize menu", completed: false, dueDate: "2025-11-20" }
  ]);
  const [newTask, setNewTask] = useState("");

  // Timeline State
  const [timeline, setTimeline] = useState<TimelineItem[]>([
    { id: "1", milestone: "Venue booked", date: "2025-12-01", completed: false },
    { id: "2", milestone: "Invitations sent", date: "2025-11-15", completed: false },
    { id: "3", milestone: "Final payment", date: "2025-11-25", completed: false }
  ]);

  // Budget Functions
  const totalBudget = budgetItems.reduce((sum, item) => sum + item.allocated, 0);
  const totalSpent = budgetItems.reduce((sum, item) => sum + item.spent, 0);
  const budgetProgress = (totalSpent / totalBudget) * 100;

  const addBudgetItem = () => {
    if (newCategory && newBudget) {
      setBudgetItems([
        ...budgetItems,
        { id: Date.now().toString(), category: newCategory, allocated: parseFloat(newBudget), spent: 0 }
      ]);
      setNewCategory("");
      setNewBudget("");
    }
  };

  const removeBudgetItem = (id: string) => {
    setBudgetItems(budgetItems.filter(item => item.id !== id));
  };

  // Checklist Functions
  const addChecklistItem = () => {
    if (newTask) {
      setChecklist([
        ...checklist,
        { id: Date.now().toString(), task: newTask, completed: false }
      ]);
      setNewTask("");
    }
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist(checklist.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const removeChecklistItem = (id: string) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };

  const completedTasks = checklist.filter(item => item.completed).length;
  const checklistProgress = (completedTasks / checklist.length) * 100;

  return (
    <AppLayout>
      <SEOHead
        title="Event Planner Toolkit - EVENT-CONNECT"
        description="Manage your event budget, checklist, and timeline all in one place"
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Event Planner Toolkit</h1>
          <p className="text-muted-foreground">
            Manage your budget, tasks, and timeline efficiently
          </p>
        </div>

        <Tabs defaultValue="budget" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="budget">
              <DollarSign className="h-4 w-4 mr-2" />
              Budget
            </TabsTrigger>
            <TabsTrigger value="checklist">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Checklist
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
          </TabsList>

          {/* Budget Planner Tab */}
          <TabsContent value="budget" className="space-y-4 mt-6">
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">Budget Overview</h3>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Total Budget</span>
                  <span className="font-bold">₹{totalBudget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Spent</span>
                  <span className={totalSpent > totalBudget ? "text-destructive font-bold" : "font-bold"}>
                    ₹{totalSpent.toLocaleString()}
                  </span>
                </div>
                <Progress value={budgetProgress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{budgetProgress.toFixed(0)}% used</span>
                  <span>₹{(totalBudget - totalSpent).toLocaleString()} remaining</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-4">Add Budget Category</h3>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Category name"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Amount"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  className="w-32"
                />
                <Button onClick={addBudgetItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                {budgetItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.category}</div>
                      <div className="text-sm text-muted-foreground">
                        ₹{item.spent.toLocaleString()} / ₹{item.allocated.toLocaleString()}
                      </div>
                      <Progress 
                        value={(item.spent / item.allocated) * 100} 
                        className="h-1 mt-2"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeBudgetItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Checklist Tab */}
          <TabsContent value="checklist" className="space-y-4 mt-6">
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">Task Progress</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Completed Tasks</span>
                  <span className="font-bold">{completedTasks} / {checklist.length}</span>
                </div>
                <Progress value={checklistProgress} className="h-2" />
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-4">Add New Task</h3>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Task description"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addChecklistItem()}
                />
                <Button onClick={addChecklistItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => toggleChecklistItem(item.id)}
                    />
                    <div className="flex-1">
                      <span className={item.completed ? "line-through text-muted-foreground" : ""}>
                        {item.task}
                      </span>
                      {item.dueDate && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Due: {new Date(item.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeChecklistItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-4 mt-6">
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">Event Timeline</h3>
              <div className="space-y-4">
                {timeline.map((item, index) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        item.completed ? "bg-success" : "bg-muted"
                      }`}>
                        {item.completed && <CheckCircle2 className="h-5 w-5 text-white" />}
                        {!item.completed && <span className="text-sm">{index + 1}</span>}
                      </div>
                      {index < timeline.length - 1 && (
                        <div className="w-0.5 h-16 bg-border" />
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <div className="font-medium">{item.milestone}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(item.date).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </div>
                      <Badge variant={item.completed ? "default" : "secondary"} className="mt-2">
                        {item.completed ? "Completed" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default PlannerToolkit;
