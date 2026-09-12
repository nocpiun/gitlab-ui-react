import { GlBadge } from "gitlab-ui-react/badge";
import { GlButton } from "gitlab-ui-react/button";
import { GlButtonGroup } from "gitlab-ui-react/button-group";
import {
  GlDisclosureDropdown,
  GlDisclosureDropdownContent,
  GlDisclosureDropdownGroup,
  GlDisclosureDropdownItem,
  GlDisclosureDropdownTrigger,
} from "gitlab-ui-react/disclosure-dropdown";
import { GlFormCheckbox } from "gitlab-ui-react/form-checkbox";
import { GlFormInput } from "gitlab-ui-react/form-input";
import { GlFormRadio } from "gitlab-ui-react/form-radio";
import { GlFormTextarea } from "gitlab-ui-react/form-textarea";
import {
  GlModal,
  GlModalClose,
  GlModalContent,
  GlModalFooter,
  GlModalHeader,
  GlModalTitle,
  GlModalTrigger,
} from "gitlab-ui-react/modal";
import { GlToggle } from "gitlab-ui-react/toggle";
import { ShowcaseCard } from "../components/showcase-card";
import { type Locale } from "../i18n/config";
import { formatTemplate } from "../i18n/config";
import { showcaseContent } from "../i18n/showcase-content";

type BasicBlockProps = {
  locale: Locale;
};

export function BasicBlock({ locale }: BasicBlockProps) {
  const content = showcaseContent[locale].basic;

  return (
    <ShowcaseCard className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <GlButton variant="confirm">
          {content.button}
        </GlButton>
        <GlButton>
          {content.button}
        </GlButton>
        <GlButton category="tertiary">
          {content.button}
        </GlButton>
        <GlButton
          icon="ellipsis_h"
          size="small"
          aria-label={content.moreActions}
          className="ml-auto"/>
      </div>

      <GlFormInput placeholder={content.searchPlaceholder}/>

      <GlFormTextarea placeholder={content.sendPlaceholder}/>

      <div className="flex items-center">
        <GlBadge variant="tier" icon="license">
          {content.tier}
        </GlBadge>
        <GlFormRadio aria-label={content.radioLabel} className="ml-auto"/>
        <GlFormCheckbox ariaLabel={content.checkboxLabel} checked/>
        <GlToggle label={content.toggleLabel} labelPosition="hidden" />
      </div>

      <GlButtonGroup>
        {[1, 2, 3].map((value) => (
          <GlButton key={value}>
            {formatTemplate(content.buttonNumber, { number: value })}
          </GlButton>
        ))}
      </GlButtonGroup>

      <div className="flex flex-wrap justify-between gap-2">
        <GlModal>
          <GlModalTrigger asChild>
            <GlButton>
              {content.openModal}
            </GlButton>
          </GlModalTrigger>
          <GlModalContent>
            <GlModalHeader>
              <GlModalTitle>
                {content.modalTitle}
              </GlModalTitle>
            </GlModalHeader>
            <div>
              {content.modalBody}
            </div>
            <GlModalFooter>
              <GlModalClose variant="confirm">
                {content.confirm}
              </GlModalClose>
            </GlModalFooter>
          </GlModalContent>
        </GlModal>

        <GlDisclosureDropdown>
          <GlDisclosureDropdownTrigger>
            {content.dropdown}
          </GlDisclosureDropdownTrigger>
          <GlDisclosureDropdownContent>
            <GlDisclosureDropdownGroup>
              <GlDisclosureDropdownItem value="foo">
                {content.dropdownItems[0]}
              </GlDisclosureDropdownItem>
              <GlDisclosureDropdownItem value="bar">
                {content.dropdownItems[1]}
              </GlDisclosureDropdownItem>
            </GlDisclosureDropdownGroup>
          </GlDisclosureDropdownContent>
        </GlDisclosureDropdown>
      </div>
    </ShowcaseCard>
  );
}
