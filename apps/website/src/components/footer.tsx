import { GlLink } from "gitlab-ui-react";
import { githubRepoUrl, storybookUrl } from "../global";
import { formatTemplate, localizedPath, type Locale } from "../i18n/config";
import { siteMessages } from "../i18n/messages";

type FooterProps = {
  locale: Locale;
};

export function Footer({ locale }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const messages = siteMessages[locale];

  return (
    <footer className="border-t border-section bg-subtle">
      <div className="mx-auto flex max-w-[96rem] flex-col gap-6 px-6 py-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div className="min-w-0">
          <GlLink className="inline-flex items-center gap-2 font-semibold text-heading" href={localizedPath(locale)} variant="unstyled">
            GitLab UI React
          </GlLink>
          <p className="mb-0 mt-2 text-sm text-subtle">
            {messages.footer.tagline}
          </p>
          <nav aria-label={messages.footer.navigationLabel} className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <GlLink
              aria-label={formatTemplate(messages.footer.externalLinkLabel, { name: "GitHub" })}
              href={githubRepoUrl}
              rel="noopener noreferrer"
              showExternalIcon
              target="_blank">
              GitHub
            </GlLink>
            <GlLink
              aria-label={formatTemplate(messages.footer.externalLinkLabel, { name: "Storybook" })}
              href={storybookUrl}
              rel="noopener noreferrer"
              showExternalIcon
              target="_blank">
              Storybook
            </GlLink>
          </nav>
        </div>

        <div className="text-sm text-subtle *:m-0 lg:text-right">
          <p>© {currentYear} NriotHrreion. <GlLink href="https://github.com/nocpiun/gitlab-ui-react/blob/main/LICENSE" target="_blank">MIT licensed</GlLink>.</p>
          <p>{messages.footer.affiliation}</p>
        </div>
      </div>
    </footer>
  );
}
