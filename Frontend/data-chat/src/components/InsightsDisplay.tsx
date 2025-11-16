import { TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface InsightsDisplayProps {
  insights: string[];
  loading: boolean;
}

export function InsightsDisplay({ insights, loading }: InsightsDisplayProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800 mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Generating insights...</p>
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border border-slate-200">
        <p className="text-sm text-slate-600 text-center">
          Insights are being generated. Please refresh if they don't appear.
        </p>
      </div>
    );
  }

  const icons = [TrendingUp, AlertTriangle, Lightbulb];
  const titles = ["Hidden Relationships", "Hidden Patterns", "Next Steps"];
  const colors = ["text-blue-700", "text-purple-700", "text-green-700"];
  const bgColors = ["bg-blue-100", "bg-purple-100", "bg-green-100"];

  const cards = insights.map((insight, index) => ({
    title: titles[index] || `Insight ${index + 1}`,
    value: insight,
    icon: icons[index] || Lightbulb,
    color: colors[index] || "text-blue-700",
    bgColor: bgColors[index] || "bg-blue-100",
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="border-0 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">
              {card.title}
            </CardTitle>
            <div className={`p-2.5 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg text-slate-600 leading-relaxed">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

