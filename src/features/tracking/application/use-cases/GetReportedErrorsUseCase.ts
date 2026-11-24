import { SentryIssueSummary } from '../../domain/entities/TrackingStats';
import { IErrorMonitorRepository } from '../../domain/repositories/IErrorMonitorRepository';

export class GetReportedErrorsUseCase {
  constructor(private readonly errorMonitorRepo: IErrorMonitorRepository) {}

  async execute(): Promise<SentryIssueSummary[]> {
    return this.errorMonitorRepo.getReportedIssues();
  }
}
