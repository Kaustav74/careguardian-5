import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

type MealItem = {
  id: number;
  dietMealId: number;
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type Meal = {
  id: number;
  dietDayId: number;
  type: string;
  time: string;
  notes?: string;
  items: MealItem[];
};

type DietDay = {
  id: number;
  userId: number;
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  waterIntake: number;
  notes?: string;
  meals: Meal[];
};

const mealItemSchema = z.object({
  name: z.string().min(1, "Food item name is required"),
  quantity: z.string().min(1, "Quantity is required"),
  calories: z.number().min(0, "Calories must be a positive number"),
  protein: z.number().min(0, "Protein must be a positive number"),
  carbs: z.number().min(0, "Carbs must be a positive number"),
  fat: z.number().min(0, "Fat must be a positive number"),
});

const mealSchema = z.object({
  type: z.enum(["breakfast", "lunch", "dinner", "snack"], {
    required_error: "Please select a meal type",
  }),
  time: z.string().min(1, "Time is required"),
  notes: z.string().optional(),
});

type MealItemFormValues = z.infer<typeof mealItemSchema>;
type MealFormValues = z.infer<typeof mealSchema>;

export default function DietRoutine() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activeMealId, setActiveMealId] = useState<number | null>(null);
  const [isAddingMeal, setIsAddingMeal] = useState(false);
  const [isAddingMealItem, setIsAddingMealItem] = useState(false);
  const [waterIntake, setWaterIntake] = useState(0);

  const { data: dietDay, isLoading } = useQuery<DietDay | null>({
    queryKey: ['/api/diet', currentDate],
    queryFn: async () => {
      const response = await fetch(`/api/diet/${currentDate}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        if (response.status === 404 || response.status === 401) return null;
        throw new Error('Failed to fetch diet');
      }
      return response.json();
    },
  });

  useEffect(() => {
    if (dietDay) {
      setWaterIntake(dietDay.waterIntake || 0);
    } else {
      setWaterIntake(0);
    }
  }, [dietDay]);

  const createDietDayMutation = useMutation({
    mutationFn: async (data: { date: string; waterIntake: number }) => {
      return apiRequest('POST', '/api/diet', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/diet', currentDate] });
    },
  });

  const updateDietDayMutation = useMutation({
    mutationFn: async (data: { id: number; waterIntake?: number; totalCalories?: number; totalProtein?: number; totalCarbs?: number; totalFat?: number }) => {
      const { id, ...updateData } = data;
      return apiRequest('PUT', `/api/diet/${id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/diet', currentDate] });
    },
  });

  const createMealMutation = useMutation({
    mutationFn: async (data: { dietDayId: number; type: string; time: string; notes?: string }) => {
      return apiRequest('POST', '/api/diet/meals', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/diet', currentDate] });
      toast({ title: "Meal added successfully" });
    },
  });

  const createMealItemMutation = useMutation({
    mutationFn: async (data: { dietMealId: number; name: string; quantity: string; calories: number; protein: number; carbs: number; fat: number }) => {
      return apiRequest('POST', '/api/diet/meals/items', data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/diet', currentDate] });
      
      if (dietDay) {
        const updatedDiet = await queryClient.fetchQuery({ 
          queryKey: ['/api/diet', currentDate],
          queryFn: async () => {
            const response = await fetch(`/api/diet/${currentDate}`, {
              credentials: 'include',
            });
            return response.json();
          },
        });
        
        if (updatedDiet) {
          await updateDietDayMutation.mutateAsync({
            id: dietDay.id,
            totalCalories: updatedDiet.totalCalories,
            totalProtein: updatedDiet.totalProtein,
            totalCarbs: updatedDiet.totalCarbs,
            totalFat: updatedDiet.totalFat,
          });
        }
      }
      
      toast({ title: "Food item added successfully" });
    },
  });

  const deleteMealItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      return apiRequest('DELETE', `/api/diet/meals/items/${itemId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/diet', currentDate] });
      
      if (dietDay) {
        const updatedDiet = await queryClient.fetchQuery({ 
          queryKey: ['/api/diet', currentDate],
          queryFn: async () => {
            const response = await fetch(`/api/diet/${currentDate}`, {
              credentials: 'include',
            });
            return response.json();
          },
        });
        
        if (updatedDiet) {
          await updateDietDayMutation.mutateAsync({
            id: dietDay.id,
            totalCalories: updatedDiet.totalCalories,
            totalProtein: updatedDiet.totalProtein,
            totalCarbs: updatedDiet.totalCarbs,
            totalFat: updatedDiet.totalFat,
          });
        }
      }
      
      toast({ title: "Food item removed successfully" });
    },
  });

  const mealForm = useForm<MealFormValues>({
    resolver: zodResolver(mealSchema),
    defaultValues: {
      type: "breakfast",
      time: "",
      notes: "",
    },
  });

  const mealItemForm = useForm<MealItemFormValues>({
    resolver: zodResolver(mealItemSchema),
    defaultValues: {
      name: "",
      quantity: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    },
  });

  const ensureDietDay = async () => {
    if (!dietDay) {
      await createDietDayMutation.mutateAsync({
        date: currentDate,
        waterIntake: 0,
      });
      const newDietDay = await queryClient.fetchQuery({ 
        queryKey: ['/api/diet', currentDate],
        queryFn: async () => {
          const response = await fetch(`/api/diet/${currentDate}`, {
            credentials: 'include',
          });
          return response.json();
        },
      });
      return newDietDay;
    }
    return dietDay;
  };

  const handleAddMeal = async (data: MealFormValues) => {
    const day = await ensureDietDay();
    if (!day) return;
    
    await createMealMutation.mutateAsync({
      dietDayId: day.id,
      type: data.type,
      time: data.time,
      notes: data.notes,
    });
    
    setIsAddingMeal(false);
    mealForm.reset();
  };

  const handleAddMealItem = async (data: MealItemFormValues) => {
    if (!activeMealId) return;
    
    await createMealItemMutation.mutateAsync({
      dietMealId: activeMealId,
      ...data,
    });
    
    setIsAddingMealItem(false);
    mealItemForm.reset();
  };

  const handleWaterIntakeChange = async (value: number[]) => {
    const intake = value[0];
    setWaterIntake(intake);
    
    const day = await ensureDietDay();
    if (day) {
      await updateDietDayMutation.mutateAsync({
        id: day.id,
        waterIntake: intake,
      });
    }
  };

  const handleRemoveMealItem = async (itemId: number) => {
    await deleteMealItemMutation.mutateAsync(itemId);
  };

  const calculateTotals = (meals: Meal[]) => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    meals.forEach(meal => {
      meal.items.forEach(item => {
        totalCalories += item.calories;
        totalProtein += item.protein;
        totalCarbs += item.carbs;
        totalFat += item.fat;
      });
    });

    return { totalCalories, totalProtein, totalCarbs, totalFat };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const totals = dietDay ? calculateTotals(dietDay.meals) : { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 };

  // Reusable Add Meal Card (keeps design identical)
  const AddMealCard = (
    <Card>
      <CardHeader>
        <CardTitle>Add New Meal</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...mealForm}>
          <form onSubmit={mealForm.handleSubmit(handleAddMeal)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={mealForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meal Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-meal-type">
                          <SelectValue placeholder="Select meal type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="breakfast">Breakfast</SelectItem>
                        <SelectItem value="lunch">Lunch</SelectItem>
                        <SelectItem value="dinner">Dinner</SelectItem>
                        <SelectItem value="snack">Snack</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={mealForm.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} data-testid="input-meal-time" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={mealForm.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any notes about this meal?"
                      className="resize-none"
                      {...field}
                      data-testid="input-meal-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddingMeal(false)}
                data-testid="button-cancel-meal"
              >
                Cancel
              </Button>
              <Button type="submit" data-testid="button-submit-meal">Add Meal</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );

  return (
    <Layout title="Daily Diet Routine">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Daily Diet Routine</h1>
        <p className="text-muted-foreground">Track your meals and nutrition intake</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{formatDate(currentDate)}</CardTitle>
                  <CardDescription>Track your daily meals and nutrition</CardDescription>
                </div>
                <div>
                  <Input
                    type="date"
                    value={currentDate}
                    onChange={(e) => setCurrentDate(e.target.value)}
                    className="max-w-[200px]"
                    data-testid="input-date"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : (!dietDay || dietDay.meals.length === 0) ? (
                // If there's no diet day or no meals:
                <>
                  {!isAddingMeal ? (
                    <div className="text-center py-12" data-testid="empty-diet">
                      <i className="ri-restaurant-line text-5xl text-gray-400 mb-3"></i>
                      <p className="text-gray-500 text-lg mb-1">No diet booked</p>
                      <p className="text-gray-400 text-sm mb-4">Start tracking your meals by adding your first meal</p>
                      <Button onClick={() => setIsAddingMeal(true)} data-testid="button-add-first-meal">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Meal
                      </Button>
                    </div>
                  ) : (
                    // show Add Meal card even if dietDay is null
                    AddMealCard
                  )}
                </>
              ) : (
                <Tabs defaultValue="meals" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="meals">Meals</TabsTrigger>
                    <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
                    <TabsTrigger value="water">Water Intake</TabsTrigger>
                  </TabsList>

                  <TabsContent value="meals" className="space-y-4">
                    {dietDay.meals.map((meal) => (
                      <Card key={meal.id} className={`border ${activeMealId === meal.id ? 'border-primary' : ''}`}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <CardTitle className="text-lg capitalize">{meal.type}</CardTitle>
                              <CardDescription>Time: {meal.time}</CardDescription>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setActiveMealId(activeMealId === meal.id ? null : meal.id);
                                setIsAddingMealItem(false);
                              }}
                              data-testid={`button-expand-meal-${meal.id}`}
                            >
                              {activeMealId === meal.id ? 'Close' : 'Expand'}
                            </Button>
                          </div>
                        </CardHeader>
                        {activeMealId === meal.id && (
                          <>
                            <CardContent className="pb-2">
                              <div className="space-y-2">
                                {meal.items.length > 0 ? (
                                  <>
                                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground pb-1">
                                      <div className="col-span-4">Food Item</div>
                                      <div className="col-span-2">Quantity</div>
                                      <div className="col-span-1">Cal</div>
                                      <div className="col-span-1">Pro</div>
                                      <div className="col-span-1">Carb</div>
                                      <div className="col-span-1">Fat</div>
                                      <div className="col-span-2"></div>
                                    </div>
                                    {meal.items.map((item) => (
                                      <div key={item.id} className="grid grid-cols-12 gap-2 items-center text-sm py-2 border-b last:border-0" data-testid={`meal-item-${item.id}`}>
                                        <div className="col-span-4 font-medium">{item.name}</div>
                                        <div className="col-span-2 text-muted-foreground">{item.quantity}</div>
                                        <div className="col-span-1">{item.calories}</div>
                                        <div className="col-span-1">{item.protein}g</div>
                                        <div className="col-span-1">{item.carbs}g</div>
                                        <div className="col-span-1">{item.fat}g</div>
                                        <div className="col-span-2 text-right">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveMealItem(item.id)}
                                            data-testid={`button-remove-item-${item.id}`}
                                          >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </>
                                ) : (
                                  <div className="text-center py-6 text-muted-foreground">
                                    No food items added to this meal yet.
                                  </div>
                                )}

                                {!isAddingMealItem ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2"
                                    onClick={() => setIsAddingMealItem(true)}
                                    data-testid="button-add-food-item"
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Food Item
                                  </Button>
                                ) : (
                                  <Card className="mt-4">
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-md">Add Food Item</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <Form {...mealItemForm}>
                                        <form onSubmit={mealItemForm.handleSubmit(handleAddMealItem)} className="space-y-4">
                                          <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                              control={mealItemForm.control}
                                              name="name"
                                              render={({ field }) => (
                                                <FormItem>
                                                  <FormLabel>Food Item</FormLabel>
                                                  <FormControl>
                                                    <Input placeholder="E.g. Brown Rice" {...field} data-testid="input-food-name" />
                                                  </FormControl>
                                                  <FormMessage />
                                                </FormItem>
                                              )}
                                            />

                                            <FormField
                                              control={mealItemForm.control}
                                              name="quantity"
                                              render={({ field }) => (
                                                <FormItem>
                                                  <FormLabel>Quantity</FormLabel>
                                                  <FormControl>
                                                    <Input placeholder="E.g. 1 cup" {...field} data-testid="input-quantity" />
                                                  </FormControl>
                                                  <FormMessage />
                                                </FormItem>
                                              )}
                                            />
                                          </div>

                                          <div className="grid grid-cols-4 gap-4">
                                            <FormField
                                              control={mealItemForm.control}
                                              name="calories"
                                              render={({ field }) => (
                                                <FormItem>
                                                  <FormLabel>Calories</FormLabel>
                                                  <FormControl>
                                                    <Input 
                                                      type="number" 
                                                      placeholder="0" 
                                                      {...field}
                                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                                      data-testid="input-calories"
                                                    />
                                                  </FormControl>
                                                  <FormMessage />
                                                </FormItem>
                                              )}
                                            />

                                            <FormField
                                              control={mealItemForm.control}
                                              name="protein"
                                              render={({ field }) => (
                                                <FormItem>
                                                  <FormLabel>Protein (g)</FormLabel>
                                                  <FormControl>
                                                    <Input 
                                                      type="number" 
                                                      placeholder="0" 
                                                      {...field}
                                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                                      data-testid="input-protein"
                                                    />
                                                  </FormControl>
                                                  <FormMessage />
                                                </FormItem>
                                              )}
                                            />

                                            <FormField
                                              control={mealItemForm.control}
                                              name="carbs"
                                              render={({ field }) => (
                                                <FormItem>
                                                  <FormLabel>Carbs (g)</FormLabel>
                                                  <FormControl>
                                                    <Input 
                                                      type="number" 
                                                      placeholder="0" 
                                                      {...field}
                                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                                      data-testid="input-carbs"
                                                    />
                                                  </FormControl>
                                                  <FormMessage />
                                                </FormItem>
                                              )}
                                            />

                                            <FormField
                                              control={mealItemForm.control}
                                              name="fat"
                                              render={({ field }) => (
                                                <FormItem>
                                                  <FormLabel>Fat (g)</FormLabel>
                                                  <FormControl>
                                                    <Input 
                                                      type="number" 
                                                      placeholder="0" 
                                                      {...field}
                                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                                      data-testid="input-fat"
                                                    />
                                                  </FormControl>
                                                  <FormMessage />
                                                </FormItem>
                                              )}
                                            />
                                          </div>

                                          <div className="flex justify-end space-x-2">
                                            <Button
                                              type="button"
                                              variant="outline"
                                              onClick={() => setIsAddingMealItem(false)}
                                              data-testid="button-cancel-food-item"
                                            >
                                              Cancel
                                            </Button>
                                            <Button type="submit" data-testid="button-submit-food-item">Add Food Item</Button>
                                          </div>
                                        </form>
                                      </Form>
                                    </CardContent>
                                  </Card>
                                )}
                              </div>
                            </CardContent>
                            {meal.notes && (
                              <CardFooter>
                                <p className="text-sm text-muted-foreground">
                                  <span className="font-medium">Notes:</span> {meal.notes}
                                </p>
                              </CardFooter>
                            )}
                          </>
                        )}
                      </Card>
                    ))}

                    {!isAddingMeal ? (
                      <Button
                        variant="outline"
                        onClick={() => setIsAddingMeal(true)}
                        data-testid="button-add-new-meal"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Meal
                      </Button>
                    ) : (
                      // Reuse the same AddMealCard inside Tabs
                      AddMealCard
                    )}
                  </TabsContent>

                  <TabsContent value="nutrition">
                    <div className="space-y-6">
                      <div className="grid grid-cols-4 gap-4">
                        <Card className="p-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold" data-testid="total-calories">{totals.totalCalories}</div>
                            <div className="text-sm text-muted-foreground">Calories</div>
                          </div>
                        </Card>
                        <Card className="p-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold" data-testid="total-protein">{totals.totalProtein}g</div>
                            <div className="text-sm text-muted-foreground">Protein</div>
                          </div>
                        </Card>
                        <Card className="p-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold" data-testid="total-carbs">{totals.totalCarbs}g</div>
                            <div className="text-sm text-muted-foreground">Carbs</div>
                          </div>
                        </Card>
                        <Card className="p-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold" data-testid="total-fat">{totals.totalFat.toFixed(1)}g</div>
                            <div className="text-sm text-muted-foreground">Fat</div>
                          </div>
                        </Card>
                      </div>

                      {totals.totalCalories > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Macro Distribution</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-medium">Protein</span>
                                  <span className="text-sm text-muted-foreground">
                                    {Math.round((totals.totalProtein * 4 / totals.totalCalories) * 100)}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div
                                    className="bg-blue-500 h-2.5 rounded-full"
                                    style={{ width: `${(totals.totalProtein * 4 / totals.totalCalories) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-medium">Carbohydrates</span>
                                  <span className="text-sm text-muted-foreground">
                                    {Math.round((totals.totalCarbs * 4 / totals.totalCalories) * 100)}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div
                                    className="bg-green-500 h-2.5 rounded-full"
                                    style={{ width: `${(totals.totalCarbs * 4 / totals.totalCalories) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-medium">Fat</span>
                                  <span className="text-sm text-muted-foreground">
                                    {Math.round((totals.totalFat * 9 / totals.totalCalories) * 100)}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div
                                    className="bg-yellow-500 h-2.5 rounded-full"
                                    style={{ width: `${(totals.totalFat * 9 / totals.totalCalories) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="water">
                    <Card>
                      <CardHeader>
                        <CardTitle>Water Intake</CardTitle>
                        <CardDescription>Track your daily water consumption</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-4xl font-bold text-blue-500" data-testid="water-intake">{waterIntake} ml</div>
                            <div className="text-sm text-muted-foreground mt-2">Today's water intake</div>
                          </div>
                        </div>

                        <div className="px-4">
                          <div className="flex justify-between mb-2">
                            <span>0 ml</span>
                            <span>3000 ml</span>
                          </div>
                          <Slider
                            defaultValue={[waterIntake]}
                            value={[waterIntake]}
                            max={3000}
                            step={100}
                            onValueChange={handleWaterIntakeChange}
                            data-testid="slider-water-intake"
                          />
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                          {[250, 500, 750, 1000].map((amount) => (
                            <Button
                              key={amount}
                              variant="outline"
                              size="sm"
                              onClick={() => handleWaterIntakeChange([Math.min(waterIntake + amount, 3000)])}
                              data-testid={`button-add-water-${amount}`}
                            >
                              +{amount} ml
                            </Button>
                          ))}
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex space-x-3">
                            <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-blue-800">Hydration Tip</h4>
                              <p className="text-sm text-blue-700 mt-1">
                                It's recommended to drink at least 2000ml of water daily for optimal health. Staying hydrated helps maintain energy levels, supports digestion, and improves skin health.
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Daily Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Calories</span>
                  <span className="text-sm font-medium" data-testid="summary-calories">{totals.totalCalories} kcal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Protein</span>
                  <span className="text-sm font-medium" data-testid="summary-protein">{totals.totalProtein}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Carbs</span>
                  <span className="text-sm font-medium" data-testid="summary-carbs">{totals.totalCarbs}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Fat</span>
                  <span className="text-sm font-medium" data-testid="summary-fat">{totals.totalFat.toFixed(1)}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Water Intake</span>
                  <span className="text-sm font-medium" data-testid="summary-water">{waterIntake} ml</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
