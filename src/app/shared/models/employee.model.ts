export class Employee {
  public userPrincipalName: string;

  public displayName: string;

  public departmentName: string;

  public departmentId?: number;

  public positionName: string;

  public departmentManagerName?: string;

  public directionManagerName?: string;

  public thumbnailPhoto?: string;
}
export interface IEmployee {
  total: number;
  results: Employee[];
}
