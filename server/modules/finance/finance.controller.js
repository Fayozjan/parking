import * as financeService from "./finance.service.js";

export async function getParkings(req, res) {
  try {
    const { locationId, from, to, page, pageSize, filter, search, sortKey, sortDir } = req.query;
    const data = await financeService.getParkings({ locationId, from, to, page, pageSize, filter, search, sortKey, sortDir });
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
}

export async function closeParking(req, res) {
  try {
    const { locationId, plateNumber, date } = req.body;
    const data = await financeService.closeParking({ locationId, plateNumber, date }, req.user?.id);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
}

export async function cancelParking(req, res) {
  try {
    const { exitId } = req.params;
    await financeService.cancelParking({ exitId }, req.user?.id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
}

export async function getSummary(req, res) {
  try {
    const { from, to } = req.query;
    const data = await financeService.getFinanceSummary({ from, to });
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
}
