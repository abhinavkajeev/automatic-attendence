import React from 'react';
import Card from '../common/Card';
import { Users, Clock, CheckCircle } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend }) => {
  return (
    <Card className="flex items-center space-x-4">
      <div className="p-3 bg-blue-100 rounded-lg">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-semibold">{value}</p>
        {trend && (
          <p className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend}% from last month
          </p>
        )}
      </div>
    </Card>
  );
};

export default StatCard;