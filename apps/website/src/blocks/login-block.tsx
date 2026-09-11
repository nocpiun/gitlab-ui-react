import { useState } from "react";
import {
  GlButton,
  GlFormCheckbox,
  GlFormInput,
  GlFormPasswordInput,
  GlLink,
} from "gitlab-ui-react";
import { ShowcaseCard } from "../components/showcase-card";
import { type Locale } from "../i18n/config";
import { showcaseContent } from "../i18n/showcase-content";

type LoginBlockProps = {
  locale: Locale;
};

export function LoginBlock({ locale }: LoginBlockProps) {
  const content = showcaseContent[locale].login;
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
            {content.email}
          </label>
          <GlFormInput
            autoComplete="email"
            id="login-email"
            name="email"
            onValueChange={(value) => setEmail(String(value))}
            placeholder={content.emailPlaceholder}
            required
            type="email"
            value={email} />
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-4">
            <label className="m-0 text-sm font-semibold text-default" htmlFor="login-password">
              {content.password}
            </label>
            <GlLink className="text-sm" href="#">{content.forgotPassword}</GlLink>
          </div>
          <GlFormPasswordInput
            autoComplete="current-password"
            hideLabel={content.hidePassword}
            id="login-password"
            name="password"
            onValueChange={(value) => setPassword(String(value))}
            placeholder={content.passwordPlaceholder}
            revealLabel={content.revealPassword}
            required
            value={password} />
        </div>

        <GlFormCheckbox
          checked={rememberMe}
          name="remember-me"
          onCheckedChange={setRememberMe}>
          {content.rememberMe}
        </GlFormCheckbox>

        <GlButton block type="submit" variant="confirm">
          {content.signIn}
        </GlButton>
      </form>

      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-neutral-500" />
        <span className="text-xs font-semibold uppercase tracking-wide text-subtle">{content.or}</span>
        <span className="h-px flex-1 bg-neutral-500" />
      </div>

      <GlButton block icon={locale === "en" ? "google" : undefined}>
        {content.socialSignIn}
      </GlButton>

      <p className="m-0 text-center text-sm text-subtle">
        {content.newHere} <GlLink href="#">{content.createAccount}</GlLink>
      </p>
    </ShowcaseCard>
  );
}
