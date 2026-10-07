import { DashboardModel } from "./dashboard.model.js";

export async function getSummary(req, res) {
  try {
    const data = await DashboardModel.getSummary();
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
}

export async function getAnalytics(req, res) {
  try {
    const { period } = req.query;
    const data = await DashboardModel.getAnalytics({ period });
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
}

export async function getParkingsByLocation(req, res) {
  try {
    const { period } = req.query;
    const data = await DashboardModel.getParkingsByLocation({ period });
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
}

export async function getFinancialReport(req, res) {
  try {
    const { period } = req.query;
    const data = await DashboardModel.getFinancialReport({ period });
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
}

export async function getOccupancyByLocation(req, res) {
  try {
    const data = await DashboardModel.getOccupancyByLocation();
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
}

export async function getFeeds(req, res) {
  try {
    const data = await DashboardModel.getFeeds();
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
}

export async function getLocationCoordinates(req, res) {
  try {
    const data = await DashboardModel.getLocationCoordinates();
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
}
