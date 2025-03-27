import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ClockIcon, Edit2Icon, CheckCircleIcon, CircleIcon } from "lucide-react";

type RoutineItem = {
  id: number;
  time: string;
  activity: string;
  completed: boolean;
  category: "morning" | "afternoon" | "evening";
};

export default function DailyRoutineCard() {
  // Sample data for daily routines
  const [routines, setRoutines] = useState<RoutineItem[]>([
    // Morning routines
    { id: 1, time: "06:00 AM", activity: "Wake up & Meditation", completed: true, category: "morning" },
    { id: 2, time: "06:30 AM", activity: "Yoga/Exercise", completed: true, category: "morning" },
    { id: 3, time: "07:30 AM", activity: "Breakfast", completed: true, category: "morning" },
    { id: 4, time: "08:30 AM", activity: "Check emails & daily planning", completed: false, category: "morning" },
    
    // Afternoon routines
    { id: 5, time: "12:30 PM", activity: "Lunch", completed: false, category: "afternoon" },
    { id: 6, time: "01:30 PM", activity: "Short walk", completed: false, category: "afternoon" },
    { id: 7, time: "03:00 PM", activity: "Take medicine", completed: false, category: "afternoon" },
    
    // Evening routines
    { id: 8, time: "06:30 PM", activity: "Evening exercise", completed: false, category: "evening" },
    { id: 9, time: "08:00 PM", activity: "Dinner", completed: false, category: "evening" },
    { id: 10, time: "09:30 PM", activity: "Reading", completed: false, category: "evening" },
    { id: 11, time: "10:30 PM", activity: "Prepare for bed", completed: false, category: "evening" },
  ]);

  const toggleCompletion = (id: number) => {
    setRoutines(routines.map(routine => 
      routine.id === id ? { ...routine, completed: !routine.completed } : routine
    ));
  };

  const calculateProgress = (category: "morning" | "afternoon" | "evening") => {
    const categoryItems = routines.filter(r => r.category === category);
    const completedItems = categoryItems.filter(r => r.completed);
    return (completedItems.length / categoryItems.length) * 100;
  };

  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl font-bold">Daily Routine</CardTitle>
          <CardDescription>Track your daily activities</CardDescription>
        </div>
        <Button variant="outline" size="icon">
          <Edit2Icon className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="morning">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="morning">Morning</TabsTrigger>
            <TabsTrigger value="afternoon">Afternoon</TabsTrigger>
            <TabsTrigger value="evening">Evening</TabsTrigger>
          </TabsList>
          
          <div className="mt-2 mb-4">
            <div className="flex justify-between mb-1 text-sm">
              <span>Progress</span>
              <span>{Math.round(calculateProgress("morning"))}%</span>
            </div>
            <Progress value={calculateProgress("morning")} className="h-2" />
          </div>
          
          <TabsContent value="morning">
            <div className="space-y-4">
              {routines
                .filter(routine => routine.category === "morning")
                .map(routine => (
                  <div key={routine.id} className="flex items-center justify-between p-2 border rounded hover:bg-muted">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleCompletion(routine.id)}
                        className="text-primary hover:text-primary/80"
                      >
                        {routine.completed ? 
                          <CheckCircleIcon className="h-5 w-5 text-green-500" /> : 
                          <CircleIcon className="h-5 w-5" />
                        }
                      </button>
                      <div className="flex flex-col">
                        <span className={`font-medium ${routine.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {routine.activity}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      <span className="text-xs">{routine.time}</span>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>
          
          <TabsContent value="afternoon">
            <div className="space-y-4">
              {routines
                .filter(routine => routine.category === "afternoon")
                .map(routine => (
                  <div key={routine.id} className="flex items-center justify-between p-2 border rounded hover:bg-muted">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleCompletion(routine.id)}
                        className="text-primary hover:text-primary/80"
                      >
                        {routine.completed ? 
                          <CheckCircleIcon className="h-5 w-5 text-green-500" /> : 
                          <CircleIcon className="h-5 w-5" />
                        }
                      </button>
                      <div className="flex flex-col">
                        <span className={`font-medium ${routine.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {routine.activity}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      <span className="text-xs">{routine.time}</span>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>
          
          <TabsContent value="evening">
            <div className="space-y-4">
              {routines
                .filter(routine => routine.category === "evening")
                .map(routine => (
                  <div key={routine.id} className="flex items-center justify-between p-2 border rounded hover:bg-muted">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleCompletion(routine.id)}
                        className="text-primary hover:text-primary/80"
                      >
                        {routine.completed ? 
                          <CheckCircleIcon className="h-5 w-5 text-green-500" /> : 
                          <CircleIcon className="h-5 w-5" />
                        }
                      </button>
                      <div className="flex flex-col">
                        <span className={`font-medium ${routine.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {routine.activity}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      <span className="text-xs">{routine.time}</span>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}