import { FormEvent, useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import styles from "../styles/Home.module.css";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { isAuthenticated, signIn } = useContext(AuthContext);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const data = { email, password };

    await signIn(data);
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          required
        />

        <button>Login</button>
      </form>
    </div>
  );
}
