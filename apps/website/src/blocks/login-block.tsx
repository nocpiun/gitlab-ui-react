import { useState } from "react";
import {
  GlButton,
  GlFormCheckbox,
  GlFormInput,
  GlFormPasswordInput,
  GlLink,
} from "gitlab-ui-react";
import { ShowcaseCard } from "../components/showcase-card";

export function LoginBlock() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  return (
    <ShowcaseCard className="flex flex-col gap-5">
      <form
        className="grid gap-4"
        onSubmit={(event) => event.preventDefault()}>
        <div className="grid gap-2">
          <label className="m-0 text-sm font-semibold text-default" htmlFor="login-email">
            Email address
          </label>
          <GlFormInput
            autoComplete="email"
            id="login-email"
            name="email"
            onInput={(value) => setEmail(String(value))}
            placeholder="you@example.com"
            required
            type="email"
            value={email} />
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-4">
            <label className="m-0 text-sm font-semibold text-default" htmlFor="login-password">
              Password
            </label>
            <GlLink className="text-sm" href="#">Forgot password?</GlLink>
          </div>
          <GlFormPasswordInput
            autoComplete="current-password"
            id="login-password"
            name="password"
            onInput={(value) => setPassword(String(value))}
            placeholder="Enter your password"
            required
            value={password} />
        </div>

        <GlFormCheckbox
          checked={rememberMe}
          name="remember-me"
          onInput={(checked) => setRememberMe(Boolean(checked))}>
          Remember me
        </GlFormCheckbox>

        <GlButton block type="submit" variant="confirm">
          Sign in
        </GlButton>
      </form>

      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-neutral-500" />
        <span className="text-xs font-semibold uppercase tracking-wide text-subtle">or</span>
        <span className="h-px flex-1 bg-neutral-500" />
      </div>

      <GlButton block icon="google">
        Continue with Google
      </GlButton>

      <p className="m-0 text-center text-sm text-subtle">
        New here? <GlLink href="#">Create an account</GlLink>
      </p>
    </ShowcaseCard>
  );
}
