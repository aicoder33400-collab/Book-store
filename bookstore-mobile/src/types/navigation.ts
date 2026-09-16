export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  CompleteProfileRedirect: {
    googleToken?: string;
    email?: string;
    name?: string;
    avatar?: string;
  };
  CompleteProfile: {
    googleToken: string;
    email: string;
    name: string;
    avatar?: string;
  };
  Callback: undefined;
  BookDetail: { bookId: string };
  Register: undefined;
  ForgotPassword: undefined;
};