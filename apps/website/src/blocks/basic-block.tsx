import {
  GlBadge,
  GlButton,
  GlButtonGroup,
  GlDisclosureDropdown,
  GlDisclosureDropdownContent,
  GlDisclosureDropdownGroup,
  GlDisclosureDropdownItem,
  GlDisclosureDropdownTrigger,
  GlFormCheckbox,
  GlFormInput,
  GlFormRadio,
  GlFormTextarea,
  GlModal,
  GlModalClose,
  GlModalContent,
  GlModalFooter,
  GlModalHeader,
  GlModalTitle,
  GlModalTrigger,
  GlToggle
} from "gitlab-ui-react";
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
          <GlModalTrigger>
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
