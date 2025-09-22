import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ClockIcon, Edit2Icon, CheckCircleIcon, CircleIcon, UtensilsIcon, AppleIcon } from "lucide-react";

type RoutineItem = {
  id: number;
  time: string;
  activity: string;
  description?: string;
  completed: boolean;
  category: "morning" | "afternoon" | "evening";
};

export default function DailyRoutineCard() {
  // Sample data for daily diet routines
  const [routines, setRoutines] = useState<RoutineItem[]>([
    // Morning routines
    { id: 1, time: "06:30 AM", activity: "Morning Water", description: "1 glass of lukewarm water with lemon", completed: true, category: "morning" },
    { id: 2, time: "07:30 AM", activity: "Green Tea", description: "1 cup, no sugar", completed: true, category: "morning" },
    { id: 3, time: "08:30 AM", activity: "Breakfast", description: "Oatmeal with fruits or 2 egg whites", completed: false, category: "morning" },
    { id: 4, time: "10:30 AM", activity: "Mid-morning Snack", description: "Handful of mixed nuts", completed: false, category: "morning" },
    
    // Afternoon routines
    { id: 5, time: "12:30 PM", activity: "Lunch", description: "Rice, dal, vegetables and curd", completed: false, category: "afternoon" },
    { id: 6, time: "01:30 PM", activity: "Post-lunch Digestive", description: "Fennel seeds (saunf)", completed: false, category: "afternoon" },
    { id: 7, time: "04:00 PM", activity: "Evening Snack", description: "Fruit or sprouts", completed: false, category: "afternoon" },
    
    // Evening routines
    { id: 8, time: "06:00 PM", activity: "Herbal Tea", description: "Tulsi or ginger tea", completed: false, category: "evening" },
    { id: 9, time: "08:00 PM", activity: "Dinner", description: "Light, vegetable-based meal", completed: false, category: "evening" },
    { id: 10, time: "09:00 PM", activity: "Medication", description: "As prescribed by doctor", completed: false, category: "evening" },
    { id: 11, time: "10:00 PM", activity: "Warm Milk", description: "Optional, with turmeric", completed: false, category: "evening" },
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
          <CardTitle className="text-xl font-bold">Daily Diet Routine</CardTitle>
          <CardDescription>Track your diet and nutrition</CardDescription>
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
                        {routine.description && (
                          <span className="text-xs text-muted-foreground">
                            {routine.description}
                          </span>
                        )}
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
                        {routine.description && (
                          <span className="text-xs text-muted-foreground">
                            {routine.description}
                          </span>
                        )}
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
                        {routine.description && (
                          <span className="text-xs text-muted-foreground">
                            {routine.description}
                          </span>
                        )}
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