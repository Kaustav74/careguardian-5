import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ClockIcon, UtensilsIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

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

export default function DailyRoutineCard() {
  const [, navigate] = useLocation();
  const currentDate = new Date().toISOString().split('T')[0];

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

  const formatTime = (time24: string) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getMealsByCategory = (category: "breakfast" | "lunch" | "dinner" | "snack") => {
    if (!dietDay) return [];
    return dietDay.meals.filter(meal => meal.type === category);
  };

  const getTotalCaloriesForMeals = (meals: Meal[]) => {
    return meals.reduce((total, meal) => {
      const mealCalories = meal.items.reduce((sum, item) => sum + item.calories, 0);
      return total + mealCalories;
    }, 0);
  };

  const breakfastMeals = getMealsByCategory("breakfast");
  const lunchMeals = getMealsByCategory("lunch");
  const dinnerMeals = getMealsByCategory("dinner");
  const snackMeals = getMealsByCategory("snack");

  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl font-bold">Daily Diet Routine</CardTitle>
          <CardDescription>Track your diet and nutrition</CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => navigate("/diet-routine")}
          data-testid="button-edit-diet"
        >
          <UtensilsIcon className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : !dietDay || dietDay.meals.length === 0 ? (
          <div className="text-center py-8" data-testid="empty-diet-routine">
            <i className="ri-restaurant-line text-4xl text-gray-400 mb-2"></i>
            <p className="text-gray-500 text-sm">No diet routine planned</p>
            <p className="text-gray-400 text-xs mt-1">Start planning your meals today</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => navigate("/diet-routine")}
              data-testid="button-start-diet"
            >
              <UtensilsIcon className="h-4 w-4 mr-2" />
              Plan Your Diet
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {breakfastMeals.length > 0 && (
              <div className="border rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-sm capitalize">Breakfast</h3>
                  <span className="text-xs text-muted-foreground">
                    {getTotalCaloriesForMeals(breakfastMeals)} cal
                  </span>
                </div>
                {breakfastMeals.map(meal => (
                  <div key={meal.id} className="space-y-1">
                    <div className="flex items-center text-muted-foreground">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      <span className="text-xs">{formatTime(meal.time)}</span>
                    </div>
                    {meal.items.length > 0 ? (
                      <div className="text-xs text-muted-foreground">
                        {meal.items.map(item => item.name).join(', ')}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground italic">No items added</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {lunchMeals.length > 0 && (
              <div className="border rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-sm capitalize">Lunch</h3>
                  <span className="text-xs text-muted-foreground">
                    {getTotalCaloriesForMeals(lunchMeals)} cal
                  </span>
                </div>
                {lunchMeals.map(meal => (
                  <div key={meal.id} className="space-y-1">
                    <div className="flex items-center text-muted-foreground">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      <span className="text-xs">{formatTime(meal.time)}</span>
                    </div>
                    {meal.items.length > 0 ? (
                      <div className="text-xs text-muted-foreground">
                        {meal.items.map(item => item.name).join(', ')}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground italic">No items added</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {dinnerMeals.length > 0 && (
              <div className="border rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-sm capitalize">Dinner</h3>
                  <span className="text-xs text-muted-foreground">
                    {getTotalCaloriesForMeals(dinnerMeals)} cal
                  </span>
                </div>
                {dinnerMeals.map(meal => (
                  <div key={meal.id} className="space-y-1">
                    <div className="flex items-center text-muted-foreground">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      <span className="text-xs">{formatTime(meal.time)}</span>
                    </div>
                    {meal.items.length > 0 ? (
                      <div className="text-xs text-muted-foreground">
                        {meal.items.map(item => item.name).join(', ')}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground italic">No items added</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {snackMeals.length > 0 && (
              <div className="border rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-sm capitalize">Snacks</h3>
                  <span className="text-xs text-muted-foreground">
                    {getTotalCaloriesForMeals(snackMeals)} cal
                  </span>
                </div>
                {snackMeals.map(meal => (
                  <div key={meal.id} className="space-y-1">
                    <div className="flex items-center text-muted-foreground">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      <span className="text-xs">{formatTime(meal.time)}</span>
                    </div>
                    {meal.items.length > 0 ? (
                      <div className="text-xs text-muted-foreground">
                        {meal.items.map(item => item.name).join(', ')}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground italic">No items added</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Total Calories</span>
                <span className="font-bold" data-testid="dashboard-total-calories">
                  {dietDay.totalCalories} kcal
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Water Intake</span>
                <span data-testid="dashboard-water-intake">{dietDay.waterIntake} ml</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
