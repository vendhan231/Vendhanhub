import { Request, Response } from 'express';
import { getDashboardData } from '../services/dashboard.service';
import config from '../../config';

export const dashboardController = async (req: Request, res: Response) => {
  try {
    const dashboardData = await getDashboardData();
    const io = (global as any).io;
    if (io) {
      io.emit('dashboard-update', dashboardData);
    }
    res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
