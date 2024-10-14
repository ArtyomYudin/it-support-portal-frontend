export class AvayaCDR {
  public callStart: string;

  public callDuration: number;

  public callingNumber: string;

  public callingName: string;

  public calledNumber: string;

  public calledName: string;

  public callCode: string;
}
export interface IAvayaCDR {
  total: number;
  results: AvayaCDR[];
}
