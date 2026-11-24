import { SentryIssueSummary } from '../entities/TrackingStats';

export interface IErrorMonitorRepository {
  getReportedIssues(): Promise<SentryIssueSummary[]>;
}
