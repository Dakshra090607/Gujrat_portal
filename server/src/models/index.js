import { defineModel, UserModel } from '../db/model-store.js';

// Regulatory source records retain flexible, source-specific payloads in JSONB.
// The PostgreSQL migration supplies typed foreign-key columns, uniqueness,
// review provenance guards, and database-managed audit immutability.
export const User = UserModel;
export const State = defineModel('State');
export const Authority = defineModel('Authority');
export const RegulationSet = defineModel('RegulationSet');
export const SourceDocument = defineModel('SourceDocument');
export const SourcePage = defineModel('SourcePage');
export const Chapter = defineModel('Chapter');
export const Regulation = defineModel('Regulation');
export const RegulatoryNode = defineModel('RegulatoryNode');
export const RegulatoryTable = defineModel('RegulatoryTable');
export const RegulatoryParameter = defineModel('RegulatoryParameter');
export const Amendment = defineModel('Amendment');
export const Project = defineModel('Project');
export const Calculation = defineModel('Calculation');
export const ComplianceCheck = defineModel('ComplianceCheck');
export const GeneratedReport = defineModel('GeneratedReport');
export const RegulatoryReviewItem = defineModel('RegulatoryReviewItem');
export const ReviewAuditEvent = defineModel('ReviewAuditEvent');
export const Definition = defineModel('Definition');
export const RegulatoryCrossReference = defineModel('RegulatoryCrossReference');

export const models = {
  State,
  Authority,
  RegulationSet,
  SourceDocument,
  SourcePage,
  Chapter,
  Regulation,
  RegulatoryNode,
  RegulatoryTable,
  RegulatoryParameter,
  Amendment,
  Project,
  Calculation,
  ComplianceCheck,
  GeneratedReport,
  RegulatoryReviewItem,
  ReviewAuditEvent,
  Definition,
  RegulatoryCrossReference,
};

export const VERIFICATION_STATUSES = ['EXTRACTED', 'NEEDS_REVIEW', 'VERIFIED', 'AMENDED', 'SUPERSEDED', 'INCOMPLETE'];
