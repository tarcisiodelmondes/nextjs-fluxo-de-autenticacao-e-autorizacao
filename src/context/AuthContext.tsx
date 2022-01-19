import Router from "next/router";
import { createContext, ReactNode, useEffect, useState } from "react";
import { destroyCookie, parseCookies, setCookie } from "nookies";
import { api } from "../services/apiClient";

type User = {
  email: string;
  permissions: string[];
  roles: string[];
};

type SignInCredentials = {
  email: string;
  password: string;
};

type AuthContextData = {
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => void;
  isAuthenticated: boolean;
  user: User;
};

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthContext = createContext({} as AuthContextData);

let authChannel: BroadcastChannel;

export function signOut() {
  destroyCookie(undefined, "nextAuth.token");
  destroyCookie(undefined, "nextAuth.refreshToken");

  authChannel.postMessage("signOut");

  Router.push("/");
}

export function AuthContextProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>();
  const isAuthenticated = !!user;

  useEffect(() => {
    authChannel = new BroadcastChannel("auth");

    authChannel.onmessage = (message) => {
      switch (message.data) {
        case "signOut":
          Router.push("/");
          break;

        case "signIn":
          Router.push("/dashboard");
          break;

        default:
          break;
      }
    };
  }, []);

  useEffect(() => {
    const { "nextAuth.token": token } = parseCookies();

    if (token) {
      api
        .get("/me")
        .then((response) => {
          const { permissions, roles, email } = response.data;

          setUser({ email, permissions, roles });
        })
        .catch(() => signOut());
    }
  }, []);

  async function signIn({ email, password }: SignInCredentials) {
    try {
      const { data } = await api.post("sessions", {
        email,
        password,
      });

      const { permissions, roles, token, refreshToken } = data;

      setCookie(undefined, "nextAuth.token", token, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });
      setCookie(undefined, "nextAuth.refreshToken", refreshToken, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });

      setUser({
        email,
        permissions,
        roles,
      });

      api.defaults.headers["Authorization"] = `Bearer ${token}`;

      authChannel.postMessage("signOut");

      Router.push("/dashboard");
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, signIn, user, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
