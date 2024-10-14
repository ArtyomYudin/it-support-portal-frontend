export class AuthUser {
  //public userPrincipalName: string;
  //public userDisplayName: string;
  //public userPhoto?: string;
  //public accessRole?: string;
  //public token: string;

  id: number;
  username: string;
  password?: string;
  firstName: string;
  lastName: string;
  token?: string;
  refreshToken?: string;
}
