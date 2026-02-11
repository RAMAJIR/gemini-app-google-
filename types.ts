
export interface SupplierRow {
  "Needs for Review": string;
  "LS Supplier Name": string;
  "DBM Supplier Name": string;
  [key: string]: string;
}

export interface GroundingSource {
  title?: string;
  uri?: string;
}

export interface MatchResult {
  id: string;
  lsName: string;
  dbmName: string;
  isMatch: boolean;
  domainLS: string;
  domainDBM: string;
  reasoning: string;
  sources: GroundingSource[];
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface AnalysisResponse {
  isMatch: boolean;
  domainLS: string;
  domainDBM: string;
  reasoning: string;
}
