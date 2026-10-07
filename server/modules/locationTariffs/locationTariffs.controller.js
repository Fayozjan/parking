import * as locationTariffsService from "./locationTariffs.service.js";

export async function getTariffs(req, res) {
  try {
    const result = await locationTariffsService.getTariffsService(req.query);
    res.json({ success: true, data: result.data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
}

export async function getTariff(req, res) {
  try {
    const tariff = await locationTariffsService.getTariffById(req.params.id);
    if (!tariff) return res.status(404).json({ success: false, message: "Тариф не найден" });
    res.json({ success: true, data: tariff });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function addTariff(req, res) {
  try {
    const data = await locationTariffsService.createTariffService({
      ...req.body,
      added_by: req.user.id,
    });
    res.status(201).json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
}

export async function updateTariff(req, res) {
  try {
    const data = await locationTariffsService.updateTariffService(req.params.id, req.body, req.user.id);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
}

export async function removeTariff(req, res) {
  try {
    const data = await locationTariffsService.deleteTariffService(req.params.id, req.user.id);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}
