import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { mealText } = await request.json()

    if (!mealText) {
      return new NextResponse('Meal text is required', { status: 400 })
    }

    const prompt = `Analyze the following meal description and provide a JSON response with estimated calories and macronutrients. Be conservative in estimates.
    
Meal: "${mealText}"

Provide response in this exact JSON format:
{
  "calories": number,
  "protein": number (in grams),
  "carbs": number (in grams),
  "fat": number (in grams)
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a nutrition expert AI that analyzes meal descriptions and provides accurate calorie and macronutrient estimates. Always be conservative in estimates and provide realistic values.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const response = completion.choices[0].message.content
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    const nutritionData = JSON.parse(response)

    return NextResponse.json(nutritionData)
  } catch (error) {
    console.error('Error analyzing meal:', error)
    return new NextResponse('Error analyzing meal', { status: 500 })
  }
} 