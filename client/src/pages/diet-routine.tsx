import { useState } from "react";
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
import { AlertCircle, Check, Plus, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";

// Define types for diet and meal items
type MealItem = {
  id: string;
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type Meal = {
  id: string;
  type: "breakfast" | "lunch" | "dinner" | "snack";
  time: string;
  items: MealItem[];
  notes?: string;
};

type DailyDiet = {
  id: string;
  date: string;
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  waterIntake: number;
  notes?: string;
};

// Form schema for adding a meal item
const mealItemSchema = z.object({
  name: z.string().min(1, "Food item name is required"),
  quantity: z.string().min(1, "Quantity is required"),
  calories: z.number().min(0, "Calories must be a positive number"),
  protein: z.number().min(0, "Protein must be a positive number"),
  carbs: z.number().min(0, "Carbs must be a positive number"),
  fat: z.number().min(0, "Fat must be a positive number"),
});

// Form schema for adding a meal
const mealSchema = z.object({
  type: z.enum(["breakfast", "lunch", "dinner", "snack"], {
    required_error: "Please select a meal type",
  }),
  time: z.string().min(1, "Time is required"),
  notes: z.string().optional(),
});

type MealItemFormValues = z.infer<typeof mealItemSchema>;
type MealFormValues = z.infer<typeof mealSchema>;

// Sample data for demonstration
const sampleDailyDiet: DailyDiet = {
  id: "1",
  date: new Date().toISOString().split('T')[0],
  meals: [
    {
      id: "1",
      type: "breakfast",
      time: "08:00",
      items: [
        {
          id: "1",
          name: "Oatmeal with fruits",
          quantity: "1 bowl",
          calories: 250,
          protein: 8,
          carbs: 40,
          fat: 5,
        },
        {
          id: "2",
          name: "Apple",
          quantity: "1 medium",
          calories: 95,
          protein: 0.5,
          carbs: 25,
          fat: 0.3,
        }
      ],
      notes: "Added honey instead of sugar"
    },
    {
      id: "2",
      type: "lunch",
      time: "13:00",
      items: [
        {
          id: "3",
          name: "Brown Rice",
          quantity: "1 cup",
          calories: 216,
          protein: 5,
          carbs: 45,
          fat: 1.8,
        },
        {
          id: "4",
          name: "Paneer Curry",
          quantity: "1 serving",
          calories: 325,
          protein: 18,
          carbs: 12,
          fat: 24,
        },
        {
          id: "5",
          name: "Mixed Vegetables",
          quantity: "1 serving",
          calories: 85,
          protein: 3.5,
          carbs: 15,
          fat: 1.2,
        }
      ],
      notes: "Used less oil in curry"
    },
    {
      id: "3",
      type: "dinner",
      time: "19:30",
      items: [
        {
          id: "6",
          name: "Roti",
          quantity: "2 pieces",
          calories: 170,
          protein: 6,
          carbs: 30,
          fat: 3,
        },
        {
          id: "7",
          name: "Lentil Soup (Dal)",
          quantity: "1 bowl",
          calories: 150,
          protein: 12,
          carbs: 20,
          fat: 2.5,
        }
      ]
    }
  ],
  totalCalories: 1291,
  totalProtein: 53,
  totalCarbs: 187,
  totalFat: 37.8,
  waterIntake: 2000, // ml
  notes: "Felt energetic throughout the day. Need to increase protein intake."
};

export default function DietRoutine() {
  const { toast } = useToast();
  const [dailyDiet, setDailyDiet] = useState<DailyDiet>(sampleDailyDiet);
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activeMealId, setActiveMealId] = useState<string | null>(null);
  const [isAddingMeal, setIsAddingMeal] = useState(false);
  const [isAddingMealItem, setIsAddingMealItem] = useState(false);
  const [waterIntake, setWaterIntake] = useState(dailyDiet.waterIntake);

  // Form for adding a new meal
  const mealForm = useForm<MealFormValues>({
    resolver: zodResolver(mealSchema),
    defaultValues: {
      type: "breakfast",
      time: "",
      notes: "",
    },
  });

  // Form for adding a new meal item
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

  // Function to handle adding a new meal
  const handleAddMeal = (data: MealFormValues) => {
    const newMeal: Meal = {
      id: `meal-${Date.now()}`,
      type: data.type,
      time: data.time,
      items: [],
      notes: data.notes,
    };

    const updatedDiet = {
      ...dailyDiet,
      meals: [...dailyDiet.meals, newMeal],
    };

    setDailyDiet(updatedDiet);
    setIsAddingMeal(false);
    setActiveMealId(newMeal.id);
    mealForm.reset();

    toast({
      title: "Meal Added",
      description: `${data.type.charAt(0).toUpperCase() + data.type.slice(1)} added at ${data.time}`,
    });
  };

  // Function to handle adding a new meal item
  const handleAddMealItem = (data: MealItemFormValues) => {
    if (!activeMealId) return;

    const newMealItem: MealItem = {
      id: `item-${Date.now()}`,
      ...data,
    };

    const updatedMeals = dailyDiet.meals.map(meal => {
      if (meal.id === activeMealId) {
        return {
          ...meal,
          items: [...meal.items, newMealItem],
        };
      }
      return meal;
    });

    // Recalculate totals
    const updatedDiet = calculateDietTotals({
      ...dailyDiet,
      meals: updatedMeals,
    });

    setDailyDiet(updatedDiet);
    setIsAddingMealItem(false);
    mealItemForm.reset();

    toast({
      title: "Food Item Added",
      description: `${data.name} added to your meal`,
    });
  };

  // Function to calculate diet totals
  const calculateDietTotals = (diet: DailyDiet): DailyDiet => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    diet.meals.forEach(meal => {
      meal.items.forEach(item => {
        totalCalories += item.calories;
        totalProtein += item.protein;
        totalCarbs += item.carbs;
        totalFat += item.fat;
      });
    });

    return {
      ...diet,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
    };
  };

  // Function to handle water intake changes
  const handleWaterIntakeChange = (value: number[]) => {
    const intake = value[0];
    setWaterIntake(intake);
    setDailyDiet({
      ...dailyDiet,
      waterIntake: intake,
    });
  };

  // Function to remove a meal item
  const handleRemoveMealItem = (mealId: string, itemId: string) => {
    const updatedMeals = dailyDiet.meals.map(meal => {
      if (meal.id === mealId) {
        return {
          ...meal,
          items: meal.items.filter(item => item.id !== itemId),
        };
      }
      return meal;
    });

    // Recalculate totals
    const updatedDiet = calculateDietTotals({
      ...dailyDiet,
      meals: updatedMeals,
    });

    setDailyDiet(updatedDiet);

    toast({
      title: "Food Item Removed",
      description: "The food item has been removed from your meal",
    });
  };

  // Function to format the date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

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
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="meals" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="meals">Meals</TabsTrigger>
                  <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
                  <TabsTrigger value="water">Water Intake</TabsTrigger>
                </TabsList>

                <TabsContent value="meals" className="space-y-4">
                  {dailyDiet.meals.map((meal) => (
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
                                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center text-sm py-2 border-b last:border-0">
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
                                          onClick={() => handleRemoveMealItem(meal.id, item.id)}
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
                                                  <Input placeholder="E.g. Brown Rice" {...field} />
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
                                                  <Input placeholder="E.g. 1 cup" {...field} />
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
                                          >
                                            Cancel
                                          </Button>
                                          <Button type="submit">Add Food Item</Button>
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
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Meal
                    </Button>
                  ) : (
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
                                        <SelectTrigger>
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
                                      <Input type="time" {...field} />
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
                              >
                                Cancel
                              </Button>
                              <Button type="submit">Add Meal</Button>
                            </div>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="nutrition">
                  <div className="space-y-6">
                    <div className="grid grid-cols-4 gap-4">
                      <Card className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{dailyDiet.totalCalories}</div>
                          <div className="text-sm text-muted-foreground">Calories</div>
                        </div>
                      </Card>
                      <Card className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{dailyDiet.totalProtein}g</div>
                          <div className="text-sm text-muted-foreground">Protein</div>
                        </div>
                      </Card>
                      <Card className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{dailyDiet.totalCarbs}g</div>
                          <div className="text-sm text-muted-foreground">Carbs</div>
                        </div>
                      </Card>
                      <Card className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{dailyDiet.totalFat.toFixed(1)}g</div>
                          <div className="text-sm text-muted-foreground">Fat</div>
                        </div>
                      </Card>
                    </div>

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
                                {Math.round((dailyDiet.totalProtein * 4 / dailyDiet.totalCalories) * 100)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-blue-500 h-2.5 rounded-full"
                                style={{ width: `${(dailyDiet.totalProtein * 4 / dailyDiet.totalCalories) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Carbohydrates</span>
                              <span className="text-sm text-muted-foreground">
                                {Math.round((dailyDiet.totalCarbs * 4 / dailyDiet.totalCalories) * 100)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-green-500 h-2.5 rounded-full"
                                style={{ width: `${(dailyDiet.totalCarbs * 4 / dailyDiet.totalCalories) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Fat</span>
                              <span className="text-sm text-muted-foreground">
                                {Math.round((dailyDiet.totalFat * 9 / dailyDiet.totalCalories) * 100)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-yellow-500 h-2.5 rounded-full"
                                style={{ width: `${(dailyDiet.totalFat * 9 / dailyDiet.totalCalories) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
                          <div className="text-4xl font-bold text-blue-500">{waterIntake} ml</div>
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
                          max={3000}
                          step={100}
                          onValueChange={handleWaterIntakeChange}
                        />
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        {[250, 500, 750, 1000].map((amount) => (
                          <Button
                            key={amount}
                            variant="outline"
                            size="sm"
                            onClick={() => handleWaterIntakeChange([Math.min(waterIntake + amount, 3000)])}
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
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Diet Summary</CardTitle>
              <CardDescription>Your daily nutrition overview</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Daily Goals</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Calories</span>
                          <span className="text-sm text-muted-foreground">
                            {dailyDiet.totalCalories} / 2000 kcal
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-primary h-2.5 rounded-full"
                            style={{ width: `${Math.min((dailyDiet.totalCalories / 2000) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Protein</span>
                          <span className="text-sm text-muted-foreground">
                            {dailyDiet.totalProtein} / 70 g
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-500 h-2.5 rounded-full"
                            style={{ width: `${Math.min((dailyDiet.totalProtein / 70) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Water</span>
                          <span className="text-sm text-muted-foreground">
                            {waterIntake} / 2000 ml
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-400 h-2.5 rounded-full"
                            style={{ width: `${Math.min((waterIntake / 2000) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Meal Breakdown</h3>
                    <div className="space-y-3">
                      {dailyDiet.meals.map((meal) => {
                        // Calculate meal totals
                        const mealCalories = meal.items.reduce((sum, item) => sum + item.calories, 0);
                        const mealProtein = meal.items.reduce((sum, item) => sum + item.protein, 0);
                        const mealCarbs = meal.items.reduce((sum, item) => sum + item.carbs, 0);
                        const mealFat = meal.items.reduce((sum, item) => sum + item.fat, 0);

                        return (
                          <div key={meal.id} className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                            <div>
                              <p className="font-medium capitalize">{meal.type}</p>
                              <p className="text-xs text-muted-foreground">{meal.time}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{mealCalories} kcal</p>
                              <p className="text-xs text-muted-foreground">
                                P: {mealProtein}g | C: {mealCarbs}g | F: {mealFat}g
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Diet Notes</h3>
                    <Textarea
                      value={dailyDiet.notes || ''}
                      onChange={(e) => setDailyDiet({ ...dailyDiet, notes: e.target.value })}
                      placeholder="Add notes about your diet for the day..."
                      className="resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="bg-green-50 p-3 rounded-md border border-green-100">
                    <div className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-green-800">Today's Achievement</h4>
                        <p className="text-xs text-green-700 mt-1">
                          You're maintaining a balanced diet with a good protein intake. Keep up the good work!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => {
                toast({
                  title: "Diet Data Saved",
                  description: "Your diet information has been successfully saved.",
                });
              }}>
                Save Diet Information
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
}