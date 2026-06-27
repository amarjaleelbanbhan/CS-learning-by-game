export type { CurriculumConcept, ConceptComplexityFactors } from './concepts.js';
export {
  CONCEPTS,
  toConceptUnlockNodes,
  conceptById,
  conceptChildren,
  v1Concepts,
  futureConcepts,
} from './concepts.js';

export type { QuestionTypeId, QuestionTypeMeta } from './question-types.js';
export { QUESTION_TYPES, questionTypeById } from './question-types.js';

export type { QuestionFormatId, QuestionFormatMeta } from './question-formats.js';
export { QUESTION_FORMATS, questionFormatById } from './question-formats.js';

export type { CommonMistake } from './common-mistakes.js';
export { COMMON_MISTAKES, mistakesForConcept } from './common-mistakes.js';

export type { Misconception } from './misconceptions.js';
export { MISCONCEPTIONS, misconceptionsForConcept } from './misconceptions.js';

export type { DifficultyTier, DifficultyFactors } from './difficulty-model.js';
export { computeDifficultyTier, computeDifficultyScore, tierRank } from './difficulty-model.js';

export type { UniversitySyllabusMapping, MappingConfidence } from './university-mappings.js';
export {
  UNIVERSITY_MAPPINGS,
  mappingById,
  universitiesCoveringConcept,
} from './university-mappings.js';

export type { CurriculumMission, MissionVariation, MissionVariationTier } from './missions.js';
export {
  MISSIONS,
  toMissionUnlockNodes,
  missionById,
  missionsForConcept,
  liveMissions,
  designedMissions,
  v1Missions,
} from './missions.js';

export {
  prerequisiteDepth,
  conceptTier,
  missionTier,
  missionCountForConcept,
  bossAvailableForConcept,
  misconceptionCountForConcept,
  difficultyDistribution,
  v1ConceptCoveragePercentage,
  conceptsWithoutMissions,
  conceptsWithoutMisconceptions,
  curriculumHealthScore,
  misconceptionStats,
} from './curriculum-analytics.js';
