import { authService } from './auth.service';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const GOOGLE_CLIENT_ID = Constants.expoConfig?.extra?.googleClientId || '';

// URL du backend (production vs dev)
const BACKEND_URL = Platform.OS === 'web' && typeof window !== 'undefined'
  ? window.location.origin
  : (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000');

export class GoogleAuthService {
  static async login(): Promise<any> {
    // 🔥 Vérifier si on revient de Google (token dans le hash)
    const hash = window.location.hash;
    console.log('📱 Hash:', hash);

    if (hash && hash.includes('id_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const googleToken = params.get('id_token');

      if (googleToken) {
        console.log('✅ Token trouvé !');
        window.history.pushState('', document.title, window.location.pathname);

        const checkResult = await authService.checkGoogleUser(googleToken);

        if (!checkResult.exists || checkResult.needsProfile) {
          return {
            needsProfile: true,
            googleToken,
            userData: {
              email: checkResult.email,
              name: checkResult.name,
              avatar: checkResult.avatar,
            },
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

    // 🔥 Redirection vers Google (flux implicit id_token)
    // ✅ Redirect URI = le frontend lui-même (retour direct)
    const redirectUri = `${window.location.origin}/`;
    const nonce = Date.now().toString();

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=id_token&` +
      `scope=${encodeURIComponent('openid profile email')}&` +
      `prompt=select_account&` +
      `nonce=${nonce}`;

    console.log('🔗 Redirection vers Google, redirectUri:', redirectUri);
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
    return await authService.completeGoogleProfile(googleToken, data);
  }
}
