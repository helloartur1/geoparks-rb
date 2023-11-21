import { IJwtTokenPayload } from "../interfaces/token-payload.interface";

export const decodeTokenPayload = (token: string): IJwtTokenPayload => {
    var base64Url = token.split('.')[1];
      var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
  
      return JSON.parse(jsonPayload);
  }
  
  export const isTokenExpired = (tokenPayload: IJwtTokenPayload): boolean => {
    const currentTime = new Date();
    const expiredTime = tokenPayload.exp;
    if (currentTime.getTime() < expiredTime * 1000) {
      return false;
    }
    return true;
  }
  