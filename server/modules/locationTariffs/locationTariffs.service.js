import * as locationTariffsModel from "./locationTariffs.model.js";
import { createAuditLog } from "../../utils/auditLog.js";

const VALID_TYPES = ["fixed", "hourly"];

export async function getTariffsService({ is_active } = {}) {
  const where = {};
  if (is_active !== undefined && is_active !== "") {
    where.is_active = is_active === "true" || is_active === true;
  }
  const records = await locationTariffsModel.getTariffs({ where });
  return { data: records.map(formatTariff) };
}

export async function getTariffById(id) {
  const tariffId = Number(id);
  if (Number.isNaN(tariffId)) throw new Error("Некорректный ID");
  const record = await locationTariffsModel.getTariffById(tariffId);
  return record ? formatTariff(record) : null;
}

export async function createTariffService({ name, price_type, base_price, effective_from, added_by }) {
  if (!name?.trim()) throw new Error("Название обязательно");
  if (!VALID_TYPES.includes(price_type)) throw new Error("Некорректный тип цены");
  if (!effective_from) throw new Error("Дата начала обязательна");
  if (base_price === undefined || base_price === null || base_price === "") throw new Error("Цена обязательна");

  const effectiveDate = new Date(effective_from);
  if (Number.isNaN(effectiveDate.getTime())) throw new Error("Некорректная дата");

  const result = await locationTariffsModel.createTariff({
    name: name.trim(),
    price_type,
    base_price: Number(base_price),
    effective_from: effectiveDate,
    added_by,
  });

  await createAuditLog({ userId: added_by, action: "create", entity: "location_tariffs", recordId: result.id, newData: result });
  return formatTariff(result);
}

export async function updateTariffService(id, { name, price_type, base_price, effective_from, is_active }, userId) {
  const tariffId = Number(id);
  if (Number.isNaN(tariffId)) throw new Error("Некорректный ID");

  const updateData = {};

  if (name !== undefined) updateData.name = name.trim();
  if (price_type !== undefined) {
    if (!VALID_TYPES.includes(price_type)) throw new Error("Некорректный тип цены");
    updateData.price_type = price_type;
  }
  if (effective_from !== undefined) {
    const d = new Date(effective_from);
    if (Number.isNaN(d.getTime())) throw new Error("Некорректная дата");
    updateData.effective_from = d;
  }
  if (is_active !== undefined) updateData.is_active = Boolean(is_active);
  if (base_price !== undefined) {
    updateData.base_price = base_price === "" || base_price === null ? null : Number(base_price);
  }

  const old = await locationTariffsModel.getTariffById(tariffId);
  const result = await locationTariffsModel.updateTariff(tariffId, updateData);
  await createAuditLog({ userId, action: "update", entity: "location_tariffs", recordId: tariffId, oldData: old, newData: result });
  return formatTariff(result);
}

export async function deleteTariffService(id, userId) {
  const tariffId = Number(id);
  if (Number.isNaN(tariffId)) throw new Error("Некорректный ID");
  const deleted = await locationTariffsModel.deleteTariff(tariffId);
  await createAuditLog({ userId, action: "delete", entity: "location_tariffs", recordId: tariffId, oldData: deleted });
  return deleted;
}

function formatTariff(record) {
  return {
    ...record,
    effective_from: record.effective_from instanceof Date
      ? record.effective_from.toISOString().slice(0, 10)
      : record.effective_from,
    base_price: record.base_price !== null && record.base_price !== undefined
      ? Number(record.base_price)
      : null,
  };
}
