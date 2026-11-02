import type { Entry } from '../../modules/activity/activity';
import { isCost, TERM_FIELDS, type TermField } from '../../modules/cars/cars';
import { showNumber } from '../settings/business-rules/show';

// How a car's history line reads (car.add, car.change), shared by the car page and the activity log.
type T = (key: string, values?: Record<string, string>) => string;
export const isTermField = (f: unknown): f is TermField => typeof f === 'string' && (TERM_FIELDS as readonly string[]).includes(f);

/** A term's value with its unit, as people read it: "LKR 4,500", "100 km", "15%". */
export function showTerm(tCars: T, field: TermField, value: unknown): string {
  return typeof value === 'number' ? tCars(`fields.${field}.show`, { n: showNumber(value) }) : '–';
}

/** The values a car or starting-package entry's sentence needs (car.*, package.*). */
export function carValues(tCars: T, e: Entry): Record<string, string> {
  const d = e.details ?? {};
  if (e.action.startsWith('package.')) {
    const field = isTermField(d.field) ? d.field : null;
    return {
      target: String(d.package ?? ''), model: String(d.model ?? ''),
      models: Array.isArray(d.models) ? d.models.map(String).join(', ') : '',
      field: field ? tCars(`fields.${field}.name`) : d.field === 'name' ? tCars('packages.fieldName') : String(d.field ?? ''),
      old: field ? showTerm(tCars, field, d.old) : String(d.old ?? ''),
      new: field ? showTerm(tCars, field, d.new) : String(d.new ?? ''),
    };
  }
  const field = isTermField(d.field) ? d.field : null;
  if (d.field === 'ownerPays') {
    const costs = (v: unknown) => (Array.isArray(v) && v.length ? v.filter((c) => typeof c === 'string' && isCost(c)).map((c) => tCars(`costs.${c}`)).join(', ') : tCars('ownerPays.none'));
    return { target: typeof d.plate === 'string' ? d.plate : (e.targetId ?? ''), field: tCars('ownerPays.name'), old: costs(d.old), new: costs(d.new) };
  }
  return {
    target: typeof d.plate === 'string' ? d.plate : (e.targetId ?? ''),
    field: field ? tCars(`fields.${field}.name`) : String(d.field ?? ''),
    old: field ? showTerm(tCars, field, d.old) : String(d.old ?? ''),
    new: field ? showTerm(tCars, field, d.new) : String(d.new ?? ''),
  };
}

/** Commission and cost changes are partner terms: hidden from people who may not see them (system design 4.2, Proposed). */
export const isPartnerTermEntry = (e: Entry) => (e.action === 'car.change' && (e.details?.field === 'commissionPercent' || e.details?.field === 'ownerPays'))
  || (e.action === 'package.defaults' && e.details?.field === 'commissionPercent');
