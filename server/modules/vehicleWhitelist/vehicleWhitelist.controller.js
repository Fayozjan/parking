import ExcelJS from "exceljs";
import * as vehicleWhitelistService from "./vehicleWhitelist.service.js";
import { HikConnectAnprClient } from "../../utils/hikvisionIsapi.js";
import { AnprCamerasModel } from "../anprCameras/anprCameras.model.js";

export async function getAll(req, res) {
  try {
    const result = await vehicleWhitelistService.getService({
      page: req.query.page,
      pageSize: req.query.pageSize,
      filters: { status: req.query.status, search: req.query.search, folder_id: req.query.folder_id },
    });
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
}

export async function getOne(req, res) {
  try {
    const record = await vehicleWhitelistService.getByIdService(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: "Запись не найдена" });
    res.json({ success: true, data: record });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function addOne(req, res) {
  try {
    const data = await vehicleWhitelistService.createService({
      ...req.body,
      added_by: req.user.id,
    });
    res.status(201).json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
}

export async function updateOne(req, res) {
  try {
    const data = await vehicleWhitelistService.updateService(req.params.id, req.body, req.user.id);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
}

export async function removeOne(req, res) {
  try {
    await vehicleWhitelistService.removeService(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function importFromExcel(req, res) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Файл не загружен" });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.worksheets[0];

    const rows = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const pattern = row.getCell(1).value;
      const mode = row.getCell(2).value;
      const description = row.getCell(3).value;
      if (pattern) {
        rows.push({
          pattern: String(pattern).trim(),
          mode: String(mode || "no_tariff").trim(),
          description: description ? String(description).trim() : null,
        });
      }
    });

    const result = await vehicleWhitelistService.importManyService(rows, req.user.id, req.body?.folder_id);
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
}

export async function syncCameras(req, res) {
  try {
    const result = await vehicleWhitelistService.syncAllToCamerasService();
    res.json({ success: true, data: result });
  } catch (e) {
    console.error("[SyncCameras]", e);
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function getHikDevices(req, res) {
  try {
    const data = await HikConnectAnprClient.getDevices();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function testCameraConnection(req, res) {
  try {
    const camera = await AnprCamerasModel.findById(req.params.cameraId);
    if (!camera) return res.status(404).json({ success: false, message: "Камера не найдена" });
    if (!camera.serial_number) {
      return res.status(400).json({ success: false, message: "У камеры нет серийного номера" });
    }

    await HikConnectAnprClient.addPlate(camera.serial_number, 999999, "TEST000AA");
    await HikConnectAnprClient.removePlate(camera.serial_number, "TEST000AA");

    res.json({ success: true, message: "Соединение с камерой успешно" });
  } catch (e) {
    res.status(500).json({ success: false, message: `Ошибка подключения: ${e.message}` });
  }
}

/* ---------- Папки ---------- */

export async function getFolders(req, res) {
  try {
    const data = await vehicleWhitelistService.getFoldersService();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function addFolder(req, res) {
  try {
    const data = await vehicleWhitelistService.createFolderService(req.body, req.user.id);
    res.status(201).json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
}

export async function updateFolder(req, res) {
  try {
    const data = await vehicleWhitelistService.updateFolderService(req.params.id, req.body, req.user.id);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
}

export async function removeFolder(req, res) {
  try {
    await vehicleWhitelistService.removeFolderService(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}
