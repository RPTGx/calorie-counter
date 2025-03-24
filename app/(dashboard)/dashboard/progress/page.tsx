'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js'
import { format, subDays } from 'date-fns'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

type WeightEntry = {
  id: string
  created_at: string
  user_id: string
  weight: number
}

type Achievement = {
  id: string
  title: string
  description: string
  icon: string
  unlocked_at: string
}

export default function Progress() {
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([])
  const [newWeight, setNewWeight] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchWeightEntries()
    fetchAchievements()
  }, [])

  const fetchWeightEntries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: entries } = await supabase
        .from('weight_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (entries) {
        setWeightEntries(entries)
      }
    } catch (error) {
      console.error('Error fetching weight entries:', error)
    }
  }

  const fetchAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: achievements } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false })

      if (achievements) {
        setAchievements(achievements)
      }
    } catch (error) {
      console.error('Error fetching achievements:', error)
    }
  }

  const handleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const weight = parseFloat(newWeight)
      if (isNaN(weight)) throw new Error('Invalid weight value')

      const { error } = await supabase
        .from('weight_entries')
        .insert({
          user_id: user.id,
          weight,
        })

      if (error) throw error

      setNewWeight('')
      fetchWeightEntries()
    } catch (error) {
      console.error('Error logging weight:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const chartData: ChartData<'line'> = {
    labels: weightEntries.map(entry => format(new Date(entry.created_at), 'MMM d')),
    datasets: [
      {
        label: 'Weight (kg)',
        data: weightEntries.map(entry => entry.weight),
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.5)',
        tension: 0.1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Weight Progress',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  }

  const calculateProgress = () => {
    if (weightEntries.length < 2) return null

    const firstWeight = weightEntries[0].weight
    const lastWeight = weightEntries[weightEntries.length - 1].weight
    const difference = lastWeight - firstWeight
    const percentageChange = ((difference / firstWeight) * 100).toFixed(1)

    return {
      difference: Math.abs(difference).toFixed(1),
      percentageChange,
      isGain: difference > 0,
    }
  }

  const progress = calculateProgress()

  return (
    <div className="max-w-7xl mx-auto">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Progress Tracking
          </h2>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Weight Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Log Weight */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Log Weight</h3>
          <form onSubmit={handleWeightSubmit} className="mt-4">
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                Weight (kg)
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  step="0.1"
                  id="weight"
                  name="weight"
                  required
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                type="submit"
                disabled={isLoading || !newWeight}
                className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Log Weight'}
              </button>
            </div>
          </form>

          {progress && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900">Overall Progress</h4>
              <p className={`mt-2 text-lg font-semibold ${progress.isGain ? 'text-red-600' : 'text-green-600'}`}>
                {progress.isGain ? '+' : '-'}{progress.difference} kg ({progress.percentageChange}%)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Achievements */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900">Achievements</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400"
            >
              <div className="flex-shrink-0">
                <span className="text-2xl">{achievement.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{achievement.title}</p>
                <p className="text-sm text-gray-500">{achievement.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Unlocked {format(new Date(achievement.unlocked_at), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          ))}
          {achievements.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-8">
              No achievements unlocked yet. Keep going!
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 