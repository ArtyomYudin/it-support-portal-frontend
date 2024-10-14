export class VpnSession {
  public sessionStart: string;

  public node: string;

  public user: string;

  public displayName: string;

  public type: string;

  public duration: string;

  public clientIP: string;

  public byteXmt: number;

  public byteRcv: number;

  public disconnectReason: string;
}
export interface IVpnSession {
  total: number;
  results: VpnSession[];
}
