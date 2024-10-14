export class UserRequest {
  public id: number;

  public creationDate: string;

  public changeDate: string;

  public requestNumber: string;

  public initiator: string;

  public department: string;

  public executor: { userPrincipalName: string; name: string };

  public service: string;

  public topic: string;

  public description: string;

  public status: { id: number; name: string; icon: string };

  public priority: { id: number; name: string; color: string };

  public deadline: string;
}

export interface IUserRequest {
  total: number;
  results: UserRequest[];
}
