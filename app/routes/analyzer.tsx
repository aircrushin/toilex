import { useState, type JSXElementConstructor, type Key, type ReactElement, type ReactNode, type ReactPortal } from "react";
import { Form, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/analyzer";
import OpenAI from "openai";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "💩 Turd Analyzer 3000 - Rate Your Masterpiece" },
    { name: "description", content: "AI-powered crap classification using the Bristol Stool Chart. Upload and rate your finest work!" },
  ];
}

interface AnalysisResult {
  bristolType: number;
  color: string;
  consistency: string;
  healthScore: number;
  recommendations: string[];
  funnyComment: string;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const imageData = formData.get("image") as string;

  if (!imageData) {
    return { error: "No image provided" };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL;
  
  if (!apiKey) {
    // Return mock data if no API key is set
    return {
      result: {
        bristolType: Math.floor(Math.random() * 7) + 1,
        color: ["Brown", "Dark Brown", "Light Brown", "Yellowish"][Math.floor(Math.random() * 4)],
        consistency: ["Firm", "Soft", "Loose", "Hard"][Math.floor(Math.random() * 4)],
        healthScore: Math.floor(Math.random() * 40) + 60,
        recommendations: [
          "Increase fiber intake",
          "Stay hydrated - drink more water",
          "Consider adding probiotics to your diet",
          "Regular exercise helps digestion"
        ].slice(0, Math.floor(Math.random() * 2) + 2),
        funnyComment: "This specimen would make Goldilocks proud - not too hard, not too soft!"
      }
    };
  }

  try {
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL || undefined,
    });

    // Extract base64 data
    const base64Data = imageData.split(",")[1];
    const mediaType = imageData.split(";")[0].split(":")[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

    const response = await openai.chat.completions.create({
      model: "x-ai/grok-4-fast",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mediaType};base64,${base64Data}`,
              },
            },
            {
              type: "text",
              text: `You are a humorous stool analyst. Analyze this image and provide:
1. Bristol Stool Chart type (1-7)
2. Color description
3. Consistency description
4. A health score (0-100)
5. 2-3 health recommendations
6. A funny but tasteful comment

Respond in JSON format:
{
  "bristolType": number,
  "color": "description",
  "consistency": "description",
  "healthScore": number,
  "recommendations": ["rec1", "rec2"],
  "funnyComment": "your funny comment"
}

Be helpful but keep it light and humorous!`
            }
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      const result = JSON.parse(content);
      return { result };
    }

    return { error: "Failed to analyze image" };
  } catch (error) {
    console.error("Analysis error:", error);
    return { error: "Failed to analyze image. Please try again." };
  }
}

export default function Analyzer() {
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageData, setImageData] = useState<string>("");
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isAnalyzing = navigation.state === "submitting";

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setImageData(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getBristolDescription = (type: number) => {
    const descriptions: Record<number, string> = {
      1: "Separate hard lumps (severe constipation)",
      2: "Lumpy and sausage-like (mild constipation)",
      3: "Sausage with cracks (normal)",
      4: "Smooth, soft sausage (ideal!)",
      5: "Soft blobs with clear edges (lacking fiber)",
      6: "Mushy consistency (mild diarrhea)",
      7: "Liquid consistency (severe diarrhea)"
    };
    return descriptions[type] || "Unknown";
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-yellow-300";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-amber-800 to-yellow-700 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 pt-8">
          <div className="text-7xl mb-4">💩📊🔬</div>
          <h1 className="text-6xl font-black text-yellow-200 mb-2" style={{textShadow: '3px 3px 0 #78350f'}}>
            Turd Analyzer 3000
          </h1>
          <p className="text-yellow-100 text-xl font-bold">
            💩 Upload Your Masterpiece for Scientific Analysis 💩
          </p>
          <p className="text-lg text-yellow-200 mt-2 font-semibold">
            (Powered by the Bristol Stool Chart - The Gold Standard in Crap Classification)
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-900 to-yellow-800 rounded-lg shadow-2xl p-8 border-4 border-yellow-600">
          <Form method="post" className="space-y-6">
            <input type="hidden" name="image" value={imageData} />

            <div className="border-4 border-dashed border-yellow-500 rounded-lg p-8 text-center bg-yellow-700/20">
              {imagePreview ? (
                <div className="space-y-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-md max-h-64 mx-auto rounded-lg border-4 border-yellow-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview("");
                      setImageData("");
                    }}
                    className="text-sm text-yellow-200 hover:text-yellow-100 underline font-semibold"
                  >
                    🗑️ Remove this turd
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-8xl mb-4">📸💩</div>
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer inline-block bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 text-white font-black py-4 px-8 rounded-lg transition-all border-4 border-yellow-500 transform hover:scale-105 shadow-xl"
                  >
                    💩 UPLOAD YOUR CREATION 💩
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <p className="text-lg text-yellow-200 mt-4 font-semibold">
                    Drop your finest work here for analysis!
                  </p>
                </div>
              )}
            </div>

            {imagePreview && (
              <button
                type="submit"
                disabled={isAnalyzing}
                className="w-full bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 disabled:bg-gray-600 text-white font-black py-5 px-8 rounded-lg text-2xl transition-all border-4 border-yellow-500 transform hover:scale-105 shadow-xl"
              >
                {isAnalyzing ? "🔬 ANALYZING YOUR DUMP..." : "🔬 ANALYZE THIS TURD 🔬"}
              </button>
            )}
          </Form>

          {actionData?.error && (
            <div className="mt-6 p-4 bg-red-800 border-4 border-red-600 text-red-100 rounded-lg font-bold text-center">
              💀 {actionData.error} 💀
            </div>
          )}

          {actionData?.result && (
            <div className="mt-8 space-y-6">
              <div className="border-t-4 border-yellow-600 pt-6">
                <h2 className="text-3xl font-black text-yellow-100 mb-4 text-center">
                  🔬 ANALYSIS COMPLETE 🔬
                </h2>
              </div>

              <div className="bg-gradient-to-r from-yellow-700 to-amber-700 rounded-lg p-6 border-4 border-yellow-500">
                <div className="text-center">
                  <div className="text-5xl mb-3">💩</div>
                  <p className="text-xl font-black text-yellow-100 mb-2">
                    {actionData.result.funnyComment}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-amber-800 to-yellow-900 rounded-lg p-6 border-4 border-yellow-600">
                  <h3 className="font-black text-yellow-100 mb-2 text-lg">💩 Bristol Chart Type</h3>
                  <p className="text-4xl font-black text-yellow-300 mb-2">
                    Type {actionData.result.bristolType}
                  </p>
                  <p className="text-sm text-yellow-200 font-semibold">
                    {getBristolDescription(actionData.result.bristolType)}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-amber-800 to-yellow-900 rounded-lg p-6 border-4 border-yellow-600">
                  <h3 className="font-black text-yellow-100 mb-2 text-lg">⭐ Turd Rating</h3>
                  <p className={`text-4xl font-black mb-2 ${getHealthScoreColor(actionData.result.healthScore)}`}>
                    {actionData.result.healthScore}/100
                  </p>
                  <p className="text-sm text-yellow-200 font-semibold">
                    {actionData.result.healthScore >= 80 ? "💯 LEGENDARY DUMP!" :
                     actionData.result.healthScore >= 60 ? "👍 Solid Performance" : "⚠️ Needs Work"}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-amber-800 to-yellow-900 rounded-lg p-6 border-4 border-yellow-600">
                  <h3 className="font-black text-yellow-100 mb-2 text-lg">🎨 Color Analysis</h3>
                  <p className="text-2xl text-yellow-200 font-bold">{actionData.result.color}</p>
                </div>

                <div className="bg-gradient-to-br from-amber-800 to-yellow-900 rounded-lg p-6 border-4 border-yellow-600">
                  <h3 className="font-black text-yellow-100 mb-2 text-lg">🧪 Consistency</h3>
                  <p className="text-2xl text-yellow-200 font-bold">{actionData.result.consistency}</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-700 to-amber-800 rounded-lg p-6 border-4 border-yellow-500">
                <h3 className="font-black text-yellow-100 mb-3 text-xl">💊 Expert Recommendations</h3>
                <ul className="space-y-2">
                  {actionData.result.recommendations.map((rec: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined, idx: Key | null | undefined) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-yellow-300 mr-2 text-xl">💩</span>
                      <span className="text-yellow-100 font-semibold">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-center">
                <button
                  onClick={() => {
                    setImagePreview("");
                    setImageData("");
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 text-white font-black py-4 px-8 rounded-lg transition-all border-4 border-yellow-500 transform hover:scale-105 text-xl"
                >
                  💩 ANALYZE ANOTHER TURD 💩
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-yellow-200 hover:text-yellow-100 underline font-bold text-lg"
          >
            🚽 ← Back to Toilet HQ
          </a>
        </div>
      </div>
    </div>
  );
}
