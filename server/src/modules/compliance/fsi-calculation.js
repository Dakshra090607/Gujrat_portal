const row = (base, chargeable, maximum, table, notes = []) => ({ base, chargeable, maximum, table, notes });

const AUTHORITY_TABLES = {
  'D1:AUDA': {
    table: '6.5',
    rows: {
      CW: row(2, 0, 2, '6.5'), GM: row(2, 0, 2, '6.5'), GME: row(1.2, 0.6, 1.8, '6.5'),
      R1: row(1.8, 0.9, 2.7, '6.5'), R2: row(1.2, 0.6, 1.8, '6.5'),
      R3: row(0.3, 0, 0.3, '6.5', ['For EDU1 and EDU2 use only: base FSI 0.3, chargeable FSI 0.9, maximum FSI 1.2.']),
      C2: row(1.8, 0.9, 2.7, '6.5'), LZ: row(1, 0.5, 1.5, '6.5'),
      IZ1: row(1, 0.8, 1.8, '6.5', ['Commercial use condition applies to chargeable FSI.']), IZ5: row(1, 0, 1, '6.5'),
      KZ1: row(1.8, 0, 1.8, '6.5'), RAH1: row(1.8, 0.9, 2.7, '6.5'),
      RAH: row(1.8, 0.9, 2.7, '6.5', ['Base FSI is as per the base zone; chargeable FSI and maximum shown apply to RAH use only.']),
      P: row(0.15, 0, 0.15, '6.5'), C5: row(1.8, 3.6, 5.4, '6.5'), SPD3: row(1.8, 0.9, 2.7, '6.5'),
    },
  },
  'D1:GUDA-NON-GMC': {
    table: '6.7',
    rows: {
      C1: row(1.8, 2.2, 4, '6.7'), C3: row(1.25, 2.75, 4, '6.7'), KZ2: row(1.2, 0.3, 1.5, '6.7'),
      GM: row(2, 0, 2, '6.7'), GME: row(1.25, 0.55, 1.8, '6.7'),
      RAH: row(1.8, 0.9, 2.7, '6.7', ['Chargeable FSI and maximum shown apply to RAH use only.']),
      R3: row(0.3, 0, 0.3, '6.7'),
    },
  },
  'D1:SUDA': {
    table: '6.8',
    rows: {
      GM: row(2, 0, 2, '6.8'), GME: row(1.2, 0.6, 1.8, '6.8'), R1: row(1.8, 0.9, 2.7, '6.8'),
      C2: row(1.8, 0.9, 2.7, '6.8'), IZ1: row(1, 0.8, 1.8, '6.8', ['Chargeable FSI at 40% of Jantri rate applies for commercial use.']),
      IZ5: row(1, 0.8, 1.8, '6.8', ['Chargeable FSI at 40% of Jantri rate applies for commercial use.']),
      REZ: row(0.25, 0, 0.25, '6.8'), KZ1: row(1.2, 0, 1.2, '6.8'), SPD5: row(0.6, 3.4, 4, '6.8', ['Applies within 500 m on both sides of the 90 m wide ring road; 0.6 to 1.2 of chargeable FSI is at 20% of Jantri rate.']),
    },
  },
  'D1:VUDA': {
    table: '6.9',
    rows: {
      GM: row(2, 0, 2, '6.9'), R1: row(1.8, 0.9, 2.7, '6.9'), C1: row(1.8, 0.9, 2.7, '6.9'), C4: row(1.8, 0.9, 2.7, '6.9'),
      R3: row(0.75, 1.75, 2.5, '6.9'), RZ: row(1.8, 0.3, 2.1, '6.9'), GME: row(1.6, 0.2, 1.8, '6.9'),
      IZ1: row(1, 0, 1, '6.9'), IZ5: row(1, 0, 1, '6.9'), KZ1: row(1.2, 1.3, 2.5, '6.9'),
      REZ: row(0.25, 0, 0.25, '6.9'), PPZ1: row(1, 0, 1, '6.9'),
    },
  },
  'D1:RUDA': {
    table: '6.10',
    rows: {
      GM: row(2.25, 0, 2.25, '6.10'), GME: row(1.5, 0.3, 1.8, '6.10'), SPD5: row(1.8, 2.2, 4, '6.10'),
      R1: row(1.8, 0.9, 2.7, '6.10'), C2: row(1.5, 0.7, 2.2, '6.10'), REZ: row(0.15, 0, 0.15, '6.10'),
      IZ1: row(1.2, 0.3, 1.5, '6.10'), IZ5: row(1.2, 0.3, 1.5, '6.10'), LZ: row(1.5, 0, 1.5, '6.10'),
    },
  },
  'D2:JADA': {
    table: '6.11',
    rows: {
      GM: row(2, 0, 2, '6.11'), R1: row(1.8, 0.9, 2.7, '6.11'), C1: row(1.8, 0.9, 2.7, '6.11'),
      IZ1: row(1, 0, 1, '6.11'), IZ5: row(1, 0, 1, '6.11'), REZ: row(0.15, 0, 0.15, '6.11'), PPZ1: row(1.5, 0, 1.5, '6.11'),
    },
  },
  'D2:BADA': {
    table: '6.12',
    rows: {
      GM: row(2, 0, 2, '6.12'), GME: row(1.6, 0.2, 1.8, '6.12'), R1: row(2, 0.7, 2.7, '6.12'),
      R2: row(1.6, 0.6, 2.2, '6.12'), C2: row(1.6, 0.6, 2.2, '6.12'), IZ1: row(1, 0, 1, '6.12'), IZ5: row(1, 0, 1, '6.12'),
      PPZ1: row(1.5, 0, 1.5, '6.12'), REZ: row(0.15, 0, 0.15, '6.12'), LZ: row(1, 0.5, 1.5, '6.12'),
    },
  },
  'D2:JuUDA': {
    table: '6.13',
    rows: {
      GM: row(2.25, 0, 2.25, '6.13'), GME: row(1.5, 0.3, 1.8, '6.13'), R1: row(1.8, 0.9, 2.7, '6.13'),
      C2: row(1.8, 0.9, 2.7, '6.13'), IZ1: row(1.2, 0.3, 1.5, '6.13'), IZ5: row(1.2, 0.3, 1.5, '6.13'),
      REZ: row(0.15, 0, 0.15, '6.13'), PPZ1: row(1, 0, 1, '6.13'),
    },
  },
  'D2:BAUDA': {
    table: '6.14',
    rows: {
      GM: row(2.5, 0, 2.5, '6.14', ['Core area value.']), GME: row(1.2, 0.6, 1.8, '6.14'), R1: row(1.8, 0.9, 2.7, '6.14'),
      R2: row(1.5, 0.6, 2.1, '6.14'), IZ1: row(1, 0, 1, '6.14'), IZ2: row(1, 0, 1, '6.14'),
      KZ1: row(1.8, 0, 1.8, '6.14'), REZ: row(0.15, 0, 0.15, '6.14'), LZ: row(1, 0, 1, '6.14'), RZ: row(0.15, 0, 0.15, '6.14'), PPZ1: row(1, 0, 1, '6.14'),
    },
  },
  'D3:DEFAULT': {
    table: '6.15',
    rows: { GM: row(2, 0, 2, '6.15'), R1: row(1.2, 0, 1.2, '6.15'), C1: row(1.2, 0, 1.2, '6.15'), IZ1: row(1, 0, 1, '6.15'), PPZ1: row(1, 0, 1, '6.15'), REZ: row(0.15, 0, 0.15, '6.15'), LZ: row(1, 0, 1, '6.15') },
  },
  'D6:DEFAULT': {
    table: '6.15',
    rows: { GM: row(2, 0, 2, '6.15'), R1: row(1.2, 0, 1.2, '6.15'), C1: row(1.2, 0, 1.2, '6.15'), IZ1: row(1, 0, 1, '6.15'), PPZ1: row(1, 0, 1, '6.15'), REZ: row(0.15, 0, 0.15, '6.15'), LZ: row(1, 0, 1, '6.15') },
  },
  'D4:DEFAULT': {
    table: '6.16',
    rows: { GM: row(2, 0, 2, '6.16'), R1: row(1.8, 0.6, 2.4, '6.16'), C1: row(1.8, 0.6, 2.4, '6.16'), IZ1: row(1, 0, 1, '6.16'), IZ6: row(1, 0.5, 1.5, '6.16'), IZ7: row(1.5, 0.5, 2, '6.16'), PPZ1: row(1, 0, 1, '6.16'), REZ: row(0.15, 0, 0.15, '6.16'), LZ: row(1, 0, 1, '6.16'), SZ1: row(0.3, 0, 0.3, '6.16'), SZ2: row(1, 0, 1, '6.16'), SZ5: row(1.2, 0.3, 1.5, '6.16'), SZ6: row(0.8, 0.2, 1, '6.16') },
  },
  'D5:DEFAULT': {
    table: '6.16',
    rows: { GM: row(2, 0, 2, '6.16'), R1: row(1.8, 0.6, 2.4, '6.16'), C1: row(1.8, 0.6, 2.4, '6.16'), IZ1: row(1, 0, 1, '6.16'), IZ6: row(1, 0.5, 1.5, '6.16'), IZ7: row(1.5, 0.5, 2, '6.16'), PPZ1: row(1, 0, 1, '6.16'), REZ: row(0.15, 0, 0.15, '6.16'), LZ: row(1, 0, 1, '6.16'), SZ1: row(0.3, 0, 0.3, '6.16'), SZ2: row(1, 0, 1, '6.16'), SZ5: row(1.2, 0.3, 1.5, '6.16'), SZ6: row(0.8, 0.2, 1, '6.16') },
  },
  'D7A:DEFAULT': {
    table: '6.16',
    rows: { GM: row(2, 0, 2, '6.16'), R1: row(1.8, 0.6, 2.4, '6.16'), C1: row(1.8, 0.6, 2.4, '6.16'), IZ1: row(1, 0, 1, '6.16'), IZ6: row(1, 0.5, 1.5, '6.16'), IZ7: row(1.5, 0.5, 2, '6.16'), PPZ1: row(1, 0, 1, '6.16'), REZ: row(0.15, 0, 0.15, '6.16'), LZ: row(1, 0, 1, '6.16'), SZ1: row(0.3, 0, 0.3, '6.16'), SZ2: row(1, 0, 1, '6.16'), SZ5: row(1.2, 0.3, 1.5, '6.16'), SZ6: row(0.8, 0.2, 1, '6.16') },
  },
  'D7B:DEFAULT': {
    table: '6.17',
    rows: { GM: row(2, 0, 2, '6.17'), R1: row(1.8, 0, 1.8, '6.17'), C1: row(1.8, 0, 1.8, '6.17'), IZ1: row(1, 0, 1, '6.17'), SZ1: row(0.3, 0, 0.3, '6.17'), SZ2: row(1, 0, 1, '6.17'), SZ6: row(1.2, 0, 1.2, '6.17'), PPZ1: row(1, 0, 1, '6.17'), PPZ: row(1, 0, 1, '6.17'), REZ: row(0.15, 0, 0.15, '6.17'), LZ: row(1, 0, 1, '6.17') },
  },
};

export function getFsiRowKey({ categoryCode, authorityScope, zoneCode, useCondition = 'ALL' }) {
  return `${categoryCode}:${authorityScope}:${zoneCode}:${useCondition}`;
}

export function getBuiltInFsiRows() {
  const rows = Object.entries(AUTHORITY_TABLES).flatMap(([tableKey, table]) => {
    const separator = tableKey.indexOf(':');
    const categoryCode = tableKey.slice(0, separator);
    const authorityScope = tableKey.slice(separator + 1);
    return Object.entries(table.rows).map(([zoneCode, data]) => ({
      key: getFsiRowKey({ categoryCode, authorityScope, zoneCode }),
      categoryCode,
      authorityScope,
      tableNumber: data.table,
      zoneCode,
      useCondition: 'ALL',
      baseFsi: data.base,
      chargeableFsi: data.chargeable,
      maximumFsi: data.maximum,
      notes: [...data.notes],
      isBuiltIn: true,
      isDeleted: false,
    }));
  });

  for (const categoryCode of ['D8', 'D10']) {
    rows.push({
      key: getFsiRowKey({ categoryCode, authorityScope: 'DEFAULT', zoneCode: 'GMD8' }),
      categoryCode, authorityScope: 'DEFAULT', tableNumber: '6.18', zoneCode: 'GMD8', useCondition: 'ALL',
      baseFsi: 2, chargeableFsi: 0, maximumFsi: 2, notes: [], isBuiltIn: true, isDeleted: false,
    });
    for (const zoneCode of ['RMD8', 'RMD9']) {
      rows.push(
        { key: getFsiRowKey({ categoryCode, authorityScope: 'DEFAULT', zoneCode, useCondition: 'RESIDENTIAL_COMMERCIAL' }), categoryCode, authorityScope: 'DEFAULT', tableNumber: '6.18', zoneCode, useCondition: 'RESIDENTIAL_COMMERCIAL', baseFsi: 1.2, chargeableFsi: 0.6, maximumFsi: 1.8, notes: [], isBuiltIn: true, isDeleted: false },
        { key: getFsiRowKey({ categoryCode, authorityScope: 'DEFAULT', zoneCode, useCondition: 'INDUSTRIAL' }), categoryCode, authorityScope: 'DEFAULT', tableNumber: '6.18', zoneCode, useCondition: 'INDUSTRIAL', baseFsi: 1, chargeableFsi: 0, maximumFsi: 1, notes: [], isBuiltIn: true, isDeleted: false },
        { key: getFsiRowKey({ categoryCode, authorityScope: 'DEFAULT', zoneCode, useCondition: 'AGRICULTURAL' }), categoryCode, authorityScope: 'DEFAULT', tableNumber: '6.18', zoneCode, useCondition: 'AGRICULTURAL', baseFsi: 0.3, chargeableFsi: 0, maximumFsi: 0.3, notes: [], isBuiltIn: true, isDeleted: false },
      );
    }
  }
  rows.push({
    key: getFsiRowKey({ categoryCode: 'D9', authorityScope: 'DEFAULT', zoneCode: '*' }),
    categoryCode: 'D9', authorityScope: 'DEFAULT', tableNumber: '6.19', zoneCode: '*', useCondition: 'ALL',
    baseFsi: 1.6, chargeableFsi: 0, maximumFsi: 1.6,
    notes: ['Maximum built-up coverage is 40% for residential/commercial and 50% for industrial use.', 'Maximum height is 13.00 m; additional industrial height requires Factory Inspector approval.'],
    isBuiltIn: true, isDeleted: false,
  });
  return rows.sort((a, b) => a.categoryCode.localeCompare(b.categoryCode) || a.authorityScope.localeCompare(b.authorityScope) || a.zoneCode.localeCompare(b.zoneCode) || a.useCondition.localeCompare(b.useCondition));
}

function findFsiRow(rows, input, authorityScope, zoneCode = input.zoneCode, useCondition = 'ALL') {
  if (!zoneCode) return null;
  const key = getFsiRowKey({ categoryCode: input.developmentCategory, authorityScope, zoneCode, useCondition });
  return rows.find((item) => item.key === key) ?? null;
}

function sourceScheduleCandidates(rows, input, authorityCode, zoneCode, useCondition = 'ALL') {
  const tableCode = (raw) => {
    const text = `${raw ?? ''}`.toUpperCase();
    const authorities = ['AUDA', 'GUDA', 'SUDA', 'VUDA', 'RUDA', 'JADA', 'BADA', 'BAUDA', 'JUDA', 'ALADA', 'GIDC', 'MUDA', 'UDA'];
    if (/GUDA/.test(text) && /NON[\s-]*GMC/.test(text)) return 'GUDA-NON-GMC';
    return authorities.find((code) => new RegExp(`\\b${code}\\b`).test(text)) ?? 'DEFAULT';
  };
  const numeric = (value) => {
    const text = String(value ?? '').trim();
    if (/as\s+per|according\s+to|table\s+\d/i.test(text)) return null;
    if (/^(?:nil|n\.a\.?|not required|-)$/i.test(text)) return 0;
    const match = text.replaceAll(',', '').match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
  };
  const desiredScope = authorityCode === 'GUDA' && /non[\s-]?gmc/i.test(input.developmentArea ?? '') ? 'GUDA-NON-GMC' : authorityCode;
  const candidates = [];
  for (const source of rows) {
    if (!/^6\.(?:[5-9]|1[0-9])$/.test(source.tableNumber) || source.tableNumber === '6.6') continue;
    if (input.scheduleRowKey && source.key !== input.scheduleRowKey) continue;
    if (!(source.categoryCodes ?? []).includes(input.developmentCategory)) continue;
    const data = source.parsedData ?? {};
    const cells = source.sourceCells ?? [];
    const sourceText = `${source.authorityScope ?? ''} ${source.title ?? ''}`;
    const scope = tableCode(sourceText);
    if (scope !== 'DEFAULT' && scope !== desiredScope && scope !== authorityCode) continue;
    const rowZoneText = String(data.useZone ?? data.conceptualZone ?? data.zone ?? cells[1] ?? '');
    const rawZoneCode = String(data.zoneCode ?? cells[2] ?? '').toUpperCase().trim();
    let zoneCodes = rawZoneCode.split(/[\/&,;]/).map((value) => value.trim()).filter(Boolean);
    let rowUseCondition = 'ALL';
    if (source.tableNumber === '6.18') {
      const useText = String(data.useText ?? cells[1] ?? '').toLowerCase();
      zoneCodes = /gamtal/.test(useText) ? ['GMD8'] : ['RMD8', 'RMD9'];
      rowUseCondition = /industrial/.test(useText) ? 'INDUSTRIAL' : /agricultur/.test(useText) ? 'AGRICULTURAL' : /residential|commercial/.test(useText) ? 'RESIDENTIAL_COMMERCIAL' : 'ALL';
    } else if (source.tableNumber === '6.19') {
      zoneCodes = ['*'];
      const useText = String(data.useText ?? cells[1] ?? '').toLowerCase();
      rowUseCondition = /industrial/.test(useText) ? 'INDUSTRIAL' : /commercial/.test(useText) ? 'COMMERCIAL' : 'RESIDENTIAL';
    }
    if ((!zoneCodes.includes(String(zoneCode).toUpperCase()) && rawZoneCode !== String(zoneCode).toUpperCase())
      || ((['D8', 'D10'].includes(input.developmentCategory) || input.developmentCategory === 'D9') && rowUseCondition !== 'ALL' && rowUseCondition !== useCondition)) continue;
    let base; let chargeable; let maximum;
    if (source.tableNumber === '6.19') {
      base = numeric(cells[2] ?? data.fsiText ?? data.fsi);
      chargeable = 0;
      maximum = base;
    } else if (source.tableNumber === '6.18') {
      base = numeric(cells[2] ?? data.permissibleFsiText ?? data.permissibleFsi);
      chargeable = numeric(cells[3] ?? data.chargeableFsiText ?? data.chargeableFsi) ?? 0;
      maximum = numeric(cells[4] ?? data.maximumFsiText ?? data.maximumFsi) ?? (base == null ? null : base + chargeable);
    } else {
      base = numeric(cells[3] ?? data.baseFsiText ?? data.baseFsi ?? data.permissibleFsiText ?? data.permissibleFsi);
      chargeable = numeric(cells[4] ?? data.chargeableFsiText ?? data.chargeableFsi) ?? 0;
      maximum = numeric(cells[5] ?? data.maximumFsiText ?? data.maximumFsi) ?? (base == null ? null : base + chargeable);
      if (cells.length <= 4 && maximum == null) maximum = base;
    }
    candidates.push({
      key: `${source.key}:${zoneCode}:${rowUseCondition}`,
      categoryCode: input.developmentCategory,
      authorityScope: scope,
      zoneCode,
      useCondition: rowUseCondition,
      baseFsi: base,
      chargeableFsi: chargeable ?? Math.max(0, maximum - base),
      maximumFsi: maximum,
      tableNumber: source.tableNumber,
      notes: [source.remarks, data.remarks].filter(Boolean),
      sourceZoneText: rowZoneText,
      isDeleted: source.isDeleted,
    });
  }
  return candidates;
}

function matchSourceScheduleRow(rows, input, authorityCode, zoneCode, useCondition = 'ALL') {
  const candidates = sourceScheduleCandidates(rows, input, authorityCode, zoneCode, useCondition);
  const exact = candidates.filter((row) => row.authorityScope === authorityCode || row.authorityScope === (authorityCode === 'GUDA' && /non[\s-]?gmc/i.test(input.developmentArea ?? '') ? 'GUDA-NON-GMC' : authorityCode));
  const scoped = exact.length ? exact : candidates.filter((row) => row.authorityScope === 'DEFAULT');
  if (scoped.length <= 1) return { row: scoped[0] ?? null, ambiguous: false };
  const norm = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const label = norm(input.zone);
  const labelMatches = scoped.filter((row) => {
    const sourceLabel = norm(row.sourceZoneText);
    return sourceLabel && (label.includes(sourceLabel) || sourceLabel.includes(label));
  });
  return labelMatches.length === 1 ? { row: labelMatches[0], ambiguous: false } : { row: null, ambiguous: true };
}

function fromManagedRow(item) {
  if (!item || item.isDeleted) return null;
  return { base: item.baseFsi, chargeable: item.chargeableFsi, maximum: item.maximumFsi, table: item.tableNumber, notes: item.notes ?? [] };
}

function unresolved(message, missingInformation, inputs) {
  return { status: 'UNRESOLVED', message, missingInformation, inputs, sources: [], calculation: null };
}

function getAuthorityCode(value = '') {
  return value.match(/\(([^)]+)\)$/)?.[1] ?? value;
}

function getAuthorityTable({ developmentCategory, developmentAuthority, developmentArea }) {
  const authorityCode = getAuthorityCode(developmentAuthority);
  if (developmentCategory === 'D1' && authorityCode === 'GUDA') {
    if (!/non[\s-]?gmc/i.test(developmentArea ?? '')) return null;
    return AUTHORITY_TABLES['D1:GUDA-NON-GMC'];
  }
  return AUTHORITY_TABLES[`${developmentCategory}:${authorityCode}`] ?? AUTHORITY_TABLES[`${developmentCategory}:DEFAULT`] ?? null;
}

function getAuthorityScope(input, authorityCode) {
  if (input.developmentCategory === 'D1' && authorityCode === 'GUDA' && /non[\s-]?gmc/i.test(input.developmentArea ?? '')) return 'GUDA-NON-GMC';
  if (AUTHORITY_TABLES[`${input.developmentCategory}:${authorityCode}`]) return authorityCode;
  if (AUTHORITY_TABLES[`${input.developmentCategory}:DEFAULT`]) return 'DEFAULT';
  return authorityCode || 'DEFAULT';
}

function resultForNumericRow({ data, zoneCode, zone, plotArea, roadWidth, qualifyingWideRoadWidth, distanceFromWideRoad, category, authorityCode, permissibleUseCode, buildingUseCode, tallBuildingPolicy, roadWidths, scheduleRows = [] }) {
  let baseFsi = data.base;
  let chargeableFsi = data.chargeable;
  let maximumFsi = data.maximum;
  let appliedTable = `Table ${data.table}`;
  const notes = [...data.notes];
  const table65ACategoryEligible = ['D1', 'D2', 'D4', 'D7A'].includes(category) && baseFsi >= 1.5;
  const table65AZoneExempt = (authorityCode === 'AUDA' && ['SPD5', 'C5'].includes(zoneCode))
    || (authorityCode === 'RUDA' && zoneCode === 'SPD5')
    || (authorityCode === 'GUDA' && /commercial zone ii/i.test(zone));
  if (!tallBuildingPolicy?.enabled && table65ACategoryEligible && qualifyingWideRoadWidth == null && distanceFromWideRoad != null) {
    return unresolved('The qualifying road width is required to assess Table 6.5A.', ['Enter the width of the separate road that is at least 36 m wide; the plot’s abutting road width does not determine this provision.'], { plotArea, roadWidth, distanceFromWideRoad, zoneCode, zone });
  }
  if (table65ACategoryEligible && qualifyingWideRoadWidth != null && qualifyingWideRoadWidth < 36 && distanceFromWideRoad != null) {
    notes.push(`Table 6.5A was not applied: the entered qualifying road width is ${qualifyingWideRoadWidth} m; the provision requires at least 36 m.`);
  }
  if (table65ACategoryEligible && qualifyingWideRoadWidth >= 36 && table65AZoneExempt && distanceFromWideRoad != null) {
    notes.push('Table 6.5A was not applied because this zone is excluded by the regulation.');
  }
  const table65ABaseEligible = table65ACategoryEligible && qualifyingWideRoadWidth >= 36 && !table65AZoneExempt;
  const table65AEligible = table65ABaseEligible && distanceFromWideRoad != null && distanceFromWideRoad <= 200;
  if (!tallBuildingPolicy?.enabled && table65ABaseEligible && distanceFromWideRoad == null) {
    return unresolved('Table 6.5A may apply, but the qualifying road distance is required.', ['Enter the distance from the edge of the separate 36 m or wider road to confirm that the building unit is within 200 m.'], { plotArea, roadWidth, qualifyingWideRoadWidth, zoneCode, zone });
  }
  if (table65ABaseEligible && distanceFromWideRoad > 200) {
    notes.push('Table 6.5A was not applied: the building unit is more than 200 m from the edge of the qualifying road.');
  } else if (['D1', 'D2', 'D4', 'D7A'].includes(category) && qualifyingWideRoadWidth >= 36 && baseFsi < 1.5) {
    notes.push(`Table 6.5A was not applied: this zone's base FSI (${baseFsi}) is below the regulation's 1.5 minimum for the 200 m wide-road area.`);
  }
  if (table65AEligible && !tallBuildingPolicy?.enabled) {
    const wideRoadRows = scheduleRows.filter((item) => item.tableNumber === '6.5A' && (item.categoryCodes ?? []).includes(category));
    if (wideRoadRows.length) {
      const matches = wideRoadRows.filter((item) => {
        const text = String(item.parsedData?.roadWidthText ?? item.sourceCells?.[1] ?? '');
        const values = [...text.matchAll(/[\d.]+/g)].map(([value]) => Number(value));
        return /≥\s*45|>=\s*45/.test(text) ? qualifyingWideRoadWidth >= (values[0] ?? 45)
          : values.length > 1 ? qualifyingWideRoadWidth >= values[0] && qualifyingWideRoadWidth < values[1]
            : qualifyingWideRoadWidth >= (values[0] ?? 36);
      });
      if (matches.length !== 1 || matches[0].isDeleted) return unresolved('The active wide-road FSI schedule does not provide one usable row for this road width.', ['Review the wide-road schedule rows and their road-width ranges.'], { plotArea, roadWidth, zoneCode, zone });
      const wideMaximum = Number(String(matches[0].sourceCells?.[4] ?? matches[0].parsedData?.maximumFsiText ?? matches[0].parsedData?.maximumFsi ?? '').match(/[\d.]+/)?.[0]);
      if (!Number.isFinite(wideMaximum)) return unresolved('The active wide-road FSI row has no numeric maximum.', ['Enter a numeric maximum in the applicable wide-road schedule row.'], { plotArea, roadWidth, zoneCode, zone });
      maximumFsi = wideMaximum;
    } else if (!scheduleRows.length) maximumFsi = qualifyingWideRoadWidth >= 45 ? 4 : 3.6;
    else return unresolved('The active wide-road FSI schedule has no row for this category.', ['Add or restore a matching wide-road FSI row in the administrator schedule.'], { plotArea, roadWidth, zoneCode, zone });
    chargeableFsi = Math.max(0, maximumFsi - baseFsi);
    appliedTable = 'Table 6.5A';
    notes.push('Applied the Table 6.5A wide-road maximum. Confirm the qualifying road width, the 200 m distance measured from its edge, and any parcel-boundary or post-notification amalgamation conditions in the regulation.');
  }
  if (tallBuildingPolicy?.enabled) {
    const allowedAuthority = ['AUDA', 'SUDA', 'VUDA', 'RUDA', 'GUDA'].includes(authorityCode);
    const allowedUse = /^(DW|M|REC)/i.test(String(buildingUseCode ?? ''))
      || /residential|commercial|recreational|mixed/i.test(String(tallBuildingPolicy.buildingUse ?? ''));
    const widths = Object.values(roadWidths ?? {}).map(Number).filter((value) => Number.isFinite(value) && value > 0);
    if (category !== 'D1' || !allowedAuthority || baseFsi < 1.2) return unresolved('The Tall Building policy does not apply to this category, authority, or base FSI.', ['Chapter 12 applicability is limited to D1 AUDA, SUDA, VUDA, RUDA, and GUDA sites with base FSI at least 1.2.'], { zoneCode, zone });
    if (!allowedUse) return unresolved('The selected building use is not permitted by the Tall Building policy.', ['Chapter 12 permits residential, commercial, recreational, or mixed use.'], { zoneCode, zone });
    const minimumUnitArea = tallBuildingPolicy.heightTier === 'OVER_150' ? 3500 : 2500;
    if (Number(tallBuildingPolicy.buildingUnitArea) < minimumUnitArea) return unresolved('The building unit does not qualify for the selected Tall Building height category.', [`The selected height category requires a minimum building-unit area of ${minimumUnitArea.toLocaleString('en-IN')} m².`], { zoneCode, zone });
    if (!widths.some((value) => value >= 30)) return unresolved('The Tall Building road-width requirement is not met.', ['The building unit must abut a Development Plan / Town Planning Scheme road at least 30 m wide.'], { zoneCode, zone });
    maximumFsi = 5.4;
    chargeableFsi = Math.max(0, maximumFsi - baseFsi);
    appliedTable = 'CGDCR Chapter 12 · Regulation 12.4.6';
    notes.push('Tall Building policy applied: total FSI is Base FSI + Premium FSI, capped at 5.4. Premium FSI is available on payment of additional infrastructure charges at 50% of Jantri rate of NA open land.');
  }
  if (maximumFsi == null) return unresolved('This zone requires a separate FSI table or additional applicability details.', ['The selected zone has no fixed numeric base and maximum FSI in the available table row.'], null);
  if (maximumFsi < baseFsi) return unresolved('The table values need manual review before a result can be established.', ['The base FSI is greater than the stated maximum FSI.'], null);
  if (data.table === '6.20' && !tallBuildingPolicy?.enabled) return unresolved('Agriculture-zone FSI depends on the permitted activity and Table 6.20 conditions.', ['Select or confirm the applicable Table 6.20 activity and building-unit conditions.'], null);
  const calculation = {
    table: appliedTable,
    baseFsi: data.table === '6.19' ? null : baseFsi,
    chargeableFsi: data.table === '6.19' ? null : chargeableFsi,
    maximumFsi,
    baseBuiltUpArea: data.table === '6.19' ? null : baseFsi * plotArea,
    chargeableBuiltUpArea: data.table === '6.19' ? null : chargeableFsi * plotArea,
    maximumBuiltUpArea: maximumFsi * plotArea,
    chargeableBasis: 'Chargeable FSI is the permissible FSI quantity. Where specified, the applicable fee is based on the stated Jantri-rate percentage; the Jantri amount was not provided.',
    permissibleUseCode: permissibleUseCode || null,
    notes,
  };
  return {
    status: 'CALCULATED',
    message: `A table-based FSI result is available from ${appliedTable}.`,
    missingInformation: [],
    inputs: { plotArea, roadWidth, ...(qualifyingWideRoadWidth == null ? {} : { qualifyingWideRoadWidth }), ...(distanceFromWideRoad == null ? {} : { distanceFromWideRoad }), zoneCode, zone },
    sources: [
      { table: `Table ${data.table}`, document: 'Comprehensive General Development Control Regulations – 2017, Part II' },
      ...(appliedTable.startsWith('CGDCR Chapter 12') ? [{ table: appliedTable, document: 'Tall Building 27 May 2021.pdf · Chapter 12' }] : appliedTable === `Table ${data.table}` ? [] : [{ table: appliedTable, document: 'Comprehensive General Development Control Regulations – 2017, Part II' }]),
    ],
    calculation,
  };
}

export function calculateFsi(input, tableRows = [], scheduleRows = []) {
  const authorityCode = getAuthorityCode(input.developmentAuthority);
  const { developmentCategory, zoneCode, plotArea, roadWidth } = input;
  if (!developmentCategory || !zoneCode) {
    return unresolved('No matching FSI table row was selected.', ['Select a Table 1.1 development category and a Table 6.2 zone so the applicable FSI schedule can be identified.'], input);
  }
  if (developmentCategory === 'D1' && authorityCode === 'GUDA' && !/non[\s-]?gmc/i.test(input.developmentArea ?? '')) {
    return unresolved('GUDA FSI depends on whether the site is in GMC or Non-GMC and, for GMC, on sector and plot conditions.', ['Enter “Non-GMC” in Development area to use Table 6.7. GMC sites need the applicable sector, plot size, NA status, and Table 6.6 row.'], input);
  }

  if (['D8', 'D10'].includes(developmentCategory)) {
    const use = (input.buildingUse ?? '').toLowerCase();
    const useCondition = /residential|commercial|mixed/.test(use) ? 'RESIDENTIAL_COMMERCIAL'
      : /industrial/.test(use) ? 'INDUSTRIAL'
        : /agricultur/.test(use) ? 'AGRICULTURAL' : 'ALL';
    const managed = findFsiRow(tableRows, input, 'DEFAULT', zoneCode, zoneCode === 'GMD8' ? 'ALL' : useCondition);
    if (managed?.isDeleted) return unresolved('The applicable FSI row has been removed from the administrator table.', ['Ask an administrator to restore or add the applicable Table 6.18 row.'], input);
    const sourceMatch = matchSourceScheduleRow(scheduleRows, input, authorityCode, zoneCode, zoneCode === 'GMD8' ? 'ALL' : useCondition);
    if (sourceMatch.ambiguous) return unresolved('More than one active FSI schedule row matches this zone and use.', ['Refine the zone/use configuration in the administrator schedule so one row applies.'], input);
    if (sourceMatch.row?.isDeleted) return unresolved('The applicable FSI source row has been removed from the administrator schedule.', ['Restore or add the matching FSI source row.'], input);
    let fsi = (input.scheduleRowKey && sourceMatch.row ? { base: sourceMatch.row.baseFsi, chargeable: sourceMatch.row.chargeableFsi, maximum: sourceMatch.row.maximumFsi, table: sourceMatch.row.tableNumber, notes: sourceMatch.row.notes } : null)
      ?? fromManagedRow(managed)
      ?? (sourceMatch.row ? { base: sourceMatch.row.baseFsi, chargeable: sourceMatch.row.chargeableFsi, maximum: sourceMatch.row.maximumFsi, table: sourceMatch.row.tableNumber, notes: sourceMatch.row.notes } : null);
    if (!fsi && !scheduleRows.length && zoneCode === 'GMD8') fsi = row(2, 0, 2, '6.18');
    else if (!fsi && !scheduleRows.length && (zoneCode === 'RMD8' || zoneCode === 'RMD9')) {
      if (useCondition === 'RESIDENTIAL_COMMERCIAL') fsi = row(1.2, 0.6, 1.8, '6.18');
      else if (useCondition === 'INDUSTRIAL') fsi = row(1, 0, 1, '6.18');
      else if (useCondition === 'AGRICULTURAL') fsi = row(0.3, 0, 0.3, '6.18');
    }
    if (!fsi) return unresolved('The selected use does not map to a numeric Table 6.18 row.', ['Specify whether the proposed building use is residential/commercial, industrial, or agricultural.'], input);
    return resultForNumericRow({ data: fsi, zoneCode, zone: input.zone, plotArea, roadWidth, qualifyingWideRoadWidth: input.qualifyingWideRoadWidth, distanceFromWideRoad: input.distanceFromWideRoad, category: developmentCategory, authorityCode, permissibleUseCode: input.permissibleUseCode, scheduleRows });
  }

  if (developmentCategory === 'D9') {
    const use = (input.buildingUse ?? '').toLowerCase();
    if (use && !/residential|commercial|industrial/.test(use)) return unresolved('Table 6.19 requires Residential, Commercial, or Industrial use.', ['Select a building use covered by Table 6.19.'], input);
    const managed = findFsiRow(tableRows, input, 'DEFAULT', '*');
    if (managed?.isDeleted) return unresolved('The applicable FSI row has been removed from the administrator table.', ['Ask an administrator to restore or add the Table 6.19 row.'], input);
    const d9UseCondition = /industrial/.test(use) ? 'INDUSTRIAL' : /commercial/.test(use) ? 'COMMERCIAL' : 'RESIDENTIAL';
    const sourceMatch = matchSourceScheduleRow(scheduleRows, input, authorityCode, '*', d9UseCondition);
    if (sourceMatch.ambiguous) return unresolved('More than one active FSI schedule row matches this development use.', ['Refine the D9 FSI schedule so only one row applies to this use.'], input);
    if (sourceMatch.row?.isDeleted) return unresolved('The applicable D9 FSI source row has been removed from the administrator schedule.', ['Restore or add the matching D9 FSI source row.'], input);
    const isIndustrial = /industrial/.test(use);
    const fsi = (input.scheduleRowKey && sourceMatch.row ? { base: sourceMatch.row.baseFsi, chargeable: sourceMatch.row.chargeableFsi, maximum: sourceMatch.row.maximumFsi, table: '6.19', notes: sourceMatch.row.notes } : null)
      ?? fromManagedRow(managed)
      ?? (sourceMatch.row ? { base: sourceMatch.row.baseFsi, chargeable: sourceMatch.row.chargeableFsi, maximum: sourceMatch.row.maximumFsi, table: '6.19', notes: sourceMatch.row.notes } : null) ?? (!scheduleRows.length ? row(1.6, 0, 1.6, '6.19', [
      use ? `Maximum built-up coverage is ${isIndustrial ? '50%' : '40%'}.` : 'Maximum built-up coverage depends on development use (40% for residential/commercial and 50% for industrial).',
      'Maximum height is 13.00 m; additional industrial height requires Factory Inspector approval.',
    ]) : null);
    return resultForNumericRow({ data: fsi, zoneCode, zone: input.zone, plotArea, roadWidth, qualifyingWideRoadWidth: input.qualifyingWideRoadWidth, distanceFromWideRoad: input.distanceFromWideRoad, category: developmentCategory, authorityCode, permissibleUseCode: input.permissibleUseCode, scheduleRows });
  }

  const table = getAuthorityTable(input);
  const scope = getAuthorityScope(input, authorityCode);
  const exactManagedRow = findFsiRow(tableRows, input, authorityCode, zoneCode);
  const managedRow = exactManagedRow ?? findFsiRow(tableRows, input, scope, zoneCode);
  if (managedRow?.isDeleted) return unresolved('The applicable FSI row has been removed from the administrator table.', ['Ask an administrator to restore or add the applicable schedule row.'], input);
  const sourceMatch = matchSourceScheduleRow(scheduleRows, input, authorityCode, zoneCode);
  if (sourceMatch.ambiguous) return unresolved('More than one active FSI source row matches this category, authority, and zone.', ['Refine the source schedule or zone configuration so one row applies.'], input);
  if (sourceMatch.row?.isDeleted) return unresolved('The applicable FSI source row has been removed from the administrator schedule.', ['Restore or add the matching source row.'], input);
  if (!table && !managedRow && !sourceMatch.row) return unresolved('No FSI table is configured for this authority and category.', ['Add a matching FSI row to the administrator calculator table.'], input);
  let data = fromManagedRow(managedRow) ?? (sourceMatch.row ? { base: sourceMatch.row.baseFsi, chargeable: sourceMatch.row.chargeableFsi, maximum: sourceMatch.row.maximumFsi, table: sourceMatch.row.tableNumber, notes: sourceMatch.row.notes } : null) ?? (!scheduleRows.length ? table?.rows[zoneCode] : null);
  const zoneText = input.zone.toLowerCase();
  if (developmentCategory === 'D1' && authorityCode === 'RUDA' && zoneCode === 'GM' && /city area b/.test(zoneText)) {
    data = row(2, 0.5, 2.5, '6.10');
  }
  if (developmentCategory === 'D2' && authorityCode === 'JADA') {
    if (zoneCode === 'GM' && /city area a/.test(zoneText)) data = row(2, 0, 2, '6.11');
    else if (['R1', 'C1'].includes(zoneCode) && /city area [bc]/.test(zoneText)) data = row(1.8, 0.9, 2.7, '6.11');
    else data = null;
  }
  if (developmentCategory === 'D2' && authorityCode === 'BADA' && /city area f/.test(zoneText)) {
    data = row(1.8, 0.9, 2.7, '6.12', ['City Area F maximum FSI is specified separately in the Table 6.12 note.']);
  }
  if (developmentCategory === 'D2' && authorityCode === 'JuUDA' && zoneCode === 'GM' && /walled city of junagadh/.test(zoneText)) {
    data = row(2.25, 0.75, 3, '6.13');
  }
  if (developmentCategory === 'D2' && authorityCode === 'BAUDA' && zoneCode === 'GM') {
    if (/core area/.test(zoneText)) data = row(2.5, 0, 2.5, '6.14');
    else if (/other than bharuch and ankleshwar/.test(zoneText)) data = row(1.5, 0, 1.5, '6.14');
  }
  if (developmentCategory === 'D1' && authorityCode === 'VUDA' && zoneCode === 'RZ') {
    if (/restricted residential zone/i.test(input.zone)) data = row(1.8, 0.3, 2.1, '6.9');
    else if (/RZ3[–-]RZ5/i.test(input.zone)) data = null;
    else if (/restricted area|RZ1[–-]RZ2/i.test(input.zone)) data = row(0.3, 0, 0.3, '6.9');
  }
  if (developmentCategory === 'D1' && authorityCode === 'SUDA' && zoneCode === 'SPD5' && !/ring\s*road|90\s*m/i.test(input.developmentArea ?? '')) {
    return unresolved('SUDA Table 6.8 provides this FSI only within 500 m on both sides of the 90 m wide ring road.', ['Confirm the development area lies within the specified SUDA ring-road corridor.'], input);
  }
  if (developmentCategory === 'D1' && authorityCode === 'GUDA' && table === AUTHORITY_TABLES['D1:GUDA-NON-GMC']) {
    if (/residential zone iv/.test(zoneText)) data = row(1.8, 0.45, 2.25, '6.7');
    else if (/residential zone v/.test(zoneText)) data = row(1.5, 0.75, 2.25, '6.7');
    else if (/commercial zone ii/.test(zoneText)) data = row(1.8, 2.2, 4, '6.7');
  }
  if (developmentCategory === 'D1' && authorityCode === 'AUDA' && zoneCode === 'R3') {
    data = ['EDU1', 'EDU2'].includes(input.permissibleUseCode)
      ? row(0.3, 0.9, 1.2, '6.5')
      : row(0.3, 0, 0.3, '6.5');
  }
  if (developmentCategory === 'D1' && ['AUDA', 'SUDA'].includes(authorityCode) && zoneCode === 'IZ1' && !input.buildingUse) {
    return unresolved('The Table 6.5/6.8 chargeable FSI for IZ1 depends on whether the use is commercial.', ['Building use is optional, but selecting it is needed to determine the commercial-use chargeable FSI.'], input);
  }
  if (developmentCategory === 'D1' && ['AUDA', 'SUDA'].includes(authorityCode) && zoneCode === 'IZ1' && !/commercial|mercantile/i.test(input.buildingUse)) {
    data = row(1, 0, 1, authorityCode === 'AUDA' ? '6.5' : '6.8');
  }
  if (sourceMatch.row && (!managedRow || input.scheduleRowKey)) data = { base: sourceMatch.row.baseFsi, chargeable: sourceMatch.row.chargeableFsi, maximum: sourceMatch.row.maximumFsi, table: sourceMatch.row.tableNumber, notes: sourceMatch.row.notes };
  if (managedRow && !input.scheduleRowKey) data = fromManagedRow(managedRow);
  if (!data) return unresolved('No numeric FSI row matches this authority and zone.', ['The selected zone is not listed with numeric FSI values in the applicable table, or requires a special schedule/condition.'], input);
  if (data.base == null || data.maximum == null) return unresolved('The active FSI schedule row does not contain numeric values for this zone.', ['Update the matching source row or add a normalized FSI row in the administrator table.'], input);
  return resultForNumericRow({ data, zoneCode, zone: input.zone, plotArea, roadWidth, qualifyingWideRoadWidth: input.qualifyingWideRoadWidth, distanceFromWideRoad: input.distanceFromWideRoad, category: developmentCategory, authorityCode, permissibleUseCode: input.permissibleUseCode, buildingUseCode: input.buildingUseCode, tallBuildingPolicy: input.tallBuildingPolicy, roadWidths: input.roadWidths, scheduleRows });
}

