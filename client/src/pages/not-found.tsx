import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Card>
        <CardContent className="p-6 text-center">
          <h1 className="text-xl font-bold mb-2">404</h1>
          <p className="text-sm text-muted-foreground">Страница не найдена</p>
        </CardContent>
      </Card>
    </div>
  );
}
