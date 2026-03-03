'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getStageLabel, getStageColor, formatDate } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface Car {
  _id: string;
  customerName: string;
  vehicleModel: string;
  vehiclePlate: string;
  serviceType: string;
  services: string[];
  stage: string;
  statusProgress: number;
  assignedMechanicName?: string;
  daysInGarage: number;
  checkInDate: string;
}

interface BoardStage {
  stage: string;
  count: number;
  cars: Car[];
}

export default function GarageBoardPage() {
  const [boardData, setBoardData] = useState<BoardStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBoardData();
    const interval = setInterval(fetchBoardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchBoardData = async () => {
    try {
      const response = await api.get('/cars/garage-board');
      setBoardData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch garage board:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading garage board...</div>
      </div>
    );
  }

  return (
    <div className="h-full p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Garage Board</h1>
        <p className="mt-2 text-muted-foreground">
          Real-time view of all vehicles in the garage
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {boardData.map((stage) => (
          <div key={stage.stage} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{getStageLabel(stage.stage)}</h2>
              <span className="flex h-6 w-6 items-center justify-center text-sm font-medium text-muted-foreground">
                {stage.count}
              </span>
            </div>

            <div className="space-y-3">
              {stage.cars.map((car) => (
                <Card key={car._id} className="transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{car.customerName}</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {car.vehicleModel}
                        </p>
                        <p className="text-xs text-muted-foreground">{car.vehiclePlate}</p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 border ${getStageColor(car.stage)}`}
                      >
                        {car.statusProgress}%
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {car.services.map((service, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground"
                        >
                          {service}
                        </span>
                      ))}
                    </div>

                    {car.assignedMechanicName && (
                      <p className="text-xs text-muted-foreground">
                        Mechanic: {car.assignedMechanicName}
                      </p>
                    )}

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {car.daysInGarage} {car.daysInGarage === 1 ? 'day' : 'days'} in garage
                    </div>

                    <div className="h-1 w-full overflow-hidden bg-secondary">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${car.statusProgress}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              {stage.cars.length === 0 && (
                <div className="flex h-24 items-center justify-center border border-dashed text-sm text-muted-foreground">
                  No vehicles in this stage
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
