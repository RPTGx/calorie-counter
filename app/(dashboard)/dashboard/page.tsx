'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format } from 'date-fns'

type MealEntry = {
  id: string
  created_at: string
  user_id: string
  meal_text: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

type UserProfile = {
  id: string
  target_calories: number
  name: string
}

export default function Dashboard() {
  const [mealText, setMealText] = useState('')
  const [todaysMeals, setTodaysMeals] = useState<MealEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchUserProfile()
    fetchTodaysMeals()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, target_calories, name')
        .eq('id', user.id)
        .single()

      if (profile) {
        setProfile(profile)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const fetchTodaysMeals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: meals } = await supabase
        .from('meal_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false })

      if (meals) {
        setTodaysMeals(meals)
      }
    } catch (error) {
      console.error('Error fetching meals:', error)
    }
  }

  const handleMealSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      // Call the AI analysis API
      const response = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mealText }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze meal')
      }

      const nutritionData = await response.json()

      const { error } = await supabase
        .from('meal_entries')
        .insert({
          user_id: user.id,
          meal_text: mealText,
          ...nutritionData,
        })

      if (error) throw error

      setMealText('')
      fetchTodaysMeals()
    } catch (error) {
      console.error('Error logging meal:', error)
      setError('Failed to log meal. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateTotalNutrients = () => {
    return todaysMeals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.calories,
        protein: acc.protein + meal.protein,
        carbs: acc.carbs + meal.carbs,
        fat: acc.fat + meal.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )
  }

  const totals = calculateTotalNutrients()
  const targetCalories = profile?.target_calories || 2000

  return (
    <div className="max-w-7xl mx-auto">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Welcome back, {profile?.name || 'User'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Daily Progress */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Daily Progress</h3>
          <div className="mt-4">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block text-indigo-600">
                    Calories
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block">
                    {totals.calories} / {targetCalories} kcal
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                <div
                  style={{ width: `${Math.min((totals.calories / targetCalories) * 100, 100)}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{totals.protein}g</div>
                <div className="text-xs text-gray-500">Protein</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{totals.carbs}g</div>
                <div className="text-xs text-gray-500">Carbs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{totals.fat}g</div>
                <div className="text-xs text-gray-500">Fat</div>
              </div>
            </div>
          </div>
        </div>

        {/* Log Meal */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Log a Meal</h3>
          <form onSubmit={handleMealSubmit} className="mt-4">
            <div>
              <label htmlFor="meal" className="sr-only">
                Meal description
              </label>
              <textarea
                id="meal"
                name="meal"
                rows={3}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Describe your meal... (e.g., '2 scrambled eggs with 2 slices of whole wheat toast and butter')"
                value={mealText}
                onChange={(e) => setMealText(e.target.value)}
              />
            </div>

            {error && (
              <div className="mt-2 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="mt-4">
              <button
                type="submit"
                disabled={isLoading || !mealText.trim()}
                className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Analyzing...' : 'Log Meal'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Today's Meals */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900">Today's Meals</h3>
        <div className="mt-4 bg-white shadow rounded-lg overflow-hidden">
          <ul role="list" className="divide-y divide-gray-200">
            {todaysMeals.map((meal) => (
              <li key={meal.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{meal.meal_text}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(meal.created_at), 'h:mm a')}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                      {meal.calories} kcal
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex space-x-4 text-xs text-gray-500">
                  <span>Protein: {meal.protein}g</span>
                  <span>Carbs: {meal.carbs}g</span>
                  <span>Fat: {meal.fat}g</span>
                </div>
              </li>
            ))}
            {todaysMeals.length === 0 && (
              <li className="px-6 py-4 text-center text-gray-500">
                No meals logged today
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
} 