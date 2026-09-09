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

export function BasicBlock() {
  return (
    <ShowcaseCard className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <GlButton variant="confirm">
          Button
        </GlButton>
        <GlButton>
          Button
        </GlButton>
        <GlButton category="tertiary">
          Button
        </GlButton>
        <GlButton
          icon="ellipsis_h"
          size="small"
          className="ml-auto!"/>
      </div>

      <GlFormInput placeholder="Search something..."/>

      <GlFormTextarea placeholder="Send message..."/>

      <div className="flex items-center">
        <GlBadge variant="tier" icon="license">
          Ultimate
        </GlBadge>
        <GlFormRadio className="ml-auto"/>
        <GlFormCheckbox checked/>
        <GlToggle />
      </div>

      <GlButtonGroup>
        {[1, 2, 3].map((value) => (
          <GlButton key={value}>
            Button {value}
          </GlButton>
        ))}
      </GlButtonGroup>

      <div className="flex justify-between">
        <GlModal>
          <GlModalTrigger>
            <GlButton>
              Open Modal
            </GlButton>
          </GlModalTrigger>
          <GlModalContent>
            <GlModalHeader>
              <GlModalTitle>
                Hello Pajamas!
              </GlModalTitle>
            </GlModalHeader>
            <div>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit,
              sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </div>
            <GlModalFooter>
              <GlModalClose variant="confirm">
                Confirm
              </GlModalClose>
            </GlModalFooter>
          </GlModalContent>
        </GlModal>

        <GlDisclosureDropdown>
          <GlDisclosureDropdownTrigger>
            Dropdown
          </GlDisclosureDropdownTrigger>
          <GlDisclosureDropdownContent>
            <GlDisclosureDropdownGroup>
              <GlDisclosureDropdownItem value="foo">
                Foo
              </GlDisclosureDropdownItem>
              <GlDisclosureDropdownItem value="bar">
                Bar
              </GlDisclosureDropdownItem>
            </GlDisclosureDropdownGroup>
          </GlDisclosureDropdownContent>
        </GlDisclosureDropdown>
      </div>
    </ShowcaseCard>
  );
}
