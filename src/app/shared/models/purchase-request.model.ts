export class PurchaseRequest {
  public id: number;

  public date: string;

  public authorDisplayName: string;

  public authorDepartmentName: string;

  public responsibleDisplayName: string;

  public purchaseTarget: { id: number; target: string };

  public purchaseReason: string;

  public statusId: number;
}
