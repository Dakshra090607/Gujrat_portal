import { randomUUID } from 'node:crypto';
import { db, withTransaction } from '../config/database.js';

export const newId = () => randomUUID();
const timestamp = () => new Date().toISOString();
const copy = (value) => value == null ? value : structuredClone(value);
const USER_ROLES = new Set(['GENERAL_USER', 'PROFESSIONAL_USER', 'REVIEWER', 'ADMIN']);

function asDocument(row, lean = false) {
  if (!row) return null;
  const value = { ...copy(row.data), _id: String(row.id) };
  if (lean) return value;
  Object.defineProperty(value, 'toObject', {
    enumerable: false,
    value: () => copy(Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'toObject'))),
  });
  return value;
}

function matchesValue(actual, expected) {
  if (expected && typeof expected === 'object' && !Array.isArray(expected) && !(expected instanceof Date)) {
    for (const [operator, value] of Object.entries(expected)) {
      if (operator === '$in' && !value.some((candidate) => matchesValue(actual, candidate))) return false;
      if (operator === '$nin' && value.some((candidate) => matchesValue(actual, candidate))) return false;
      if (operator === '$ne' && matchesValue(actual, value)) return false;
      if (operator === '$exists' && (actual !== undefined) !== Boolean(value)) return false;
      if (operator === '$regex') {
        const regex = new RegExp(value, expected.$options ?? '');
        if (!regex.test(String(actual ?? ''))) return false;
      }
      if (operator === '$gte' && !(actual >= value)) return false;
      if (operator === '$lte' && !(actual <= value)) return false;
      if (operator === '$gt' && !(actual > value)) return false;
      if (operator === '$lt' && !(actual < value)) return false;
      if (!['$in', '$nin', '$ne', '$exists', '$regex', '$options', '$gte', '$lte', '$gt', '$lt'].includes(operator)) return false;
    }
    return true;
  }
  if (Array.isArray(actual)) return actual.some((entry) => String(entry) === String(expected));
  if (actual == null || expected == null) return actual == null && expected == null;
  return String(actual) === String(expected);
}

function matchesFilter(row, filter = {}) {
  return Object.entries(filter).every(([key, expected]) => {
    if (key === '$or') return expected.some((part) => matchesFilter(row, part));
    if (key === '$and') return expected.every((part) => matchesFilter(row, part));
    const actual = key === '_id' || key === 'id' ? row._id : key.split('.').reduce((value, part) => value?.[part], row);
    return matchesValue(actual, expected);
  });
}

function addParameter(values, value) {
  values.push(value);
  return `$${values.length}`;
}

function compileFieldCondition(field, expected, values) {
  if (field === '_id' || field === 'id') {
    if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
      if (expected.$in) return `id = ANY(${addParameter(values, expected.$in.map(String))}::uuid[])`;
      if (expected.$ne) return `id <> ${addParameter(values, String(expected.$ne))}::uuid`;
    }
    return `id = ${addParameter(values, String(expected))}::uuid`;
  }
  const path = addParameter(values, field.split('.'));
  const expression = `(data #> ${path}::text[])`;
  const equal = (value) => {
    const parameter = addParameter(values, JSON.stringify(value));
    return `(COALESCE(${expression}, 'null'::jsonb) = ${parameter}::jsonb OR (jsonb_typeof(${expression}) = 'array' AND ${expression} @> jsonb_build_array(${parameter}::jsonb)))`;
  };
  if (expected && typeof expected === 'object' && !Array.isArray(expected) && !(expected instanceof Date)) {
    const conditions = [];
    for (const [operator, value] of Object.entries(expected)) {
      if (operator === '$options') continue;
      if (operator === '$in') conditions.push(value.length ? `(${value.map(equal).join(' OR ')})` : 'FALSE');
      else if (operator === '$nin') conditions.push(value.length ? `NOT (${value.map(equal).join(' OR ')})` : 'TRUE');
      else if (operator === '$ne') conditions.push(`NOT ${equal(value)}`);
      else if (operator === '$exists') conditions.push(`(${expression} IS ${value ? 'NOT ' : ''}NULL)`);
      else if (operator === '$regex') {
        const flags = String(expected.$options ?? '');
        let pattern = String(value);
        if (pattern.startsWith('^')) pattern = pattern.slice(1);
        if (pattern.endsWith('$')) pattern = pattern.slice(0, -1);
        pattern = `%${pattern.replace(/[\\%_]/g, '\\$&')}%`;
        conditions.push(`(data #>> ${path}::text[]) ${flags.includes('i') ? 'ILIKE' : 'LIKE'} ${addParameter(values, pattern)} ESCAPE '\\'`);
      } else if (['$gte', '$lte', '$gt', '$lt'].includes(operator)) {
        const numeric = typeof value === 'number';
        const comparator = ({ $gte: '>=', $lte: '<=', $gt: '>', $lt: '<' })[operator];
        const left = numeric ? `CASE WHEN jsonb_typeof(${expression}) = 'number' THEN (data #>> ${path}::text[])::numeric END` : `(data #>> ${path}::text[])`;
        conditions.push(`${left} ${comparator} ${addParameter(values, value)}${numeric ? '::numeric' : '::text'}`);
      } else {
        throw new Error(`Unsupported database query operator: ${operator}`);
      }
    }
    return conditions.length ? `(${conditions.join(' AND ')})` : 'TRUE';
  }
  return equal(expected);
}

function compileFilter(filter, values) {
  const conditions = [];
  for (const [field, value] of Object.entries(filter ?? {})) {
    if (field === '$or' || field === '$and') {
      const entries = value.map((part) => `(${compileFilter(part, values)})`);
      conditions.push(entries.length ? entries.join(field === '$or' ? ' OR ' : ' AND ') : (field === '$or' ? 'FALSE' : 'TRUE'));
    } else conditions.push(compileFieldCondition(field, value, values));
  }
  return conditions.length ? conditions.join(' AND ') : 'TRUE';
}

function orderBy(sort, values) {
  const terms = [];
  for (const [field, direction] of Object.entries(sort ?? {})) {
    if (field === '_id' || field === 'id') {
      terms.push(`id ${direction < 0 ? 'DESC' : 'ASC'}`);
      continue;
    }
    const path = addParameter(values, field.split('.'));
    const expr = `data #> ${path}::text[]`;
    terms.push(`CASE WHEN jsonb_typeof(${expr}) = 'number' THEN (data #>> ${path}::text[])::numeric END ${direction < 0 ? 'DESC' : 'ASC'} NULLS LAST`);
    terms.push(`data #>> ${path}::text[] ${direction < 0 ? 'DESC' : 'ASC'} NULLS LAST`);
  }
  return terms.length ? ` ORDER BY ${terms.join(', ')}` : '';
}

function applyProjection(document, selection, model) {
  if (!selection) {
    const result = copy(document);
    if (model === 'User') delete result.passwordHash;
    return result;
  }
  const fields = selection.trim().split(/\s+/).filter(Boolean);
  const exclusions = fields.filter((field) => field.startsWith('-')).map((field) => field.slice(1));
  const inclusions = fields.filter((field) => !field.startsWith('-') && !field.startsWith('+'));
  if (!inclusions.length) {
    const result = copy(document);
    for (const field of exclusions) delete result[field];
    if (model === 'User' && !fields.includes('+passwordHash')) delete result.passwordHash;
    return result;
  }
  const result = { _id: document._id };
  for (const field of inclusions) {
    if (Object.hasOwn(document, field)) result[field] = copy(document[field]);
  }
  return result;
}

const populateModels = {
  sourceDocumentId: 'SourceDocument', sourcePageId: 'SourcePage',
  assignedReviewerId: 'User', approvedById: 'User', actorId: 'User',
  chapterId: 'Chapter', regulationId: 'Regulation', tableId: 'RegulatoryTable',
  tableIds: 'RegulatoryTable', parentId: 'RegulatoryNode',
};

async function applyPopulate(documents, populate, session, lean) {
  for (const spec of populate) {
    const { path, fields } = spec;
    const modelName = populateModels[path];
    if (!modelName) continue;
    const refs = [...new Set(documents.flatMap((document) => {
      const value = document[path];
      return (Array.isArray(value) ? value : [value]).filter(Boolean).map(String);
    }))];
    if (!refs.length) continue;
    const related = await executeModelQuery(modelName, { _id: { $in: refs } }, { select: fields, lean: true, session });
    const byId = new Map(related.map((record) => [String(record._id), record]));
    for (const document of documents) {
      if (Array.isArray(document[path])) document[path] = document[path].map((id) => byId.get(String(id)) ?? null);
      else if (document[path] != null) document[path] = byId.get(String(document[path])) ?? null;
    }
  }
  return documents.map((document) => lean ? document : hydrate(document));
}

function hydrate(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  Object.defineProperty(value, 'toObject', {
    enumerable: false,
    configurable: true,
    value: () => copy(Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'toObject'))),
  });
  return value;
}

function userRow(row) {
  return {
    id: row.id,
    data: {
      name: row.name,
      email: row.email,
      role: row.role,
      isActive: row.is_active,
      authUserId: row.auth_user_id,
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  };
}

async function selectRows(model, filter, { client, sort, skip = 0, limit, forUpdate = false } = {}) {
  if (model === 'User') {
    const result = await db.query('SELECT id, auth_user_id, name, email, role, is_active, last_login_at, created_at, updated_at FROM app_users', [], client);
    let rows = result.rows.map(userRow).map((row) => ({ ...row.data, _id: row.id }));
    rows = rows.filter((row) => matchesFilter(row, filter));
    for (const [key, direction] of Object.entries(sort ?? {})) rows.sort((a, b) => String(a[key] ?? '').localeCompare(String(b[key] ?? '')) * (direction < 0 ? -1 : 1));
    if (skip) rows = rows.slice(skip);
    if (limit != null) rows = rows.slice(0, limit);
    return rows.map((row) => ({ id: row._id, data: Object.fromEntries(Object.entries(row).filter(([key]) => key !== '_id')) }));
  }
  const values = [model];
  const where = compileFilter(filter, values);
  const query = `SELECT id, data FROM buildrule_records WHERE model = $1 AND ${where}${orderBy(sort, values)}${limit == null ? '' : ` LIMIT ${addParameter(values, limit)}`}${skip ? ` OFFSET ${addParameter(values, skip)}` : ''}${forUpdate ? ' FOR UPDATE' : ''}`;
  const result = await db.query(query, values, client);
  return result.rows;
}

async function executeModelQuery(model, filter, options = {}) {
  const rows = await selectRows(model, filter, options);
  const docs = rows.map((row) => asDocument(row, true)).map((row) => applyProjection(row, options.select, model));
  const populated = options.populate?.length ? await applyPopulate(docs, options.populate, options.session, true) : docs;
  return options.one ? populated[0] ?? null : populated;
}

function flattenDistinct(value) {
  if (Array.isArray(value)) return value;
  return value == null ? [] : [value];
}

function setPath(target, path, value) {
  const parts = path.split('.');
  let parent = target;
  for (const part of parts.slice(0, -1)) {
    if (!parent[part] || typeof parent[part] !== 'object') parent[part] = {};
    parent = parent[part];
  }
  parent[parts.at(-1)] = copy(value);
}

function applyUpdate(original, update, insert = false) {
  const result = copy(original ?? {});
  if (!Object.keys(update ?? {}).some((key) => key.startsWith('$'))) {
    return { ...result, ...copy(update) };
  }
  if (insert && update.$setOnInsert) Object.assign(result, copy(update.$setOnInsert));
  if (update.$set) for (const [key, value] of Object.entries(update.$set)) setPath(result, key, value);
  if (update.$inc) for (const [key, value] of Object.entries(update.$inc)) setPath(result, key, Number(result[key] ?? 0) + Number(value));
  if (update.$unset) for (const key of Object.keys(update.$unset)) delete result[key];
  return result;
}

function equalityFilter(filter) {
  const value = {};
  for (const [key, item] of Object.entries(filter ?? {})) {
    if (key.startsWith('$') || item && typeof item === 'object' && !Array.isArray(item) && !(item instanceof Date)) continue;
    if (key !== '_id' && key !== 'id') value[key] = item;
  }
  return value;
}

async function insertRecord(model, data, client) {
  const now = timestamp();
  const payload = copy(data ?? {});
  const id = String(payload._id ?? newId());
  delete payload._id;
  payload.createdAt ??= now;
  payload.updatedAt ??= now;
  const result = await db.query(
    'INSERT INTO buildrule_records (model, id, data, created_at, updated_at) VALUES ($1, $2::uuid, $3::jsonb, $4::timestamptz, $5::timestamptz) RETURNING id, data',
    [model, id, JSON.stringify(payload), payload.createdAt, payload.updatedAt], client,
  );
  return result.rows[0];
}

async function findOneAndUpdate(model, filter, update, options = {}) {
  const client = options.session?.client ?? null;
  const operation = async (transactionClient) => {
    const [current] = await selectRows(model, filter, { client: transactionClient, limit: 1, forUpdate: true });
    if (!current && !options.upsert) return null;
    if (!current) {
      const initial = applyUpdate(equalityFilter(filter), update, true);
      const row = await insertRecord(model, initial, transactionClient);
      return asDocument(row);
    }
    const payload = applyUpdate(current.data, update);
    payload.updatedAt = timestamp();
    const result = await db.query(
      'UPDATE buildrule_records SET data = $3::jsonb, updated_at = $4::timestamptz WHERE model = $1 AND id = $2::uuid RETURNING id, data',
      [model, current.id, JSON.stringify(payload), payload.updatedAt], transactionClient,
    );
    return asDocument(result.rows[0]);
  };
  if (client) return operation(client);
  return withTransaction(operation);
}

async function updateOne(model, filter, update, options = {}) {
  const current = await findOneAndUpdate(model, filter, update, { ...options, new: true, upsert: options.upsert });
  return { acknowledged: true, matchedCount: current ? 1 : 0, modifiedCount: current ? 1 : 0, upsertedCount: current && options.upsert ? 1 : 0 };
}

async function distinct(model, filter, field, options = {}) {
  const rows = await executeModelQuery(model, filter, { session: options.session, lean: true });
  const values = rows.flatMap((row) => field === '_id' || field === 'id' ? [row._id] : flattenDistinct(field.split('.').reduce((value, part) => value?.[part], row)));
  return [...new Map(values.filter((value) => value != null).map((value) => [JSON.stringify(value), value])).values()];
}

export class ModelQuery {
  constructor(model, filter, one = false) {
    this.model = model;
    this.filter = filter ?? {};
    this.one = one;
    this.projection = null;
    this.sortSpec = null;
    this.offset = 0;
    this.rowLimit = undefined;
    this.populateSpecs = [];
    this.sessionValue = null;
    this.isLean = false;
    this.distinctField = null;
  }
  select(fields) { this.projection = fields; return this; }
  sort(spec) { this.sortSpec = spec; return this; }
  skip(value) { this.offset = Number(value) || 0; return this; }
  limit(value) { this.rowLimit = Number(value); return this; }
  populate(path, fields) { this.populateSpecs.push({ path, fields }); return this; }
  session(session) { this.sessionValue = session; return this; }
  lean() { this.isLean = true; return this; }
  distinct(field) { this.distinctField = field; return this.exec(); }
  async exec() {
    if (this.distinctField) return distinct(this.model.modelName, this.filter, this.distinctField, { session: this.sessionValue });
    let rows = await selectRows(this.model.modelName, this.filter, {
      client: this.sessionValue?.client ?? null,
      sort: this.sortSpec,
      skip: this.offset,
      limit: this.rowLimit,
      forUpdate: false,
    });
    let docs = rows.map((row) => applyProjection(asDocument(row, true), this.projection, this.model.modelName));
    if (this.populateSpecs.length) docs = await applyPopulate(docs, this.populateSpecs, this.sessionValue, true);
    if (!this.isLean) docs = docs.map(hydrate);
    return this.one ? docs[0] ?? null : docs;
  }
  then(resolve, reject) { return this.exec().then(resolve, reject); }
  catch(reject) { return this.exec().catch(reject); }
  finally(callback) { return this.exec().finally(callback); }
}

export function defineModel(modelName) {
  return {
    modelName,
    find: (filter = {}) => new ModelQuery({ modelName }, filter),
    findOne: (filter = {}) => new ModelQuery({ modelName }, filter, true),
    findById: (id) => new ModelQuery({ modelName }, { _id: String(id) }, true),
    countDocuments: async (filter = {}) => (await selectRows(modelName, filter)).length,
    exists: async (filter = {}) => {
      const row = (await selectRows(modelName, filter, { limit: 1 }))[0];
      return row ? { _id: String(row.id) } : null;
    },
    distinct: (field, filter = {}) => distinct(modelName, filter, field),
    createIndexes: async () => undefined,
    create: async (docs, options = {}) => {
      const list = Array.isArray(docs) ? docs : [docs];
      const client = options.session?.client ?? null;
      const write = async (transactionClient) => Promise.all(list.map((doc) => insertRecord(modelName, doc, transactionClient).then((row) => asDocument(row))));
      const inserted = client ? await write(client) : await withTransaction(write);
      return Array.isArray(docs) ? inserted : inserted[0];
    },
    findOneAndUpdate: (filter, update, options = {}) => findOneAndUpdate(modelName, filter, update, options),
    updateOne: (filter, update, options = {}) => updateOne(modelName, filter, update, options),
    bulkWrite: async (operations, options = {}) => {
      if (modelName === 'SourcePage' || modelName === 'RegulatoryReviewItem') {
        const now = timestamp();
        const records = operations.map(({ updateOne }) => {
          const payload = applyUpdate({}, updateOne.update, true);
          payload.createdAt ??= now;
          payload.updatedAt = now;
          const id = String(payload._id ?? newId());
          delete payload._id;
          return { id, data: payload, createdAt: payload.createdAt, updatedAt: payload.updatedAt };
        });
        if (!records.length) return { acknowledged: true, upsertedCount: 0, modifiedCount: 0 };
        const conflict = modelName === 'SourcePage'
          ? `ON CONFLICT (source_document_ref, pdf_page_number) WHERE model = 'SourcePage'
             DO UPDATE SET data = jsonb_set(
               jsonb_set(EXCLUDED.data, '{createdAt}', COALESCE(buildrule_records.data->'createdAt', EXCLUDED.data->'createdAt')),
               '{updatedAt}', to_jsonb(now())
             ), updated_at = now()`
          : `ON CONFLICT (source_candidate_key) WHERE model = 'RegulatoryReviewItem' DO NOTHING`;
        const result = await db.query(`
          INSERT INTO buildrule_records (model, id, data, created_at, updated_at)
          SELECT $2, (item->>'id')::uuid, item->'data',
            (item->>'createdAt')::timestamptz, (item->>'updatedAt')::timestamptz
          FROM jsonb_array_elements($1::jsonb) AS input(item)
          ${conflict}
          RETURNING (xmax = 0) AS inserted`, [JSON.stringify(records), modelName]);
        const insertedCount = result.rows.filter((row) => row.inserted).length;
        return {
          acknowledged: true,
          upsertedCount: insertedCount,
          modifiedCount: modelName === 'SourcePage' ? result.rowCount - insertedCount : 0,
        };
      }
      let upsertedCount = 0;
      let modifiedCount = 0;
      const write = async (client) => {
        for (const operation of operations) {
          const { filter, update, upsert } = operation.updateOne;
          const before = await selectRows(modelName, filter, { client, limit: 1 });
          try {
            await findOneAndUpdate(modelName, filter, update, { upsert, new: true, session: { client } });
            if (before.length) modifiedCount += 1;
            else if (upsert) upsertedCount += 1;
          } catch (error) {
            if (options.ordered !== false) throw error;
          }
        }
      };
      await withTransaction(write);
      return { acknowledged: true, upsertedCount, modifiedCount };
    },
    collection: { indexes: async () => [{ name: 'buildrule_records_pkey' }, { name: 'source_pages_document_page_unique' }] },
  };
}

function userMatches(user, filter) {
  return matchesFilter(user, filter);
}

export const UserModel = {
  modelName: 'User',
  async _all() {
    const result = await db.query('SELECT id, auth_user_id, name, email, role, is_active, last_login_at, created_at, updated_at FROM app_users');
    return result.rows.map((row) => ({ ...userRow(row).data, _id: row.id }));
  },
  find: (filter = {}) => new ModelQuery({ modelName: 'User' }, filter),
  findOne: (filter = {}) => new ModelQuery({ modelName: 'User' }, filter, true),
  findById: (id) => new ModelQuery({ modelName: 'User' }, { _id: String(id) }, true),
  async countDocuments(filter = {}) { return (await this._all()).filter((row) => userMatches(row, filter)).length; },
  async exists(filter = {}) {
    const row = (await this._all()).find((user) => userMatches(user, filter));
    return row ? { _id: row._id } : null;
  },
  createIndexes: async () => undefined,
  collection: { indexes: async () => [{ name: 'app_users_email_lower_unique' }] },
};

export function normalizeRole(role) {
  const normalized = String(role ?? '').toUpperCase();
  return USER_ROLES.has(normalized) ? normalized : 'GENERAL_USER';
}
