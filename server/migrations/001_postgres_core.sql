CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY,
  auth_user_id text UNIQUE,
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 120),
  email text NOT NULL,
  role text NOT NULL DEFAULT 'GENERAL_USER'
    CHECK (role IN ('GENERAL_USER', 'PROFESSIONAL_USER', 'REVIEWER', 'ADMIN')),
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  terms_accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS app_users_email_lower_unique ON app_users (lower(email));
CREATE INDEX IF NOT EXISTS app_users_role_active_idx ON app_users (role, is_active);

CREATE TABLE IF NOT EXISTS buildrule_records (
  model text NOT NULL CHECK (model IN (
    'State', 'Authority', 'RegulationSet', 'SourceDocument', 'SourcePage',
    'Chapter', 'Regulation', 'RegulatoryNode', 'RegulatoryTable',
    'RegulatoryParameter', 'Amendment', 'Project', 'Calculation',
    'ComplianceCheck', 'GeneratedReport', 'RegulatoryReviewItem',
    'ReviewAuditEvent', 'Definition', 'RegulatoryCrossReference'
  )),
  id uuid NOT NULL,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,

  state_model text GENERATED ALWAYS AS (CASE WHEN data ? 'stateId' THEN 'State' END) STORED,
  state_ref uuid GENERATED ALWAYS AS (NULLIF(data->>'stateId', '')::uuid) STORED,
  regulation_set_model text GENERATED ALWAYS AS (CASE WHEN data ? 'regulationSetId' THEN 'RegulationSet' END) STORED,
  regulation_set_ref uuid GENERATED ALWAYS AS (NULLIF(data->>'regulationSetId', '')::uuid) STORED,
  source_document_model text GENERATED ALWAYS AS (CASE WHEN data ? 'sourceDocumentId' THEN 'SourceDocument' END) STORED,
  source_document_ref uuid GENERATED ALWAYS AS (NULLIF(data->>'sourceDocumentId', '')::uuid) STORED,
  source_page_model text GENERATED ALWAYS AS (CASE WHEN data ? 'sourcePageId' THEN 'SourcePage' END) STORED,
  source_page_ref uuid GENERATED ALWAYS AS (NULLIF(data->>'sourcePageId', '')::uuid) STORED,
  pdf_page_number integer GENERATED ALWAYS AS (NULLIF(data->>'pdfPageNumber', '')::integer) STORED,
  source_candidate_key text GENERATED ALWAYS AS (NULLIF(data->>'sourceCandidateKey', '')) STORED,
  review_item_model text GENERATED ALWAYS AS (CASE WHEN data ? 'reviewItemId' THEN 'RegulatoryReviewItem' END) STORED,
  review_item_ref uuid GENERATED ALWAYS AS (NULLIF(data->>'reviewItemId', '')::uuid) STORED,
  regulation_model text GENERATED ALWAYS AS (CASE WHEN data ? 'regulationId' THEN 'Regulation' END) STORED,
  regulation_ref uuid GENERATED ALWAYS AS (NULLIF(data->>'regulationId', '')::uuid) STORED,
  chapter_model text GENERATED ALWAYS AS (CASE WHEN data ? 'chapterId' THEN 'Chapter' END) STORED,
  chapter_ref uuid GENERATED ALWAYS AS (NULLIF(data->>'chapterId', '')::uuid) STORED,
  table_model text GENERATED ALWAYS AS (CASE WHEN data ? 'tableId' THEN 'RegulatoryTable' END) STORED,
  table_ref uuid GENERATED ALWAYS AS (NULLIF(data->>'tableId', '')::uuid) STORED,
  source_regulation_ref uuid GENERATED ALWAYS AS (NULLIF(data->>'sourceRegulationId', '')::uuid) STORED,
  source_regulation_model text GENERATED ALWAYS AS (CASE WHEN data ? 'sourceRegulationId' THEN 'Regulation' END) STORED,
  target_regulation_ref uuid GENERATED ALWAYS AS (NULLIF(data->>'targetRegulationId', '')::uuid) STORED,
  target_regulation_model text GENERATED ALWAYS AS (CASE WHEN data ? 'targetRegulationId' THEN 'Regulation' END) STORED,
  parent_model text GENERATED ALWAYS AS (CASE WHEN data ? 'parentId' THEN 'RegulatoryNode' END) STORED,
  parent_ref uuid GENERATED ALWAYS AS (NULLIF(data->>'parentId', '')::uuid) STORED,
  actor_ref uuid GENERATED ALWAYS AS (NULLIF(data->>'actorId', '')::uuid) STORED,
  assigned_reviewer_ref uuid GENERATED ALWAYS AS (NULLIF(data->>'assignedReviewerId', '')::uuid) STORED,
  approved_by_ref uuid GENERATED ALWAYS AS (NULLIF(data->>'approvedById', '')::uuid) STORED,
  provenance_reviewer_ref uuid GENERATED ALWAYS AS (NULLIF(data #>> '{verificationProvenance,reviewedById}', '')::uuid) STORED,
  provenance_review_model text GENERATED ALWAYS AS (CASE WHEN data #> '{verificationProvenance,reviewItemId}' IS NOT NULL THEN 'RegulatoryReviewItem' END) STORED,
  provenance_review_ref uuid GENERATED ALWAYS AS (NULLIF(data #>> '{verificationProvenance,reviewItemId}', '')::uuid) STORED,
  provenance_audit_model text GENERATED ALWAYS AS (
    CASE WHEN data #> '{verificationProvenance,auditEventId}' IS NOT NULL THEN 'ReviewAuditEvent' END
  ) STORED,
  provenance_audit_ref uuid GENERATED ALWAYS AS (NULLIF(data #>> '{verificationProvenance,auditEventId}', '')::uuid) STORED,
  canonical_model text GENERATED ALWAYS AS (
    CASE data->>'canonicalRecordType'
      WHEN 'Chapter' THEN 'Chapter' WHEN 'Regulation' THEN 'Regulation'
      WHEN 'RegulatoryNode' THEN 'RegulatoryNode' WHEN 'RegulatoryTable' THEN 'RegulatoryTable'
      WHEN 'Definition' THEN 'Definition' WHEN 'RegulatoryParameter' THEN 'RegulatoryParameter'
      WHEN 'RegulatoryCrossReference' THEN 'RegulatoryCrossReference'
      ELSE NULL
    END
  ) STORED,
  canonical_ref uuid GENERATED ALWAYS AS (NULLIF(data->>'canonicalRecordId', '')::uuid) STORED,

  PRIMARY KEY (model, id),
  FOREIGN KEY (state_model, state_ref) REFERENCES buildrule_records(model, id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (regulation_set_model, regulation_set_ref) REFERENCES buildrule_records(model, id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (source_document_model, source_document_ref) REFERENCES buildrule_records(model, id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (source_page_model, source_page_ref) REFERENCES buildrule_records(model, id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (review_item_model, review_item_ref) REFERENCES buildrule_records(model, id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (regulation_model, regulation_ref) REFERENCES buildrule_records(model, id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (chapter_model, chapter_ref) REFERENCES buildrule_records(model, id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (table_model, table_ref) REFERENCES buildrule_records(model, id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (source_regulation_model, source_regulation_ref) REFERENCES buildrule_records(model, id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (target_regulation_model, target_regulation_ref) REFERENCES buildrule_records(model, id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (parent_model, parent_ref) REFERENCES buildrule_records(model, id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (actor_ref) REFERENCES app_users(id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (assigned_reviewer_ref) REFERENCES app_users(id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (approved_by_ref) REFERENCES app_users(id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (provenance_reviewer_ref) REFERENCES app_users(id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (provenance_review_model, provenance_review_ref) REFERENCES buildrule_records(model, id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (provenance_audit_model, provenance_audit_ref) REFERENCES buildrule_records(model, id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (canonical_model, canonical_ref) REFERENCES buildrule_records(model, id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS buildrule_records_data_gin ON buildrule_records USING gin (data jsonb_path_ops);
CREATE INDEX IF NOT EXISTS buildrule_records_model_created ON buildrule_records (model, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS states_country_code_unique ON buildrule_records ((data->>'countryCode'), (data->>'code')) WHERE model = 'State';
CREATE UNIQUE INDEX IF NOT EXISTS authorities_state_code_unique ON buildrule_records (state_ref, upper(data->>'code')) WHERE model = 'Authority' AND NULLIF(data->>'code', '') IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS regulation_sets_identity_unique ON buildrule_records ((data->>'countryCode'), state_ref, (data->>'framework'), (data->>'version')) WHERE model = 'RegulationSet';
CREATE UNIQUE INDEX IF NOT EXISTS source_documents_set_part_unique ON buildrule_records (regulation_set_ref, (data->>'part')) WHERE model = 'SourceDocument';
CREATE UNIQUE INDEX IF NOT EXISTS source_documents_sha_unique ON buildrule_records ((lower(data->>'sha256'))) WHERE model = 'SourceDocument';
CREATE UNIQUE INDEX IF NOT EXISTS source_pages_document_page_unique ON buildrule_records (source_document_ref, pdf_page_number) WHERE model = 'SourcePage';
CREATE INDEX IF NOT EXISTS source_pages_document_page_idx ON buildrule_records (source_document_ref, pdf_page_number) WHERE model = 'SourcePage';
CREATE INDEX IF NOT EXISTS source_pages_review_candidates_idx ON buildrule_records (model, source_document_ref) WHERE model = 'SourcePage';
CREATE UNIQUE INDEX IF NOT EXISTS chapters_identity_unique ON buildrule_records (regulation_set_ref, (data->>'part'), (data->>'originalNumber')) WHERE model = 'Chapter';
CREATE INDEX IF NOT EXISTS chapters_order_idx ON buildrule_records (regulation_set_ref, (data->>'part'), ((data->>'sequence')::numeric)) WHERE model = 'Chapter';
CREATE UNIQUE INDEX IF NOT EXISTS regulations_identity_unique ON buildrule_records (regulation_set_ref, (data->>'originalNumber')) WHERE model = 'Regulation';
CREATE INDEX IF NOT EXISTS regulations_order_idx ON buildrule_records (chapter_ref, ((data->>'sequence')::numeric)) WHERE model = 'Regulation';
CREATE INDEX IF NOT EXISTS regulations_verification_idx ON buildrule_records ((data->>'verificationStatus'), regulation_set_ref) WHERE model = 'Regulation';
CREATE UNIQUE INDEX IF NOT EXISTS review_items_candidate_key_unique ON buildrule_records (source_candidate_key) WHERE model = 'RegulatoryReviewItem';
CREATE INDEX IF NOT EXISTS review_items_queue_idx ON buildrule_records ((data->>'workflowStatus'), (data->>'recordType'), source_document_ref, pdf_page_number) WHERE model = 'RegulatoryReviewItem';
CREATE INDEX IF NOT EXISTS review_items_assignee_idx ON buildrule_records (assigned_reviewer_ref, (data->>'workflowStatus')) WHERE model = 'RegulatoryReviewItem';
CREATE INDEX IF NOT EXISTS audit_events_item_created_idx ON buildrule_records (review_item_ref, created_at) WHERE model = 'ReviewAuditEvent';
CREATE INDEX IF NOT EXISTS regulatory_parameters_key_status_idx ON buildrule_records (regulation_set_ref, (data->>'key'), (data->>'verificationStatus')) WHERE model = 'RegulatoryParameter';
CREATE UNIQUE INDEX IF NOT EXISTS amendments_identity_unique ON buildrule_records (regulation_set_ref, (data->>'amendmentIdentifier')) WHERE model = 'Amendment';
CREATE UNIQUE INDEX IF NOT EXISTS cross_references_identity_unique ON buildrule_records (regulation_ref, (data->>'targetRegulationId')) WHERE model = 'RegulatoryCrossReference';

CREATE TABLE IF NOT EXISTS role_change_audit (
  id uuid PRIMARY KEY,
  actor_user_id uuid REFERENCES app_users(id),
  actor_label text NOT NULL DEFAULT '',
  target_user_id uuid NOT NULL REFERENCES app_users(id),
  action text NOT NULL CHECK (action IN ('ROLE_CHANGED', 'ACCOUNT_STATUS_CHANGED', 'ADMIN_PROVISIONED')),
  old_value text,
  new_value text NOT NULL,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS role_change_audit_target_created_idx ON role_change_audit(target_user_id, created_at DESC);

CREATE OR REPLACE FUNCTION protect_review_and_verified_records() RETURNS trigger AS $$
DECLARE
  locators jsonb;
  page_id text;
  provenance jsonb;
  approval_event jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.model = 'ReviewAuditEvent' THEN
      RAISE EXCEPTION 'Review audit events are append-only';
    END IF;
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.model = 'ReviewAuditEvent' THEN
    RAISE EXCEPTION 'Review audit events are append-only';
  END IF;
  IF NEW.model <> 'ReviewAuditEvent' OR NEW.data->>'toStatus' <> 'APPROVED' THEN
    RETURN NEW;
  END IF;
  IF NEW.data->>'action' <> 'APPROVED'
     OR NEW.data->>'fromStatus' <> 'IN_REVIEW'
     OR NULLIF(NEW.data->>'note', '') IS NULL
     OR NEW.data->>'canonicalRecordType' IS NULL
     OR NEW.data->>'canonicalRecordId' IS NULL THEN
    RAISE EXCEPTION 'An approval audit event requires reviewer action, note, and canonical record reference';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM app_users u WHERE u.id = NULLIF(NEW.data->>'actorId', '')::uuid AND u.is_active AND u.role IN ('REVIEWER', 'ADMIN')) THEN
    RAISE EXCEPTION 'Approval audit event requires an active reviewer or administrator';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION require_verified_record_evidence() RETURNS trigger AS $$
DECLARE
  provenance jsonb;
  locators jsonb;
  page_id text;
  audit jsonb;
BEGIN
  IF NEW.data->>'verificationStatus' IS DISTINCT FROM 'VERIFIED' THEN
    RETURN NEW;
  END IF;
  provenance := NEW.data->'verificationProvenance';
  IF jsonb_typeof(provenance) <> 'object'
     OR NULLIF(provenance->>'reviewItemId', '') IS NULL
     OR NULLIF(provenance->>'reviewedById', '') IS NULL
     OR NULLIF(provenance->>'approvedAt', '') IS NULL
     OR NULLIF(provenance->>'auditEventId', '') IS NULL THEN
    RAISE EXCEPTION 'Verified records require reviewer, review item, timestamp, and audit provenance';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM app_users u WHERE u.id = (provenance->>'reviewedById')::uuid AND u.is_active AND u.role IN ('REVIEWER', 'ADMIN')) THEN
    RAISE EXCEPTION 'Verified records require an active reviewer';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM buildrule_records r
    WHERE r.model = 'RegulatoryReviewItem' AND r.id = (provenance->>'reviewItemId')::uuid
      AND r.data->>'workflowStatus' = 'APPROVED'
      AND r.data->>'canonicalRecordId' = NEW.id::text
      AND r.data->>'canonicalRecordType' = NEW.model
  ) THEN
    -- The review row is finalized after the canonical insert in the same
    -- transaction. Deferred constraint triggers validate this relation at commit.
    IF current_setting('buildrule.approval_transaction', true) IS DISTINCT FROM 'on' THEN
      RAISE EXCEPTION 'Verified records may only be created by the guarded review approval transaction';
    END IF;
  END IF;
  SELECT r.data INTO audit FROM buildrule_records r
   WHERE r.model = 'ReviewAuditEvent' AND r.id = (provenance->>'auditEventId')::uuid
     AND r.data->>'action' = 'APPROVED'
     AND r.data->>'toStatus' = 'APPROVED'
     AND r.data->>'canonicalRecordId' = NEW.id::text
     AND r.data->>'canonicalRecordType' = NEW.model
     AND r.data->>'actorId' = provenance->>'reviewedById';
  IF audit IS NULL THEN
    RAISE EXCEPTION 'Verified records require a matching approval audit event';
  END IF;
  IF jsonb_typeof(NEW.data->'sourcePageIds') <> 'array' OR jsonb_array_length(NEW.data->'sourcePageIds') = 0 THEN
    RAISE EXCEPTION 'Verified records require at least one source page';
  END IF;
  FOR page_id IN SELECT jsonb_array_elements_text(NEW.data->'sourcePageIds') LOOP
    IF NOT EXISTS (SELECT 1 FROM buildrule_records p WHERE p.model = 'SourcePage' AND p.id = page_id::uuid) THEN
      RAISE EXCEPTION 'Verified records must link to existing source page records';
    END IF;
  END LOOP;
  IF NEW.model = 'Chapter' THEN
    locators := CASE WHEN jsonb_typeof(NEW.data->'sourceLocator') = 'object' THEN jsonb_build_array(NEW.data->'sourceLocator') ELSE '[]'::jsonb END;
    IF NULLIF(NEW.data->>'originalNumber', '') IS NULL OR NULLIF(NEW.data->>'title', '') IS NULL OR NULLIF(NEW.data->>'originalText', '') IS NULL THEN
      RAISE EXCEPTION 'Verified chapters require original number, title, and wording';
    END IF;
  ELSE
    locators := NEW.data->'sourceLocators';
  END IF;
  IF jsonb_typeof(locators) <> 'array' OR jsonb_array_length(locators) = 0
     OR EXISTS (SELECT 1 FROM jsonb_array_elements(locators) l WHERE COALESCE((l->>'pdfPageStart')::integer, 0) < 1) THEN
    RAISE EXCEPTION 'Verified records require valid PDF page locators';
  END IF;
  IF NEW.model = 'Regulation' AND (NULLIF(NEW.data->>'originalNumber', '') IS NULL OR NULLIF(NEW.data->>'originalText', '') IS NULL OR NEW.data->>'parentResolution' = 'UNRESOLVED') THEN
    RAISE EXCEPTION 'Verified regulations require original number, wording, and a resolved parent decision';
  ELSIF NEW.model = 'RegulatoryNode' AND (NULLIF(NEW.data->>'originalLabel', '') IS NULL OR NULLIF(NEW.data->>'originalText', '') IS NULL) THEN
    RAISE EXCEPTION 'Verified regulatory nodes require original label and wording';
  ELSIF NEW.model = 'RegulatoryTable' AND (jsonb_array_length(COALESCE(NEW.data->'headers','[]'::jsonb)) = 0 OR jsonb_array_length(COALESCE(NEW.data->'rows','[]'::jsonb)) = 0 OR NEW.data->>'parentResolution' = 'UNRESOLVED') THEN
    RAISE EXCEPTION 'Verified tables require reviewed headers, rows, and a parent decision';
  ELSIF NEW.model = 'RegulatoryParameter' AND (
    NULLIF(NEW.data->>'key', '') IS NULL
    OR (NEW.data #>> '{value,kind}' IN ('number','range') AND NULLIF(NEW.data #>> '{value,unit}', '') IS NULL)
    OR (jsonb_array_length(COALESCE(NEW.data #> '{applicability,conditions}','[]'::jsonb)) = 0 AND COALESCE((NEW.data #>> '{applicability,conditionsExplicitlyAbsent}')::boolean, false) = false)
    OR NULLIF(NEW.data #>> '{applicability,sourceScopeStatement}', '') IS NULL
  ) THEN
    RAISE EXCEPTION 'Verified parameters require values, units, source scope, and explicit applicability conditions';
  ELSIF NEW.model = 'Definition' AND (NULLIF(NEW.data->>'term', '') IS NULL OR NULLIF(NEW.data->>'originalText', '') IS NULL OR NEW.data->>'parentResolution' = 'UNRESOLVED') THEN
    RAISE EXCEPTION 'Verified definitions require a term, wording, and parent decision';
  ELSIF NEW.model = 'RegulatoryCrossReference' AND (NULLIF(NEW.data->>'targetReferenceLabel', '') IS NULL OR NULLIF(NEW.data->>'originalText', '') IS NULL) THEN
    RAISE EXCEPTION 'Verified cross-references require a target label and source wording';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS buildrule_review_audit_guard ON buildrule_records;
CREATE TRIGGER buildrule_review_audit_guard
  BEFORE INSERT OR UPDATE OR DELETE ON buildrule_records
  FOR EACH ROW EXECUTE FUNCTION protect_review_and_verified_records();
DROP TRIGGER IF EXISTS buildrule_verified_evidence_guard ON buildrule_records;
CREATE TRIGGER buildrule_verified_evidence_guard
  BEFORE INSERT OR UPDATE ON buildrule_records
  FOR EACH ROW EXECUTE FUNCTION require_verified_record_evidence();

CREATE OR REPLACE FUNCTION prevent_role_audit_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Role change audit events are append-only';
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS role_change_audit_immutable ON role_change_audit;
CREATE TRIGGER role_change_audit_immutable
  BEFORE UPDATE OR DELETE ON role_change_audit
  FOR EACH ROW EXECUTE FUNCTION prevent_role_audit_mutation();
