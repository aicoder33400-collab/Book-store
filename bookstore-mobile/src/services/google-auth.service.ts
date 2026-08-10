import { authService } from './auth.service';
import Constants from 'expo-constants';

const GOOGLE_CLIENT_ID = Constants.expoConfig?.extra?.googleClientId || '';

export class GoogleAuthService {
  static async login(): Promise<any> {
    // 🔥 Vérifier si on a déjà un token (retour de Google)
    const hash = window.location.hash;
    console.log('📱 Hash:', hash);
    
    if (hash && hash.includes('id_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const googleToken = params.get('id_token');
      
      if (googleToken) {
        console.log('✅ Token trouvé !');
        window.history.pushState('', document.title, window.location.pathname);
        
        const checkResult = await authService.checkGoogleUser(googleToken);
        console.log('📱 Résultat check:', checkResult);

        if (!checkResult.exists || checkResult.needsProfile) {
          return {
            needsProfile: true,
            googleToken: googleToken,
            userData: {
              email: checkResult.email,
              name: checkResult.name,
              avatar: checkResult.avatar,
            }
          };
        }

        const result = await authService.loginWithGoogle(googleToken);
        return {
          needsProfile: false,
          user: result.user,
          token: result.token,
        };
      }
    }

    // 🔥 Pas de token → rediriger vers Google AVEC nonce
    const redirectUri = 'http://localhost:8081';
    const nonce = Date.now().toString();
    
    const authUrl = 
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${redirectUri}&` +
      `response_type=id_token&` +
      `scope=openid%20profile%20email&` +
      `prompt=select_account&` +
      `nonce=${nonce}`;

    console.log('🔗 Redirection vers Google avec nonce:', nonce);
    window.location.href = authUrl;
    
    return { needsProfile: false };
  }

  static async completeProfile(googleToken: string, data: {
    firstName: string;
    lastName: string;
    phone: string;
    age: number;
    commune: string;
  }) {
    const result = await authService.completeGoogleProfile(googleToken, data);
    return result;
  }
}