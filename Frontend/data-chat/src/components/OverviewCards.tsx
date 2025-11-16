import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Database, Columns3, HardDrive, Copy } from "lucide-react";

interface OverviewCardsProps {
  overview: {
    row_count: number;
    column_count: number;
    memory_usage: number;
    duplicate_rows: number;
  };
}

export function OverviewCards({ overview }: OverviewCardsProps) {
  const cards = [
    {
      title: "Total Rows",
      value: overview.row_count.toLocaleString(),
      icon: Database,
      color: "text-blue-700",
      bgColor: "bg-blue-100",
    },
    {
      title: "Columns",
      value: overview.column_count.toString(),
      icon: Columns3,
      color: "text-purple-700",
      bgColor: "bg-purple-100",
    },
    {
      title: "Memory Usage",
      value: `${(overview.memory_usage*1000).toFixed(3)} KB`,
      icon: HardDrive,
      color: "text-green-700",
      bgColor: "bg-green-100",
    },
    {
      title: "Duplicate Rows",
      value: overview.duplicate_rows.toString(),
      icon: Copy,
      color: "text-orange-700",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className="text-3xl">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
